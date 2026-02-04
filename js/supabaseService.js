// supabaseService.js - Wrapper com chamadas comuns ao Supabase
// Trata erros de RLS / acesso negado e padroniza respostas

const SupabaseService = (function(){
    function ensureClient() {
        if (!window.supabaseClient) {
            throw new Error('Supabase client não inicializado. Configure SUPABASE_URL e SUPABASE_ANON_KEY.');
        }
        return window.supabaseClient;
    }

    // Normaliza diferentes esquemas de coluna na tabela `users` para um formato consistente
    function normalizeDbUser(dbUser) {
        if (!dbUser) return null;
        const name = dbUser.nome || dbUser.name || dbUser.full_name || dbUser.fullName || '';
        const email = dbUser.email || dbUser.mail || '';
        const status = dbUser.status || dbUser.statu || null;
        const tipo = dbUser.tipo || dbUser.role || dbUser.funcao || dbUser.function || null;
        const plano = dbUser.plano || dbUser.plan || dbUser.subscription_plan || null;
        const planId = dbUser.plan_id || dbUser.planId || null;
        const createdAt = dbUser.created_at || dbUser.createdAt || dbUser.joinDate || null;
        const lastLogin = dbUser.ultimo_login || dbUser.last_login || dbUser.lastLogin || dbUser.lastLoginAt || null;
        return {
            id: dbUser.id,
            nome: name,
            name: name,
            email: email,
            status: status,
            tipo: tipo,
            role: tipo,
            plano: plano,
            plan: plano,
            plan_id: planId,
            avatar: dbUser.avatar || dbUser.avatar_url || null,
            created_at: createdAt,
            ultimo_login: lastLogin,
            createdAt: createdAt,
            lastLogin: lastLogin
        };
    }

    async function signIn(email, password) {
        const supabase = ensureClient();
        // Autentica via Supabase Auth (senha nunca é armazenada no banco)
        const res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) return { success: false, error: res.error, status: res.status };

        const authUser = res.data?.user || null;
        if (!authUser) return { success: false, error: 'No auth user returned' };

        // Buscar dados na tabela `users` seguindo RLS e usando auth.uid()
        const dbRes = await fetchUserFromDB(authUser.id);
        if (!dbRes.success) {
            // Se for acesso negado por RLS, retorno padronizado
            await supabase.auth.signOut();
            return { success: false, error: dbRes.error || 'Could not fetch user record', accessDenied: dbRes.accessDenied };
        }

        const dbUser = dbRes.user;
        // Nunca permitir login se status diferente de 'ativo'
        if (!dbUser || String(dbUser.status || '').toLowerCase() !== 'ativo') {
            await supabase.auth.signOut();
            return { success: false, blocked: true, message: 'Conta inativa. Contate o suporte.' };
        }

        // Salvar estado global mínimo esperado pelo frontend
        window.currentUser = normalizeDbUser(dbUser);

        return { success: true, dbUser };
    }

    async function signOut() {
        const supabase = ensureClient();
        const res = await supabase.auth.signOut();
        if (res.error) return { success: false, error: res.error, status: res.status };
        return { success: true };
    }

    async function getUser() {
        const supabase = ensureClient();
        const res = await supabase.auth.getUser();
        if (res.error) return { success: false, error: res.error, status: res.status };
        const authUser = res.data?.user || null;
        if (!authUser) return { success: true, user: null, dbUser: null };

        // Buscar linha correspondente na tabela `users`
        const dbRes = await fetchUserFromDB(authUser.id);
        if (!dbRes.success) {
            return { success: false, error: dbRes.error, accessDenied: dbRes.accessDenied };
        }

        // Atualizar estado global
        const dbUser = dbRes.user;
        if (dbUser) {
            window.currentUser = normalizeDbUser(dbUser);
        } else {
            window.currentUser = null;
        }

        // Normalizar e retornar apenas os dados da tabela `users` como `user`
        const userObj = normalizeDbUser(dbUser);
        return { success: true, user: userObj };
    }

    function onAuthStateChange(cb) {
        if (!window.supabaseClient) return () => {};
        const { data: listener } = window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
            const authUser = session ? session.user : null;
            if (!authUser) {
                // limpar estado global quando sair
                window.currentUser = null;
                cb(event, null);
                return;
            }

            // Buscar registro na tabela `users` e atualizar estado global
            const dbRes = await fetchUserFromDB(authUser.id);
            if (dbRes.success && dbRes.user) {
                const norm = normalizeDbUser(dbRes.user);
                window.currentUser = norm;
                // chamar o callback apenas com o registro normalizado da tabela `users`
                cb(event, norm);
            } else {
                // se não conseguiu obter db user, limpar estado e informar null
                window.currentUser = null;
                cb(event, null);
            }
        });
        return () => listener?.subscription?.unsubscribe?.();
    }

    // Busca a linha da tabela `users` respeitando RLS e retornando apenas os campos reais
    async function fetchUserFromDB(userId) {
        const supabase = ensureClient();
        // Selecionar todas as colunas para evitar erro caso alguma coluna não exista
        const { data, error, status } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) return handleError(error, status);
        return { success: true, user: data };
    }

    // Buscar usuário por id e normalizar formato esperado pelo frontend
    async function fetchUserById(userId) {
        try {
            const res = await fetchUserFromDB(userId);
            if (!res.success) return res;
            const norm = normalizeDbUser(res.user);
            return { success: true, user: norm };
        } catch (err) {
            return { success: false, error: err.message || err };
        }
    }

    // Lista todos os usuários (normalizado) — relaciona users.plan_id com plans (LEFT JOIN behavior)
    async function getAllUsers() {
        const supabase = ensureClient();
        try {
            const { data: users, error: usersErr } = await supabase.from('users').select('*').order('created_at', { ascending: false });
            if (usersErr) throw usersErr;

            const userIds = (users || []).map(u => u.id).filter(Boolean);
            const subsMap = {};

            // Tentar buscar planos referenciados diretamente na tabela users via plan_id
            const planIds = (users || []).map(u => (u.plan_id ?? u.plano ?? u.plan)).filter(Boolean).map(String);
            let plansMap = {};
            if (planIds.length) {
                try {
                    const { data: plans, error: plansErr } = await supabase
                        .from('plans')
                        .select('id, nome')
                        .in('id', planIds);
                    if (!plansErr && plans && plans.length) {
                        plans.forEach(p => { plansMap[String(p.id)] = p; });
                    }
                } catch (err) {
                    // ignore plans failure — fallback later
                }
            }

            if (userIds.length) {
                try {
                    const { data: subs, error: subsErr } = await supabase
                        .from('subscriptions')
                        .select('user_id, plan_id, created_at, plan:plans(id, nome)')
                        .in('user_id', userIds);
                    if (!subsErr && subs && subs.length) {
                        subs.forEach(s => {
                            const uid = s.user_id;
                            if (!subsMap[uid] || new Date(s.created_at) > new Date(subsMap[uid].created_at)) {
                                subsMap[uid] = s;
                            }
                        });
                    }
                } catch (err) {
                    // ignore subscriptions join failure — fallback later
                }
            }

            const mapped = (users || []).map(u => {
                const norm = normalizeDbUser(u) || {};
                let planName = null;

                // Priorizar nome do plano vindo de users.plan_id -> plans.id
                const userPlanId = (u.plan_id ?? u.plano ?? norm.plan ?? null);
                if (userPlanId && plansMap[String(userPlanId)] && plansMap[String(userPlanId)].nome) {
                    planName = plansMap[String(userPlanId)].nome;
                }

                // Fallback: subscription join
                const s = subsMap[u.id];
                if (!planName && s && s.plan && s.plan.nome) planName = s.plan.nome;

                // Fallback final: propriedades antigas
                if (!planName) planName = u.plano_nome || u.planoName || norm.plan || norm.plano || null;

                return {
                    id: u.id,
                    name: norm.name || norm.nome || '',
                    email: norm.email || '',
                    planName: planName || null,
                    role: norm.role || norm.tipo || '',
                    status: norm.status || '',
                    createdAt: norm.createdAt || norm.created_at || null
                };
            });

            return { success: true, data: mapped };
        } catch (err) {
            // fallback: tentar select('*') e usar normalização antiga
            try {
                const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
                if (error) throw error;

                return {
                    success: true,
                    data: (data || []).map(u => {
                        const norm = normalizeDbUser(u) || {};
                        const planName = (u.planos && u.planos.length) ? u.planos[0].nome : (u.plano_nome || u.planoName || norm.plan || norm.plano || null);
                        return {
                            id: u.id,
                            name: norm.name || norm.nome || '',
                            email: norm.email || '',
                            planName: planName || null,
                            role: norm.role || norm.tipo || '',
                            status: norm.status || '',
                            createdAt: norm.createdAt || norm.created_at || null
                        };
                    })
                };
            } catch (err2) {
                return { success: false, error: err2.message || err.message };
            }
        }
    }

    // Subscriptions
    async function fetchSubscriptionByUser(userId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error) return handleError(error, status);
        return { success: true, subscription: data && data.length ? data[0] : null };
    }

    // Courses
    async function fetchActiveCourses() {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('courses')
            .select('*')
            .or('status.eq.active,is_active.eq.true');
        if (error) return handleError(error, status);
        return { success: true, courses: data || [] };
    }

    async function fetchCourseById(courseId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single();
        if (error) return handleError(error, status);
        return { success: true, course: data };
    }

    // Lessons
    async function fetchLessonsByCourse(courseId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('order', { ascending: true });
        if (error) return handleError(error, status);
        return { success: true, lessons: data || [] };
    }

    async function fetchLessonById(lessonId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', lessonId)
            .single();
        if (error) return handleError(error, status);
        return { success: true, lesson: data };
    }

    // Materials
    async function fetchMaterialsByLesson(lessonId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('lesson_materials')
            .select('*')
            .eq('lesson_id', lessonId);
        if (error) return handleError(error, status);
        return { success: true, materials: data || [] };
    }

    // Certificates
    async function fetchCertificatesByUser(userId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase
            .from('certificates')
            .select('*')
            .eq('user_id', userId);
        if (error) return handleError(error, status);
        return { success: true, certificates: data || [] };
    }

    async function fetchCourseTitle(courseId) {
        const res = await fetchCourseById(courseId);
        if (!res.success) return { success: false, error: res.error, status: res.status };
        return { success: true, title: res.course?.title || null };
    }

    // Plans
    async function fetchPlans() {
        const supabase = ensureClient();
        const { data, error, status } = await supabase.from('plans').select('id, nome').order('id', { ascending: true });
        if (error) return handleError(error, status);
        return { success: true, plans: data || [] };
    }

    function handleError(error, status) {
        // Tratar erros RLS/permisionamento como acesso negado
        if (status === 401 || status === 403) {
            return { success: false, accessDenied: true, error };
        }
        return { success: false, error };
    }

    // Escritas comuns
    async function createPaymentRecord(payload) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase.from('payments').insert([payload]).select();
        if (error) return handleError(error, status);
        return { success: true, payment: data && data[0] };
    }

    async function createSubscriptionRecord(payload) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase.from('subscriptions').insert([payload]).select();
        if (error) return handleError(error, status);
        return { success: true, subscription: data && data[0] };
    }

    async function addNotificationRecord(payload) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase.from('notifications').insert([payload]).select();
        if (error) return handleError(error, status);
        return { success: true, notification: data && data[0] };
    }

    async function updateUserProgress(userId, courseId, lessonId) {
        const supabase = ensureClient();
        // buscar progresso existente
        const { data: existing, error: selErr } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('course_id', courseId).limit(1);
        if (selErr) {
            // continue to try insert
        }

        let completed = [];
        if (existing && existing.length) {
            completed = existing[0].completed_lessons || [];
            if (!completed.includes(lessonId)) completed.push(lessonId);
            const progress = Math.round((completed.length / (await (async function(){ const l = await fetchLessonsByCourse(courseId); return (l.success ? l.lessons.length : 1); })())) * 100);
            const { data, error, status } = await supabase.from('user_progress').update({ completed_lessons: completed, last_accessed: new Date().toISOString(), progress }).eq('id', existing[0].id).select();
            if (error) return handleError(error, status);
            return { success: true, progress: data && data[0] };
        } else {
            completed = [lessonId];
            const totalLessons = await (async function(){ const l = await fetchLessonsByCourse(courseId); return (l.success ? l.lessons.length : 1); })();
            const progress = Math.round((completed.length / (totalLessons || 1)) * 100);
            const { data, error, status } = await supabase.from('user_progress').insert([{ user_id: userId, course_id: courseId, completed_lessons: completed, last_accessed: new Date().toISOString(), progress }]).select();
            if (error) return handleError(error, status);
            return { success: true, progress: data && data[0] };
        }
    }

    async function removeLessonFromProgress(userId, courseId, lessonId) {
        const supabase = ensureClient();
        const { data: existing, error: selErr } = await supabase.from('user_progress').select('*').eq('user_id', userId).eq('course_id', courseId).limit(1);
        if (selErr) return handleError(selErr, selErr.status);
        if (!existing || !existing.length) return { success: false, message: 'No progress found' };
        const row = existing[0];
        const completed = (row.completed_lessons || []).filter(id => id !== lessonId);
        const totalLessons = await (async function(){ const l = await fetchLessonsByCourse(courseId); return (l.success ? l.lessons.length : 1); })();
        const progress = Math.round((completed.length / (totalLessons || 1)) * 100);
        const { data, error, status } = await supabase.from('user_progress').update({ completed_lessons: completed, last_accessed: new Date().toISOString(), progress }).eq('id', row.id).select();
        if (error) return handleError(error, status);
        return { success: true, progress: data && data[0] };
    }

    async function createCertificateRecord(payload) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase.from('certificates').insert([payload]).select();
        if (error) return handleError(error, status);
        return { success: true, certificate: data && data[0] };
    }

    async function updateUserRecord(userId, updates) {
        const supabase = ensureClient();
        // Map frontend fields to DB columns used in your schema
        const payload = {};
        if (updates.name !== undefined) payload.nome = updates.name;
        if (updates.email !== undefined) payload.email = updates.email;
        if (updates.role !== undefined) payload.funcao = updates.role;
        if (updates.status !== undefined) payload.status = updates.status;
        if (updates.avatar !== undefined) payload.avatar = updates.avatar;
        // aceitar tanto updates.plan_id (numérico) quanto updates.plan (string ou id)
        if (updates.plan_id !== undefined) payload.plan_id = updates.plan_id;
        else if (updates.plan !== undefined) {
            // se for numérico, usar plan_id; caso contrário, manter campo legacy `plan`/`plano`
            const maybeNum = Number(updates.plan);
            if (!isNaN(maybeNum) && String(updates.plan).trim() !== '') payload.plan_id = maybeNum;
            else payload.plan = updates.plan;
        }
        payload.updated_at = new Date().toISOString();

        const { data, error, status } = await supabase.from('users').upsert([{ id: userId, ...payload }]).select();
        if (error) return handleError(error, status);
        return { success: true, user: data && data[0] };
    }

   async function createUserRecord(payload) {
        try {
            const supabase = ensureClient();

            let accessToken = null;
            try {
                const sessionRes = await supabase.auth.getSession();
                accessToken = sessionRes.data?.session?.access_token || null;
            } catch (e) {}

            const apiUrl =
                window.CREATE_USER_API_URL ||
                (window.SUPABASE_URL
                    ? String(window.SUPABASE_URL).replace(/\/$/, '') + '/functions/v1/create-user'
                    : '/api/create-user');

            const headers = {
                'Content-Type': 'application/json'
            };

            // opcional, mas ok manter
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }

            const resp = await fetch(apiUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    email: payload.email,
                    password: payload.password,
                    name: payload.name,
                    funcao: payload.role || payload.funcao,
                    status: payload.status ?? true,
                    plan_id: payload.plan_id ?? null
                })
            });

            const contentType = resp.headers.get('content-type') || '';
            const body = contentType.includes('application/json')
                ? await resp.json()
                : await resp.text();

            if (!resp.ok) {
                console.error('createUserRecord: endpoint returned error', resp.status, body);
                return { success: false, status: resp.status, error: body };
            }

            return body;

        } catch (err) {
            console.error('createUserRecord: unexpected error', err);
            return { success: false, error: err.message || String(err) };
        }
    }

    async function deleteUserRecord(userId) {
        const supabase = ensureClient();
        const { data, error, status } = await supabase.from('users').delete().eq('id', userId).select();
        if (error) return handleError(error, status);
        return { success: true };
    }

    return {
        signIn,
        signOut,
        getUser,
        fetchUserById,
        onAuthStateChange,
        fetchSubscriptionByUser,
        fetchActiveCourses,
        fetchCourseById,
        fetchLessonsByCourse,
        fetchLessonById,
        fetchPlans,
        updateUserRecord,
        fetchMaterialsByLesson,
        fetchCertificatesByUser,
        fetchCourseTitle,
        getAllUsers
        ,createUserRecord, deleteUserRecord
    };
})();

