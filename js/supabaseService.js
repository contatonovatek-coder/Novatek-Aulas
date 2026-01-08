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
        // try update profiles table
        const { data, error, status } = await supabase.from('profiles').upsert({ id: userId, ...updates }).select();
        if (error) return handleError(error, status);
        return { success: true, profile: data && data[0] };
    }

    return {
        signIn,
        signOut,
        getUser,
        onAuthStateChange,
        fetchSubscriptionByUser,
        fetchActiveCourses,
        fetchCourseById,
        fetchLessonsByCourse,
        fetchLessonById,
        fetchMaterialsByLesson,
        fetchCertificatesByUser,
        fetchCourseTitle
    };
})();

// Disponibilizar globalmente para uso simples em outros módulos
window.supabaseService = SupabaseService;

// Sincronização de cache para compatibilidade com o backend local existente
SupabaseService.syncCache = async function() {
    try {
        const supabase = ensureClient();
        // buscar dados que o frontend espera em modo read-first
        const [coursesRes, lessonsRes, materialsRes, categoriesRes, instructorsRes] = await Promise.all([
            supabase.from('courses').select('*'),
            supabase.from('lessons').select('*'),
            supabase.from('lesson_materials').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('instructors').select('*')
        ]);

        const user = (await SupabaseService.getUser()).user;

        let subscriptionsRes = { data: [] };
        let certificatesRes = { data: [] };
        let paymentsRes = { data: [] };
        let userProgressRes = { data: [] };
        let notificationsRes = { data: [] };

        if (user) {
            subscriptionsRes = await supabase.from('subscriptions').select('*').eq('user_id', user.id);
            certificatesRes = await supabase.from('certificates').select('*').eq('user_id', user.id);
            paymentsRes = await supabase.from('payments').select('*').eq('user_id', user.id);
            userProgressRes = await supabase.from('user_progress').select('*').eq('user_id', user.id);
            notificationsRes = await supabase.from('notifications').select('*').eq('user_id', user.id);
        }

        // Merge into a structure compatible with local `database.data`
        const remoteData = {
            courses: coursesRes.data || [],
            lessons: lessonsRes.data || [],
            lesson_materials: materialsRes.data || [],
            categories: categoriesRes.data || [],
            instructors: instructorsRes.data || [],
            subscriptions: subscriptionsRes.data || [],
            certificates: certificatesRes.data || [],
            payments: paymentsRes.data || [],
            userProgress: userProgressRes.data || [],
            notifications: notificationsRes.data || []
        };

        // Atualizar cache local `window.database.data` quando possível
        if (window.database && window.database.data) {
            // manter campos existentes e sobrescrever com dados remotos quando disponíveis
            window.database.data.courses = remoteData.courses.length ? remoteData.courses : (window.database.data.courses || []);
            window.database.data.lessons = remoteData.lessons.length ? remoteData.lessons : (window.database.data.lessons || []);
            window.database.data.subscriptions = remoteData.subscriptions.length ? remoteData.subscriptions : (window.database.data.subscriptions || []);
            window.database.data.certificates = remoteData.certificates.length ? remoteData.certificates : (window.database.data.certificates || []);
            window.database.data.payments = remoteData.payments.length ? remoteData.payments : (window.database.data.payments || []);
            window.database.data.userProgress = remoteData.userProgress.length ? remoteData.userProgress : (window.database.data.userProgress || []);
            window.database.data.notifications = remoteData.notifications.length ? remoteData.notifications : (window.database.data.notifications || []);
            window.database.data.categories = remoteData.categories.length ? remoteData.categories : (window.database.data.categories || []);
            window.database.data.instructors = remoteData.instructors.length ? remoteData.instructors : (window.database.data.instructors || []);
            window.database.data.lesson_materials = remoteData.lesson_materials.length ? remoteData.lesson_materials : (window.database.data.lesson_materials || []);
        }

        return { success: true, data: remoteData };
    } catch (err) {
        return { success: false, error: err };
    }
};