// Disponibilizar globalmente para uso simples em outros módulos
window.supabaseService = SupabaseService;

// Funções para Courses
async function getAllCourses() {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, courses: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getCourseById(id) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return { success: true, course: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getFeaturedCourses() {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('featured', true)
            .order('rating', { ascending: false })
            .limit(6);
        if (error) throw error;
        return { success: true, courses: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function fetchActiveCourses() {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, courses: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Funções para Lessons
async function getLessonsByCourseId(courseId) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('course_id', courseId)
            .order('order', { ascending: true });
        if (error) throw error;
        return { success: true, lessons: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getLessonById(id) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('lessons')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return { success: true, lesson: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Funções para Categories
async function getAllCategories() {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return { success: true, categories: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getCategoryById(id) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return { success: true, category: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Funções para Instructors
async function getAllInstructors() {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .order('name', { ascending: true });
        if (error) throw error;
        return { success: true, instructors: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getInstructorById(id) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('instructors')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return { success: true, instructor: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Funções para User Progress
async function getUserProgress(userId, courseId) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .single();
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
        return { success: true, progress: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getAllUserProgress(userId) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .order('last_accessed', { ascending: false });
        if (error) throw error;
        return { success: true, progresses: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function updateUserProgress(userId, courseId, lessonId) {
    const supabase = ensureClient();
    try {
        // First, get current progress
        const progressRes = await getUserProgress(userId, courseId);
        let progress = progressRes.progress || { user_id: userId, course_id: courseId, completed_lessons: [] };

        if (!progress.completed_lessons) progress.completed_lessons = [];
        if (!progress.completed_lessons.includes(lessonId)) {
            progress.completed_lessons.push(lessonId);
            progress.last_accessed = new Date().toISOString();
        }

        const { data, error } = await supabase
            .from('user_progress')
            .upsert(progress, { onConflict: 'user_id,course_id' });
        if (error) throw error;
        return { success: true, progress: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function removeLessonFromProgress(userId, courseId, lessonId) {
    const supabase = ensureClient();
    try {
        const progressRes = await getUserProgress(userId, courseId);
        if (!progressRes.success || !progressRes.progress) return { success: false, error: 'Progress not found' };

        let progress = progressRes.progress;
        progress.completed_lessons = progress.completed_lessons.filter(id => id !== lessonId);

        const { data, error } = await supabase
            .from('user_progress')
            .upsert(progress, { onConflict: 'user_id,course_id' });
        if (error) throw error;
        return { success: true, progress: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Funções para Notifications
async function addNotification(userId, notification) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                title: notification.title,
                message: notification.message,
                type: notification.type || 'info',
                created_at: new Date().toISOString()
            });
        if (error) throw error;
        return { success: true, notification: data };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

async function getUserNotifications(userId) {
    const supabase = ensureClient();
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        if (error) throw error;
        return { success: true, notifications: data || [] };
    } catch (err) {
        return { success: false, error: err.message || err };
    }
}

// Expor funções no window.supabaseService
window.supabaseService = {
    signIn,
    signOut,
    getUser,
    onAuthStateChange,
    fetchUserById,
    getAllUsers,
    fetchSubscriptionByUser,
    syncCache,
    // Novas funções
    getAllCourses,
    getCourseById,
    getFeaturedCourses,
    fetchActiveCourses,
    getLessonsByCourseId,
    getLessonById,
    getAllCategories,
    getCategoryById,
    getAllInstructors,
    getInstructorById,
    getUserProgress,
    getAllUserProgress,
    updateUserProgress,
    removeLessonFromProgress,
    addNotification,
    getUserNotifications
};
