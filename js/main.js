// main.js - Sistema principal
class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.initRoutes();
        this.checkAuth();
        this.initThemeToggle();
        this.initAuthEvents();
    }

    initRoutes() {
        router.registerRoute('painel-do-aluno', this.renderPainelDoAluno.bind(this));
        // rota 'courses' removida (página 'Meus Cursos' excluída)
        router.registerRoute('lessons', this.renderLessons.bind(this));
        router.registerRoute('certificates', this.renderCertificates.bind(this));
        router.registerRoute('profile', this.renderProfile.bind(this));
        router.registerRoute('subscription', this.renderSubscription.bind(this));
        router.registerRoute('payment', this.renderPayment.bind(this));
        router.registerRoute('settings', this.renderSettings.bind(this));
        
        // Admin routes
        router.registerRoute('admin-painel-do-aluno', () => admin.renderAdminPainelDoAluno());
        router.registerRoute('admin-courses', () => admin.renderAdminCourses());
        router.registerRoute('admin-users', () => admin.renderAdminUsers());
        router.registerRoute('admin-lessons', () => admin.renderAdminLessons());
    }

    checkAuth() {
        if (auth.isAuthenticated()) {
            auth.updateUIAfterLogin();
            
            if (!auth.hasActiveSubscription()) {
                router.navigateTo('subscription');
            }
        }
    }

    initThemeToggle() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-theme-toggle]')) {
                const currentTheme = ui.currentTheme;
                const newTheme = currentTheme === 'light' ? 'dark' : 'light';
                ui.setTheme(newTheme);
            }
        });
    }

    initAuthEvents() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('#logout-btn, #logout-menu-btn');
            if (!btn) return;
            e.preventDefault();
            auth.logout();

            // Garantir que a tela de login (tela inicial) esteja visível
            const loginScreen = document.getElementById('login-screen');
            const painel = document.getElementById('painel-do-aluno');
            if (loginScreen) loginScreen.classList.remove('hidden');
            if (painel) painel.classList.add('hidden');

            // Resetar rota atual e rolar ao topo
            if (window.router) router.currentRoute = null;
            window.scrollTo(0, 0);
        });
    }

    renderPainelDoAluno() {
        if (!auth.isAuthenticated() || !auth.hasActiveSubscription()) {
            if (auth.currentUser?.status === 'pending_payment') {
                router.navigateTo('payment');
                return;
            }
        }

        const content = document.getElementById('painel-do-aluno-content');
        const courses = database.getFeaturedCourses();
        const user = auth.getCurrentUser();

        // personalized summary data
        let greeting = '';
        let lastActivityText = 'Nenhuma atividade recente';
        if (user) {
            const progresses = database.data.userProgress.filter(p => p.userId === user.id);
            if (progresses.length > 0) {
                const last = progresses.slice().sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0];
                const lastCourse = last ? database.getCourseById(last.courseId) : null;
                const lessons = last ? database.getLessonsByCourseId(last.courseId) || [] : [];
                const nextLesson = last ? lessons.find(l => !last.completedLessons?.includes(l.id)) : null;
                if (lastCourse) {
                    greeting = `Olá, ${user.name.split(' ')[0]}! Você parou em <strong>${lastCourse.title}</strong>`;
                } else {
                    greeting = `Olá, ${user.name.split(' ')[0]}! Pronto para começar um novo curso?`;
                }
                if (nextLesson) {
                    lastActivityText = `Próxima aula: ${nextLesson.order}. ${nextLesson.title}`;
                } else if (lastCourse) {
                    lastActivityText = `Curso concluído`;
                } else {
                    lastActivityText = 'Nenhuma atividade recente';
                }
            } else {
                greeting = `Olá, ${user.name.split(' ')[0]}! Pronto para começar um novo curso?`;
            }
        }

        content.innerHTML = `
            <div class="painel-do-aluno-home">
                <div class="painel-do-aluno-header mb-6">
                    <div class="header-top flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div class="header-left">
                            <h1 class="text-3xl font-bold">Painel do Aluno</h1>
                            <p class="greeting text-lg font-semibold mt-2">${greeting || 'Bem-vindo de volta!'}</p>
                            <p class="greeting-sub text-sm text-gray mt-1">${lastActivityText}</p>
                            <div class="header-cta-mobile mt-3" style="display:none;">
                                <button class="btn btn-primary btn-resume-mobile" style="min-height:44px; width:100%; max-width:420px;">Continuar último curso</button>
                            </div>
                        </div>

                        <div class="header-actions mt-4 sm:mt-0 justify-end">
                            <button class="btn btn-primary" id="btn-resume-overall" style="min-height:44px; padding-left:18px; padding-right:18px; width:100%; max-width:220px;">Continuar último curso</button>
                        </div>
                    </div>
                </div>

                <div class="stats-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="stats-container">
                    <!-- Estatísticas serão carregadas aqui -->
                </div>

                <div class="painel-do-aluno-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="section-header mb-6">
                            <h2 class="text-xl font-bold">Cursos em Destaque</h2>
                            <a href="#" class="text-primary font-medium" data-route="painel-do-aluno">
                                Ver todos <i class="fas fa-arrow-right ml-1"></i>
                            </a>
                        </div>
                        <div class="courses-grid grid grid-cols-1 gap-6" id="featured-courses">
                            ${courses.slice(0, 2).map(course => this.renderCourseCard(course)).join('')}
                        </div>
                    </div>

                    <div>
                        <div class="section-header mb-6">
                            <h2 class="text-xl font-bold">Progresso Geral</h2>
                        </div>
                        <div class="progress-card" id="progress-container">
                            <!-- Progresso será carregado aqui -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadPainelDoAlunoStats();
        this.loadProgressData();
        this.addPainelDoAlunoEvents();
    }

    loadPainelDoAlunoStats() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const statsContainer = document.getElementById('stats-container');
        if (!statsContainer) return;

        // build more useful stats: horas estudadas, última atividade, próxima aula, cursos em andamento
        const progresses = (database.data.userProgress || []).filter(p => p.userId === user.id);
        const courses = database.getAllCourses();

        // horas estudadas = soma das durações das aulas completadas
        let minutesStudied = 0;
        progresses.forEach(p => {
            const lessons = database.getLessonsByCourseId(p.courseId) || [];
            (p.completedLessons || []).forEach(lessonId => {
                const lesson = lessons.find(l => l.id === lessonId);
                if (lesson && lesson.duration) minutesStudied += lesson.duration;
            });
        });
        const hoursStudied = (minutesStudied / 60).toFixed(1);

        // last activity
        let lastActivity = null;
        if (progresses.length > 0) {
            lastActivity = progresses.slice().sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0];
        }

        let nextLessonText = 'Nenhuma';
        if (lastActivity) {
            const lessons = database.getLessonsByCourseId(lastActivity.courseId) || [];
            const next = lessons.find(l => !lastActivity.completedLessons?.includes(l.id));
            if (next) nextLessonText = `${next.order}. ${next.title}`;
        }

        const coursesInProgress = progresses.length;

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-clock"></i>
                </div>
                <div class="stat-info">
                    <h3>${hoursStudied}</h3>
                    <p>Horas Estudadas</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-history"></i>
                </div>
                <div class="stat-info">
                    <h3 class="no-wrap">${lastActivity ? new Date(lastActivity.lastAccessed).toLocaleDateString() : '—'}</h3>
                    <p>Última Atividade</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-book-reader"></i>
                </div>
                <div class="stat-info">
                    <h3>${nextLessonText}</h3>
                    <p>Próxima Aula</p>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-layer-group"></i>
                </div>
                <div class="stat-info">
                    <h3>${coursesInProgress}</h3>
                    <p>Cursos em Andamento</p>
                </div>
            </div>
        `;
        this.addCertificateEvents();
    }

    loadProgressData() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const progressContainer = document.getElementById('progress-container');
        if (!progressContainer) return;

        const courses = database.getAllCourses();
        const userProgress = courses.map(course => {
            const progress = database.getUserProgress(user.id, course.id);
            return {
                course,
                progress: progress ? progress.progress : 0
            };
        }).filter(item => item.progress > 0);

        const totalCourses = courses.length;
        const coursesInProgress = userProgress.length;
        const overallProgress = coursesInProgress > 0 
            ? Math.round(userProgress.reduce((acc, item) => acc + item.progress, 0) / coursesInProgress)
            : 0;

        progressContainer.innerHTML = `
            <div class="progress-overview">
                <div class="progress-header mb-4">
                    <h3 class="text-lg font-bold">Seu Progresso</h3>
                    <span class="text-primary font-bold">${overallProgress}% completo</span>
                </div>
                
                <div class="progress-bar-large mb-4">
                    <div class="progress-fill" style="width: ${overallProgress}%"></div>
                </div>
                
                <div class="progress-meta text-sm">
                    <div class="progress-meta-item mb-2">
                        <div class="meta-title">Cursos iniciados</div>
                        <div class="meta-value">${coursesInProgress}/${totalCourses}</div>
                    </div>
                    <div class="progress-meta-item">
                        <div class="meta-title">Próximo certificado</div>
                        <div class="meta-value">${this.getNextCertificate(user)}</div>
                    </div>
                </div>
                
                ${coursesInProgress > 0 ? `
                    <div class="progress-details mt-6">
                        <h4 class="font-bold mb-3">Cursos em andamento:</h4>
                        <div class="space-y-3">
                            ${userProgress.slice(0, 3).map(item => `
                                <div class="course-progress-item">
                                    <div class="flex justify-between mb-1">
                                        <span class="text-sm">${item.course.title}</span>
                                        <span class="text-sm font-bold">${item.progress}%</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : `
                    <div class="empty-state-small text-center py-6">
                        <i class="fas fa-book text-gray mb-3"></i>
                        <p class="text-gray">Você ainda não começou nenhum curso</p>
                        <button class="btn btn-sm btn-primary mt-3" data-route="painel-do-aluno">
                            Explorar Cursos
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    getNextCertificate(user) {
        const courses = database.getAllCourses();
        for (const course of courses) {
            const progress = database.getUserProgress(user.id, course.id);
            if (progress && progress.progress >= 100) {
                const hasCertificate = database.getCertificatesByUserId(user.id)
                    .some(cert => cert.courseId === course.id);
                if (!hasCertificate) {
                    return course.title;
                }
            }
        }
        return "Complete um curso";
    }

    renderCourseCard(course) {
        const category = database.getCategoryById(course.categoryId);
        const instructor = database.getInstructorById(course.instructorId);
        const user = auth.getCurrentUser();
        const progress = user ? database.getUserProgress(user.id, course.id) : null;

        return `
            <div class="course-card hover-lift">
                <div class="course-image">
                    <img src="${course.image}" alt="${course.title}">
                    ${category ? `
                        <span class="course-category" style="background: ${category.color}20; color: ${category.color}">
                            ${category.name}
                        </span>
                    ` : ''}
                    <span class="course-level ${course.level}">
                        ${this.getLevelText(course.level)}
                    </span>
                </div>
                <div class="course-content">
                    <h3 class="course-title">${course.title}</h3>
                    <p class="course-description">${course.description}</p>

                    ${progress ? `
                        <div class="course-progress mt-4">
                            <div class="progress-info flex justify-between text-sm mb-2">
                                <span class="progress-label">Progresso</span>
                                <span class="progress-percent">${progress.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.progress}%"></div>
                            </div>
                        </div>
                    ` : ''}

                    <div class="course-footer mt-6 pt-6 border-t border-gray-light">
                        <div class="course-meta">
                            <div class="course-meta-left">
                                <span class="course-duration"><i class="fas fa-clock mr-1"></i> ${course.duration}h</span>
                                <span class="course-lessons"><i class="fas fa-play-circle mr-1"></i> ${course.lessons} aulas</span>
                            </div>
                            <div class="course-meta-right">
                                            ${user ? `
                                                ${progress && progress.progress >= 100 ? `
                                                    <div class="completed-actions">
                                                        <button class="btn btn-primary btn-continue" data-start-course="${course.id}">Rever aulas</button>
                                                        ${database.getCertificatesByUserId(user.id).some(c => c.courseId === course.id) ? `<a href="#" class="certificate-link text-primary ml-3" data-route="certificates">Ver certificado</a>` : ''}
                                                    </div>
                                                ` : `
                                                    <button class="btn btn-primary btn-continue" data-start-course="${course.id}">${progress?.progress > 0 ? 'Continuar' : 'Começar'}</button>
                                                `}
                                            ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        // resume button positioning handled by CSS (desktop/right, mobile/below)
    }

    addPainelDoAlunoEvents() {
        document.querySelectorAll('[data-start-course]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = parseInt(e.currentTarget.dataset.startCourse);
                this.startCourse(courseId);
            });
        });

        // resume overall last course CTA
        const resumeHandler = (e) => {
            const user = auth.getCurrentUser();
            if (!user) { ui.showAlert('Faça login para acessar os cursos', 'info'); return; }
            const progresses = (database.data.userProgress || []).filter(p => p.userId === user.id);
            if (progresses.length === 0) {
                ui.showAlert('Nenhum curso em andamento', 'info');
                return;
            }
            const last = progresses.slice().sort((a, b) => new Date(b.lastAccessed) - new Date(a.lastAccessed))[0];
            if (last && last.courseId) {
                this.startCourse(last.courseId);
            } else {
                ui.showAlert('Nenhuma atividade recente encontrada', 'info');
            }
        };

        // attach to desktop CTA and mobile inline CTA (if present)
        const resumeBtn = document.getElementById('btn-resume-overall');
        if (resumeBtn) resumeBtn.addEventListener('click', resumeHandler);
        document.querySelectorAll('.btn-resume-mobile').forEach(b => b.addEventListener('click', resumeHandler));

        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route;
                router.navigateTo(route);
            });
        });
    }

    startCourse(courseId) {
        const course = database.getCourseById(courseId);
        if (!course) return;

        const lessons = database.getLessonsByCourseId(courseId);
        const user = auth.getCurrentUser();
        
        if (user) {
            const userProgress = database.getUserProgress(user.id, courseId);
            const nextLesson = lessons.find(lesson => 
                !userProgress?.completedLessons?.includes(lesson.id)
            ) || lessons[0];
            
            if (nextLesson) {
                ui.showLesson(nextLesson.id);
            }
        } else {
            ui.showAlert('Faça login para acessar os cursos', 'info');
        }
    }

    // Página 'Meus Cursos' removida — renderCourses() excluído

    async renderLessons() {
        const content = document.getElementById('painel-do-aluno-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="lessons-page">
                <div class="lessons-header mb-6">
                    <h1 class="text-3xl font-bold">Minhas Aulas</h1>
                    <p class="text-gray mt-2">Acompanhe seu progresso em cada curso</p>
                </div>
            </div>
        `;

        if (!user) {
            content.innerHTML += `
                <div class="empty-state">
                    <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">Faça login para ver suas aulas</h3>
                    <p class="text-gray mb-6">Acesse sua conta para acompanhar seu progresso nas aulas.</p>
                    <button class="btn btn-primary" onclick="ui.openModal('login-screen')">Fazer Login</button>
                </div>
            `;
            return;
        }

        if (!auth.hasActiveSubscription()) {
            content.innerHTML += `
                <div class="empty-state">
                    <i class="fas fa-lock text-gray mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">Acesso bloqueado</h3>
                    <p class="text-gray mb-6">Sua assinatura não está ativa. Faça uma assinatura válida para acessar as aulas.</p>
                    <button class="btn btn-primary" data-route="subscription">Ver planos</button>
                </div>
            `;
            return;
        }

        // Buscar cursos ativos via Supabase se disponível
        let courses = [];
        if (window.supabaseService) {
            const cres = await window.supabaseService.fetchActiveCourses();
            if (cres.success) courses = cres.courses || [];
            else if (cres.accessDenied) {
                this.showAlert('Acesso negado aos cursos (RLS).', 'danger');
                return;
            }
        }

        if (!courses.length && window.database) courses = window.database.getAllCourses();

        // Render courses and lessons (local progress still used as fallback)
        const container = document.createElement('div');
        container.className = 'lessons-container';

        courses.forEach(course => {
            let lessons = [];
            if (window.supabaseService) {
                // note: Fire-and-forget fetching of lessons per course (could be optimized)
            }
            if (window.database && lessons.length === 0) lessons = window.database.getLessonsByCourseId(course.id);

            const userProgress = window.database ? window.database.getUserProgress(user.id, course.id) || { completedLessons: [] } : { completedLessons: [] };
            const completedLessons = userProgress.completedLessons || [];
            if (!lessons || lessons.length === 0) return;
            const nextLesson = lessons.find(l => !completedLessons.includes(l.id));
            const percent = Math.round((completedLessons.length / lessons.length) * 100);

            const courseHtml = document.createElement('div');
            courseHtml.className = 'course-section mb-6';
            courseHtml.innerHTML = `
                <div class="section-header mb-3">
                    <h2 class="course-section-title">${course.title}</h2>
                    <div class="course-header-sub text-sm text-gray">${completedLessons.length}/${lessons.length} aulas — ${percent}%</div>
                    <div class="course-progress-inline mt-2">
                        <div class="progress-bar-large" aria-hidden>
                            <div class="progress-fill" style="width: ${percent}%;"></div>
                        </div>
                    </div>
                </div>
                <div class="lessons-list">
                    ${lessons.map(lesson => {
                        const isCompleted = completedLessons.includes(lesson.id);
                        const isNext = nextLesson && lesson.id === nextLesson.id;
                        const lessonType = lesson.videoUrl ? 'Vídeo' : (lesson.resources && lesson.resources.length ? 'Recurso' : 'Link');
                        const pausedBadge = isNext && userProgress.lastAccessed ? true : false;
                        return `
                            <div class="lesson-item ${isCompleted ? 'completed' : isNext ? 'next' : ''}">
                                <div class="lesson-card ${isNext ? 'next-bg' : ''}">
                                    <div class="lesson-left">
                                        <div class="lesson-status ${isCompleted ? 'completed' : ''}">
                                            <i class="fas fa-${isCompleted ? 'check-circle' : 'play-circle'}"></i>
                                        </div>
                                        <div class="lesson-info">
                                            <h4 class="lesson-title">${lesson.order}. ${lesson.title}</h4>
                                            <p class="text-sm text-gray lesson-desc">${lesson.description || 'Sem descrição'}</p>
                                            <div class="lesson-meta text-sm text-gray mt-1">
                                                <span class="lesson-type-badge">${lessonType}</span>
                                                <span class="lesson-duration ml-2">${lesson.duration} min</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="lesson-actions">
                                        ${isNext ? `<span class="lesson-pill next-pill">Próxima aula</span>` : ''}
                                        ${pausedBadge ? `<span class="lesson-pill paused-pill">Você parou aqui</span>` : ''}
                                        ${isCompleted ? `
                                            <button class="btn btn-sm btn-outline" data-watch-lesson="${lesson.id}">
                                                <i class="fas fa-redo mr-1"></i> Revisar
                                            </button>
                                        ` : `
                                            <button class="btn btn-sm btn-primary" data-watch-lesson="${lesson.id}">
                                                <i class="fas fa-play mr-1"></i> Assistir aula
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;

            container.appendChild(courseHtml);
        });

        content.appendChild(container);
        this.addLessonEvents();
    }

    addLessonEvents() {
        document.querySelectorAll('[data-watch-lesson]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const lessonId = parseInt(e.currentTarget.dataset.watchLesson);
                ui.showLesson(lessonId);
            });
        });
    }

    async renderCertificates() {
        const content = document.getElementById('painel-do-aluno-content');
        const user = auth.getCurrentUser();
        // Compute progress info for header
        let allCourses = [];
        let certificates = [];
        if (window.supabaseService) {
            const cRes = await window.supabaseService.fetchCertificatesByUser(user?.id);
            if (cRes.success) certificates = cRes.certificates || [];
            else if (cRes.accessDenied) {
                this.showAlert('Acesso negado aos certificados (RLS).', 'danger');
                return;
            }
            const coursesRes = await window.supabaseService.fetchActiveCourses();
            if (coursesRes.success) allCourses = coursesRes.courses || [];
        }
        if (!allCourses.length && window.database) allCourses = database.getAllCourses();
        if (!certificates.length && window.database && user) certificates = database.getCertificatesByUserId(user.id) || [];

        const totalCourses = allCourses.length;

        // find courses completed (100%) regardless of certificate issuance
        const completedCourses = user ? allCourses.filter(c => {
            const p = window.database ? database.getUserProgress(user.id, c.id) : null;
            return p && p.progress >= 100;
        }) : [];
        const completedCount = completedCourses.length;
        const progressPercent = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;

        // courses completed but without certificate yet
        const coursesWithoutCert = completedCourses.filter(c => !certificates.some(cert => cert.courseId === c.id));

        content.innerHTML = `
            <div class="certificates-page">
                <div class="certificates-header mb-6">
                    <h1 class="text-3xl font-bold">Meus Certificados</h1>
                    <p class="text-gray mt-2">Certificados de conclusão dos cursos</p>
                </div>

                ${user ? `
                    <div class="certificates-top mb-6">
                        <div class="flex items-center justify-between flex-wrap">
                            <div class="progress-summary">
                                <div class="text-sm text-gray">Você concluiu <strong>${completedCount}</strong> de <strong>${totalCourses}</strong> cursos</div>
                                <div class="progress-bar-large mt-2" style="max-width:420px; background:var(--bg-light); border-radius:8px; height:10px; overflow:hidden;">
                                    <div class="progress-fill" style="width:${progressPercent}%; background:var(--primary-color); height:100%; border-radius:8px;"></div>
                                </div>
                            </div>
                            <div class="actions mt-3 md:mt-0">
                                <button class="btn btn-primary" data-route="painel-do-aluno">Ver cursos disponíveis</button>
                            </div>
                        </div>
                    </div>

                    <div id="certificates-container">
                        ${certificates.length === 0 && coursesWithoutCert.length === 0 ? `
                            <div class="empty-certificates flex flex-col items-center justify-center py-12 px-4 text-center">
                                <div class="cert-preview mb-6" style="width:320px; max-width:90%;">
                                    <div class="certificate-mockup rounded-lg shadow-sm" style="background:linear-gradient(180deg, rgba(255,255,255,0.9), rgba(250,250,255,0.9)); padding:24px; border-radius:12px;">
                                        <div style="display:flex;align-items:center;justify-content:center;padding:36px 0;filter:blur(0.6px);opacity:0.95;">
                                            <i class="fas fa-certificate text-primary text-4xl"></i>
                                        </div>
                                        <div style="text-align:center;color:var(--muted);font-size:12px;">Preview do certificado</div>
                                    </div>
                                </div>

                                <h3 class="text-xl font-bold mb-2">Nenhum certificado ainda</h3>
                                <p class="text-gray mb-6">Conclua seus cursos para desbloquear seus certificados.</p>

                                <div class="rules-card mb-6" style="background:var(--card-bg); padding:16px; border-radius:10px; max-width:560px; width:100%;">
                                    <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;align-items:flex-start;">
                                        <li style="display:flex;align-items:center;gap:8px;color:var(--text);"><i class="fas fa-check text-primary" style="width:18px"></i> Concluir 100% do curso</li>
                                        <li style="display:flex;align-items:center;gap:8px;color:var(--text);"><i class="fas fa-check text-primary" style="width:18px"></i> Cumprir requisitos obrigatórios</li>
                                        <li style="display:flex;align-items:center;gap:8px;color:var(--text);"><i class="fas fa-check text-primary" style="width:18px"></i> Finalizar avaliação (se existir)</li>
                                    </ul>
                                </div>

                                <div class="w-full max-w-sm">
                                    <button class="btn btn-primary btn-block" data-route="painel-do-aluno" style="border-radius:999px; width:100%;">Ver cursos disponíveis</button>
                                </div>
                            </div>
                        ` : `
                            ${certificates.length > 0 ? `
                                <div class="certificates-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                                    ${certificates.map(cert => {
                                        const course = allCourses.find(c => c.id === cert.courseId) || { title: 'Curso', level: 'beginner' };
                                        const levelText = this.getLevelText(course.level);
                                        const issued = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('pt-BR') : '-';
                                        return `
                                            <div class="certificate-card p-4 bg-white rounded-lg shadow-sm">
                                                <div class="flex items-start justify-between">
                                                    <div class="flex items-start gap-4">
                                                        <div class="cert-thumb rounded-md" style="width:72px;height:56px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg, rgba(245,242,255,0.6), rgba(243,240,255,0.6));border-radius:8px;">
                                                            <i class="fas fa-certificate text-primary text-2xl"></i>
                                                        </div>
                                                        <div>
                                                            <h4 class="font-bold mb-1">${course.title}</h4>
                                                            <div class="text-sm text-gray">${levelText} • Concluído em ${issued}</div>
                                                        </div>
                                                    </div>
                                                    <div class="flex items-center gap-2">
                                                        <button class="btn btn-sm btn-outline" data-view-certificate="${cert.id}"><i class="fas fa-eye mr-2"></i>Ver</button>
                                                        <button class="btn btn-sm btn-primary" data-download-certificate="${cert.id}"><i class="fas fa-download mr-2"></i>Baixar</button>
                                                        <button class="btn btn-sm btn-outline" data-share-certificate="${cert.id}"><i class="fas fa-share-alt mr-2"></i>Compartilhar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    }).join('')}
                                </div>
                            ` : ''}

                            ${coursesWithoutCert.length > 0 ? `
                                <div class="pending-certificates">
                                    <h3 class="text-lg font-bold mb-3">Certificados aguardando emissão</h3>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        ${coursesWithoutCert.map(course => {
                                            const prog = database.getUserProgress(user.id, course.id) || {};
                                            const completedAt = prog.lastAccessed ? new Date(prog.lastAccessed).toLocaleDateString('pt-BR') : '-';
                                            return `
                                                <div class="pending-card p-4 bg-white rounded-lg shadow-sm flex items-center justify-between">
                                                    <div>
                                                        <div class="text-sm text-gray">${course.title}</div>
                                                        <div class="text-xs text-gray mt-1">Concluído em ${completedAt}</div>
                                                    </div>
                                                    <div>
                                                        <button class="btn btn-sm btn-primary" data-claim-certificate="${course.id}">Reivindicar certificado</button>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        `}
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver seus certificados</h3>
                        <p class="text-gray mb-6">Acesse sua conta para visualizar e gerenciar seus certificados conquistados.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">Fazer Login</button>
                    </div>
                `}
            </div>
        `;
    }

    renderUserCertificates(user) {
        const certificates = database.getCertificatesByUserId(user.id) || [];
        const courses = database.getAllCourses();

        // Map to cards layout
        return certificates.map(cert => {
            const course = courses.find(c => c.id === cert.courseId) || { title: 'Curso', level: 'beginner' };
            const levelText = this.getLevelText(course.level);
            const issued = cert.issuedAt ? new Date(cert.issuedAt).toLocaleDateString('pt-BR') : '-';

            return `
                <div class="certificate-card p-4 bg-white rounded-lg shadow-sm">
                    <div class="flex items-start justify-between">
                        <div class="flex items-start gap-4">
                            <div class="cert-thumb rounded-md" style="width:72px;height:56px;display:flex;align-items:center;justify-content:center;background:linear-gradient(180deg, rgba(245,242,255,0.6), rgba(243,240,255,0.6));border-radius:8px;">
                                <i class="fas fa-certificate text-primary text-2xl"></i>
                            </div>
                            <div>
                                <h4 class="font-bold mb-1">${course.title}</h4>
                                <div class="text-sm text-gray">${levelText} • Concluído em ${issued}</div>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <button class="btn btn-sm btn-outline" data-view-certificate="${cert.id}"><i class="fas fa-eye mr-2"></i>Ver</button>
                            <button class="btn btn-sm btn-primary" data-download-certificate="${cert.id}"><i class="fas fa-download mr-2"></i>Baixar</button>
                            <button class="btn btn-sm btn-outline" data-share-certificate="${cert.id}"><i class="fas fa-share-alt mr-2"></i>Compartilhar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    addCertificateEvents() {
        // View
        document.querySelectorAll('[data-view-certificate]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.viewCertificate);
                const cert = database.data.certificates.find(c => c.id === id) || null;
                const course = cert ? database.getCourseById(cert.courseId) : null;
                const user = auth.getCurrentUser();

                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width:760px;">
                        <div class="modal-header">
                            <h2>Visualizar Certificado</h2>
                            <button class="modal-close">&times;</button>
                        </div>
                        <div class="modal-body">
                            <div style="padding:24px; text-align:center;">
                                <div style="font-size:36px;color:var(--primary-color);"><i class="fas fa-certificate"></i></div>
                                <h3 class="mt-3">${course ? course.title : 'Certificado'}</h3>
                                <p class="text-gray">Emitido para ${user ? user.name : ''}</p>
                                <p class="text-sm text-gray mt-2">Emitido em ${cert ? new Date(cert.issuedAt).toLocaleDateString('pt-BR') : '-'}</p>
                            </div>
                        </div>
                        <div class="modal-actions">
                            <button class="btn btn-outline modal-close">Fechar</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));
                modal.addEventListener('click', (ev) => { if (ev.target === modal) modal.remove(); });
            });
        });

        // Download (placeholder behavior)
        document.querySelectorAll('[data-download-certificate]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.currentTarget.dataset.downloadCertificate);
                const cert = database.data.certificates.find(c => c.id === id) || null;
                if (cert && cert.pdfUrl) {
                    window.open(cert.pdfUrl, '_blank');
                    return;
                }
                // fallback: generate simple text certificate
                const course = cert ? database.getCourseById(cert.courseId) : null;
                const user = auth.getCurrentUser();
                const text = `Certificado de conclusão\nCurso: ${course ? course.title : ''}\nAluno: ${user ? user.name : ''}\nEmitido em: ${cert ? new Date(cert.issuedAt).toLocaleDateString('pt-BR') : new Date().toLocaleDateString('pt-BR')}`;
                const blob = new Blob([text], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificado-${id || 'download'}.txt`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                ui.showAlert('Download iniciado (arquivo de texto placeholder)', 'success');
            });
        });

        // Share
        document.querySelectorAll('[data-share-certificate]').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(e.currentTarget.dataset.shareCertificate);
                const shareUrl = `${location.origin}${location.pathname}#cert-${id}`;
                if (navigator.share) {
                    try { await navigator.share({ title: 'Meu Certificado', text: 'Veja meu certificado', url: shareUrl }); }
                    catch (err) { ui.showAlert('Compartilhamento cancelado', 'info'); }
                } else if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareUrl).then(() => ui.showAlert('Link do certificado copiado', 'success'));
                } else {
                    ui.showAlert('Não foi possível compartilhar neste dispositivo', 'warning');
                }
            });
        });

        // Claim / create certificate for completed courses
        document.querySelectorAll('[data-claim-certificate]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = parseInt(e.currentTarget.dataset.claimCertificate);
                const user = auth.getCurrentUser();
                if (!user) { ui.showAlert('Faça login para reivindicar certificados', 'warning'); return; }

                const already = database.getCertificatesByUserId(user.id).some(c => c.courseId === courseId);
                if (already) { ui.showAlert('Certificado já emitido', 'info'); this.renderCertificates(); return; }

                // Create certificate record
                const course = database.getCourseById(courseId);
                const cert = database.createCertificate({ userId: user.id, courseId, courseTitle: course ? course.title : '' });
                ui.showAlert('Certificado emitido com sucesso!', 'success');
                // re-render certificates to show new card
                this.renderCertificates();
            });
        });
    }

    renderProfile() {
        const content = document.getElementById('painel-do-aluno-content');
        const user = auth.getCurrentUser();

        const profilePlanId = (function() {
            if (user && typeof user.plan === 'string' && user.plan) return user.plan;
            if (auth && auth.subscription) {
                const s = auth.subscription;
                if (typeof s.plan === 'string' && s.plan) return s.plan;
                if (typeof s.plan_id === 'string' && s.plan_id) return s.plan_id;
            }
            return localStorage.getItem('selected-plan') || 'junior';
        })();

        // compact paddings to avoid vertical scroll on 100% zoom
        content.innerHTML = `
            <div class="profile-page">
                <div class="profile-header-page mb-6">
                    <div class="container flex justify-between items-center">
                        <div>
                            <h1 class="text-3xl font-bold">${user ? user.name : 'Meu Perfil'}</h1>
                            <p class="text-gray mt-1">${user ? user.email : ''}</p>
                        </div>
                        <div class="profile-header-actions">
                            <button class="btn btn-primary btn-sm" id="edit-profile-btn"><i class="fas fa-user-edit mr-2"></i>Editar Perfil</button>
                        </div>
                    </div>
                </div>

                ${user ? `
                    <div class="profile-card-page p-5 bg-white rounded-lg shadow mb-6">
                        <div class="profile-grid">
                            <div class="profile-left profile-left-fixed">
                                <div class="profile-avatar-wrap">
                                    <div class="profile-avatar-circle">
                                        <img id="profile-avatar-img" src="${user.avatar}" alt="${user.name}">
                                    </div>
                                    <div class="avatar-edit-overlay" id="avatar-edit-overlay" title="Alterar foto">
                                        <i class="fas fa-pencil-alt"></i>
                                    </div>
                                    <input id="avatar-file-input" type="file" accept="image/*" class="hidden" />
                                </div>
                                    <div class="mt-4 profile-badges">
                                    <span class="badge badge-primary">${this.getPlanText(profilePlanId)}</span>
                                </div>
                                <div class="mt-6 profile-metrics">
                                    <div class="metrics-grid">
                                        <div class="metric-card">
                                            <div class="metric-icon"><i class="fas fa-play-circle"></i></div>
                                            <div class="metric-value">${database.getAllCourses().filter(c => {
                                                const progress = database.getUserProgress(user.id, c.id);
                                                return progress && progress.progress > 0;
                                            }).length}</div>
                                            <div class="metric-label">Cursos</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-icon"><i class="fas fa-certificate"></i></div>
                                            <div class="metric-value">${database.getCertificatesByUserId(user.id).length}</div>
                                            <div class="metric-label">Certificados</div>
                                        </div>
                                        <div class="metric-card">
                                            <div class="metric-icon"><i class="fas fa-calendar-day"></i></div>
                                            <div class="metric-value">${user && user.createdAt ? Math.ceil((new Date() - new Date(user.createdAt)) / (1000 * 60 * 60 * 24)) : '-'}</div>
                                            <div class="metric-label">Dias</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="profile-right">
                                <div class="section">
                                    <h3 class="section-title">Informações da Conta</h3>
                                    <ul class="account-info-list">
                                        <li><span class="info-key">Data de cadastro</span><span class="info-val">${user && user.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '-'}</span></li>
                                        <li><span class="info-key">Último login</span><span class="info-val">${user && user.lastLogin ? new Date(user.lastLogin).toLocaleString('pt-BR') : '-'}</span></li>
                                        <li><span class="info-key">Status</span><span class="info-val">${(function(){ const s = user && user.status; const active = (s === true) || (typeof s === 'string' && ['ativo','active'].includes(s.toLowerCase())); return `<span class="status-badge ${active ? 'status-active' : 'status-inactive'}">${active ? '<i class="fas fa-check-circle"></i> Ativo' : '<i class="fas fa-clock"></i> Inativo'}</span>`; })()}</span></li>
                                        <li><span class="info-key">Tipo de conta</span><span class="info-val">${user.role === 'admin' ? 'Administrador' : 'Estudante'}</span></li>
                                        <li><span class="info-key">Plano atual</span><span class="info-val">${this.getPlanText(profilePlanId)}</span></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver seu perfil</h3>
                        <p class="text-gray mb-6">Acesse sua conta para visualizar e editar seu perfil.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">
                            Fazer Login
                        </button>
                    </div>
                `}
            </div>
        `;

        this.addProfileEvents();
    }

    addProfileEvents() {
        // Primary edit button
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => this.showEditProfileForm());
        // Secondary actions
        document.getElementById('btn-edit-profile')?.addEventListener('click', () => this.showEditProfileForm());
        document.getElementById('btn-change-password')?.addEventListener('click', () => ui.openModal('change-password'));
        document.getElementById('btn-manage-plan')?.addEventListener('click', () => ui.openRoute ? ui.openRoute('subscription') : router.navigateTo('subscription'));
        document.getElementById('btn-logout')?.addEventListener('click', () => {
            auth.logout();
            ui.showAlert('Você saiu da conta', 'info');
            this.renderDashboard();
        });

        // Avatar edit overlay + file input
        const avatarOverlay = document.getElementById('avatar-edit-overlay');
        const avatarInput = document.getElementById('avatar-file-input');
        const avatarImg = document.getElementById('profile-avatar-img');

        avatarOverlay?.addEventListener('click', () => avatarInput?.click());
        avatarInput?.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(ev) {
                const dataUrl = ev.target.result;
                if (avatarImg) avatarImg.src = dataUrl;
                const user = auth.getCurrentUser();
                if (user) {
                    try { auth.updateUserProfile({ avatar: dataUrl }); } catch (err) { /* noop if not available */ }
                    ui.showAlert('Foto de perfil atualizada', 'success');
                }
            };
            reader.readAsDataURL(file);
        });
    }

    showEditProfileForm() {
        const user = auth.getCurrentUser();
        if (!user) return;
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content profile-modal">
                <div class="modal-header">
                    <h2>Editar Perfil</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-profile-form" class="modal-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-name">Nome completo</label>
                                <input type="text" id="edit-name" value="${user.name}" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-email">E‑mail</label>
                                <input type="email" id="edit-email" value="${user.email}" required>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-password">Nova senha (opcional)</label>
                                <div class="input-with-icon">
                                    <input type="password" id="edit-password" placeholder="Deixe em branco para manter a senha">
                                    <button type="button" class="toggle-password" data-target="edit-password"><i class="fas fa-eye"></i></button>
                                </div>
                            </div>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label for="edit-password-confirm">Confirmar senha</label>
                                <div class="input-with-icon">
                                    <input type="password" id="edit-password-confirm" placeholder="Digite novamente">
                                    <button type="button" class="toggle-password" data-target="edit-password-confirm"><i class="fas fa-eye"></i></button>
                                </div>
                            </div>
                        </div>

                        <div class="modal-actions">
                            <div class="actions-right">
                                <button type="submit" class="btn btn-primary">Salvar alterações</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // close handlers
        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        // password toggle
        modal.querySelectorAll('.toggle-password').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetId = btn.dataset.target;
                const input = modal.querySelector(`#${targetId}`);
                if (!input) return;
                if (input.type === 'password') { input.type = 'text'; btn.querySelector('i').classList.replace('fa-eye', 'fa-eye-slash'); }
                else { input.type = 'password'; btn.querySelector('i').classList.replace('fa-eye-slash', 'fa-eye'); }
            });
        });

        const form = modal.querySelector('#edit-profile-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = modal.querySelector('#edit-name').value.trim();
            const email = modal.querySelector('#edit-email').value.trim();
            const password = modal.querySelector('#edit-password').value;
            const confirm = modal.querySelector('#edit-password-confirm').value;

            if (!name || !email) { ui.showAlert('Nome e e‑mail são obrigatórios', 'warning'); return; }
            if (password && password !== confirm) { ui.showAlert('As senhas não coincidem', 'warning'); return; }

            const payload = { name, email };
            if (password) payload.password = password;

            try {
                auth.updateUserProfile(payload);
                ui.showAlert('Perfil atualizado com sucesso!', 'success');
                modal.remove();
                // re-render profile to reflect changes
                this.renderProfile();
            } catch (err) {
                ui.showAlert('Não foi possível atualizar o perfil', 'danger');
            }
        });
    }

    renderSubscription() {
        const content = document.getElementById('painel-do-aluno-content');
        const user = auth.getCurrentUser();
        // Determinar o plano do usuário de forma segura: user.plan -> assinatura -> localStorage -> default
        const planId = (function() {
            if (user && typeof user.plan === 'string' && user.plan) return user.plan;
            if (auth && auth.subscription) {
                const s = auth.subscription;
                if (typeof s.plan === 'string' && s.plan) return s.plan;
                if (typeof s.plan_id === 'string' && s.plan_id) return s.plan_id;
                if (typeof s.planName === 'string' && s.planName) return s.planName;
            }
            const sel = localStorage.getItem('selected-plan');
            return sel || 'junior';
        })();

        content.innerHTML = `
            <div class="subscription-page">
                <div class="subscription-header mb-6">
                    <div class="container">
                        <h1 class="text-3xl font-bold">Minha Assinatura</h1>
                        <p class="text-gray mt-2">Gerencie seu plano de assinatura</p>
                    </div>
                </div>

                ${user ? `
                    <div class="subscription-content container">
                        <div class="subscription-grid" style="display:flex;gap:1.25rem;align-items:flex-start;flex-wrap:wrap;">
                            <div class="plan-card">
                                <div class="plan-card-head">
                                    <div>
                                        <h3 class="text-xl font-bold">${this.getPlanText(planId)}</h3>
                                        <div class="text-gray text-sm" style="margin-top:4px;">Plano Ativo <span class="badge badge-accent" style="margin-left:8px;">Plano Ativo</span></div>
                                    </div>
                                    <div class="plan-price">
                                        <div class="plan-price-amount">R$ ${CONFIG.PLANS[planId.toUpperCase()]?.price || 0}</div>
                                        <div class="plan-price-period">por mês</div>
                                    </div>
                                </div>
                                <div class="plan-validity">
                                    <i class="fas fa-calendar-alt"></i>
                                    <div class="plan-validity-text">Válido até <strong class="plan-validity-date">${user.renewalDate ? new Date(user.renewalDate).toLocaleDateString('pt-BR') : new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString('pt-BR')}</strong></div>
                                </div>

                                <div class="plan-actions">
                                    <div class="plan-actions-row">
                                        <button class="btn btn-danger" id="cancel-subscription-btn"><i class="fas fa-ban mr-2"></i>Cancelar Assinatura</button>
                                    </div>
                                    <div class="plan-actions-note">Você continuará com acesso até o final do período vigente.</div>
                                </div>
                            </div>

                            <div class="payments-column" style="flex:1;min-width:320px;">
                                <div class="payment-history bg-white rounded-lg shadow p-4">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                                        <h3 class="text-lg font-bold">Histórico de Pagamentos</h3>
                                    </div>
                                    <div class="admin-table-container">
                                        ${database.getPaymentsForUser ? `
                                            ${(() => {
                                                const payments = database.getPaymentsForUser(user.id) || [];
                                                if (payments.length === 0) return `
                                                    <div class="empty-payments text-gray">Nenhum pagamento encontrado.</div>
                                                `;
                                                return `
                                                    <table class="admin-table payments-table">
                                                        <thead>
                                                            <tr>
                                                                <th>Data</th>
                                                                <th>Valor</th>
                                                                <th>Plano</th>
                                                                <th>Status</th>
                                                                <th>Ações</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            ${payments.map(p => `
                                                                <tr>
                                                                    <td>${new Date(p.date).toLocaleDateString('pt-BR')}</td>
                                                                    <td>R$ ${p.amount.toFixed(2)}</td>
                                                                    <td>${p.planName}</td>
                                                                    <td><span class="badge ${p.status === 'paid' ? 'badge-accent' : 'badge-warning'}">${p.status === 'paid' ? 'Pago' : p.status}</span></td>
                                                                    <td>${p.receiptUrl ? `<button class="btn btn-sm btn-outline btn-receipt" data-url="${p.receiptUrl}"><i class="fas fa-file-alt mr-1"></i>Comprovante</button>` : ''}</td>
                                                                </tr>
                                                            `).join('')}
                                                        </tbody>
                                                    </table>
                                                `;
                                            })()}
                                        ` : `
                                            <table class="admin-table payments-table">
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Valor</th>
                                                        <th>Plano</th>
                                                        <th>Status</th>
                                                        <th>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        <td>${new Date().toLocaleDateString('pt-BR')}</td>
                                                        <td>R$ ${CONFIG.PLANS[planId.toUpperCase()]?.price || 0}</td>
                                                                            <td>${this.getPlanText(planId)}</td>
                                                        <td><span class="badge badge-accent">${user.status === 'active' ? 'Pago' : 'Pendente'}</span></td>
                                                        <td>${user.status === 'active' ? `<button class="btn btn-sm btn-outline btn-receipt"><i class="fas fa-file-alt mr-1"></i>Comprovante</button>` : ''}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="empty-state container">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver sua assinatura</h3>
                        <p class="text-gray mb-6">Acesse sua conta para gerenciar seu plano de assinatura.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">Fazer Login</button>
                    </div>
                `}
            </div>
        `;

        this.addSubscriptionEvents();
    }

    addSubscriptionEvents() {
        // Cancel subscription -> open confirmation modal
        document.getElementById('cancel-subscription-btn')?.addEventListener('click', () => {
            const modal = document.createElement('div');
            modal.className = 'modal admin-user-modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width:520px;">
                    <div class="modal-header">
                        <h2>Cancelar Assinatura</h2>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-text-content">
                            <h3>Tem certeza que deseja cancelar sua assinatura?</h3>
                            <p>O cancelamento não remove o acesso imediatamente. Você continuará com acesso até a data final do seu plano.</p>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Voltar</button>
                            <button type="button" class="btn btn-danger" id="confirm-cancel-subscription"><i class="fas fa-ban mr-2"></i> Confirmar Cancelamento</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelectorAll('.modal-close').forEach(b => b.addEventListener('click', () => modal.remove()));
            modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

            modal.querySelector('#confirm-cancel-subscription')?.addEventListener('click', () => {
                // Keep business logic unchanged: show alert and close modal
                ui.showAlert('Assinatura cancelada. Você manterá acesso até o fim do período vigente.', 'success');
                modal.remove();
            });
        });

        // Alterar plano
        document.getElementById('change-plan-btn')?.addEventListener('click', () => {
            if (router && router.navigateTo) router.navigateTo('subscription');
        });

        // Receipt buttons
        document.querySelectorAll('.btn-receipt').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const url = e.currentTarget.dataset.url;
                if (url) window.open(url, '_blank'); else ui.showAlert('Comprovante indisponível', 'warning');
            });
        });

        // data-route navigation
        document.querySelectorAll('[data-route]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route;
                router.navigateTo(route);
            });
        });
    }

    renderPayment() {
        const content = document.getElementById('painel-do-aluno-content');
        const user = auth.getCurrentUser();

        if (!user || user.status !== 'pending_payment') {
            router.navigateTo('painel-do-aluno');
            return;
        }

        const selectedPlan = localStorage.getItem('selected-plan') || 'junior';
        const plan = CONFIG.PLANS[selectedPlan.toUpperCase()];

        content.innerHTML = `
            <div class="payment-page">
                <div class="payment-header text-center mb-8">
                    <h1 class="text-3xl font-bold mb-4">Complete sua Assinatura</h1>
                    <p class="text-gray">Escolha um plano para acessar todos os cursos</p>
                </div>
                
                <div class="payment-container max-w-4xl mx-auto">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                        ${Object.values(CONFIG.PLANS).map(p => `
                            <div class="plan-card ${selectedPlan === p.id ? 'selected' : ''} 
                                                  ${p.id === 'pleno' ? 'featured' : ''}">
                                <div class="plan-card-header">
                                    <h3 class="text-xl font-bold">${p.name}</h3>
                                    ${p.id === 'pleno' ? 
                                        '<span class="plan-badge">Mais Popular</span>' : ''}
                                    ${selectedPlan === p.id ? 
                                        '<span class="plan-badge badge-accent">Selecionado</span>' : ''}
                                </div>
                                
                                <div class="plan-price text-center my-6">
                                    <div class="text-4xl font-bold text-primary">R$ ${p.price}</div>
                                    <div class="text-gray">por mês</div>
                                </div>
                                
                                <p class="plan-description text-center text-gray mb-6">
                                    ${p.description}
                                </p>
                                
                                <ul class="plan-features mb-8">
                                    ${p.features.map(feature => `
                                        <li class="flex items-center gap-3 mb-3">
                                            <i class="fas fa-check text-accent"></i>
                                            <span>${feature}</span>
                                        </li>
                                    `).join('')}
                                </ul>
                                
                                <button class="btn ${selectedPlan === p.id ? 'btn-primary' : 'btn-outline'} btn-block"
                                        data-select-plan="${p.id}">
                                    ${selectedPlan === p.id ? 'Plano Selecionado' : 'Selecionar Plano'}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="payment-actions text-center">
                        <button class="btn btn-primary btn-lg px-8" 
                                data-process-payment="${selectedPlan}"
                                id="process-payment-btn">
                            <i class="fas fa-lock mr-2"></i>
                            Finalizar Pagamento - R$ ${plan.price}/mês
                        </button>
                        
                        <p class="text-sm text-gray mt-4">
                            <i class="fas fa-shield-alt mr-1"></i>
                            Pagamento seguro processado pelo Mercado Pago
                        </p>
                    </div>
                </div>
            </div>
        `;

        this.addPaymentEvents();
    }

    addPaymentEvents() {
        document.querySelectorAll('[data-select-plan]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planId = e.currentTarget.dataset.selectPlan;
                localStorage.setItem('selected-plan', planId);
                this.renderPayment();
            });
        });

        const processBtn = document.getElementById('process-payment-btn');
        if (processBtn) {
            processBtn.addEventListener('click', async () => {
                const planId = processBtn.dataset.processPayment;
                
                processBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processando...';
                processBtn.disabled = true;
                
                try {
                    await ui.processPayment(planId);
                } catch (error) {
                    ui.showAlert('Erro ao processar pagamento', 'danger');
                    processBtn.innerHTML = '<i class="fas fa-lock"></i> Finalizar Pagamento';
                    processBtn.disabled = false;
                }
            });
        }
    }

    renderSettings() {
        const content = document.getElementById('painel-do-aluno-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="settings-page">
                <div class="settings-header-hero">
                    <div style="font-size:28px; color:var(--primary-color);"><i class="fas fa-cog"></i></div>
                    <div>
                        <div class="settings-hero-title">Configurações</div>
                        <div class="settings-hero-sub">Personalize sua experiência, segurança e privacidade</div>
                    </div>
                </div>
                
                ${user ? `
                    <div class="settings-sections">
                        <div class="settings-grid">
                            <div class="settings-card">
                                <h3 class="text-lg font-bold mb-3">Conta & Notificações</h3>
                                <div class="setting-item">
                                    <i class="fas fa-bell"></i>
                                    <div>
                                        <h4 class="font-bold">Notificações</h4>
                                        <p class="text-sm text-gray">Ative ou desative notificações em tempo real</p>
                                    </div>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="notifications-toggle" ${user.preferences?.notifications ? 'checked' : ''}>
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <i class="fas fa-envelope"></i>
                                    <div>
                                        <h4 class="font-bold">E-mails</h4>
                                        <p class="text-sm text-gray">Receba atualizações e promoções por e-mail</p>
                                    </div>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="emails-toggle" ${user.preferences?.emails ? 'checked' : ''}>
                                    </div>
                                </div>

                                <!-- Perfil removido conforme solicitação -->
                            </div>

                            <!-- Bloco 'Segurança' removido conforme solicitação -->

                            <div class="settings-card danger-zone">
                                <h3 class="text-lg font-bold mb-3 text-danger">Zona de Perigo</h3>
                                <p class="text-sm text-gray mb-3">Ações nesta área são irreversíveis. Faça backup antes de prosseguir.</p>
                                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                                    <button class="btn btn-outline-danger" id="export-data-btn">
                                        <i class="fas fa-download"></i> Exportar Meus Dados
                                    </button>
                                    <button class="btn btn-danger" id="delete-account-btn">
                                        <i class="fas fa-trash"></i> Excluir Minha Conta
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver as configurações</h3>
                        <p class="text-gray mb-6">Acesse sua conta para configurar suas preferências.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">
                            Fazer Login
                        </button>
                    </div>
                `}
            </div>
        `;

        this.addSettingsEvents();
    }

    addSettingsEvents() {
        // 'change-password-btn' removed from layout; handler omitted

        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            this.exportUserData();
        });

        document.getElementById('delete-account-btn')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
                this.deleteAccount();
            }
        });

        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.currentTarget.dataset.theme;
                ui.setTheme(theme);
            });
        });

        document.getElementById('notifications-toggle')?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            auth.updateUserProfile({
                preferences: {
                    ...auth.currentUser.preferences,
                    notifications: isChecked
                }
            });
            ui.showAlert(`Notificações ${isChecked ? 'ativadas' : 'desativadas'}`, 'success');
        });

        document.getElementById('emails-toggle')?.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            auth.updateUserProfile({
                preferences: {
                    ...auth.currentUser.preferences,
                    emails: isChecked
                }
            });
            ui.showAlert(`E-mails ${isChecked ? 'ativados' : 'desativados'}`, 'success');
        });
    }

    exportUserData() {
        const user = auth.getCurrentUser();
        if (!user) {
            ui.showAlert('Faça login para exportar seus dados', 'warning');
            return;
        }

        const data = {
            user: { ...user },
            progress: database.data.userProgress.filter(p => p.userId === user.id),
            certificates: database.getCertificatesByUserId(user.id),
            payments: database.getPaymentsByUserId(user.id),
            notifications: database.getUserNotifications(user.id)
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `novatek-data-${user.id}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        ui.showAlert('Exportação concluída: arquivo JSON gerado', 'success');
    }

    deleteAccount() {
        const user = auth.getCurrentUser();
        if (!user) {
            ui.showAlert('Faça login para excluir sua conta', 'warning');
            return;
        }

        // Soft-delete: marcar status e limpar dados sensíveis
        database.updateUser(user.id, {
            status: 'deleted',
            email: `deleted+${user.id}@novatek.local`,
            name: 'Conta excluída',
            avatar: '',
            preferences: {}
        });

        ui.showAlert('Conta marcada como excluída. Você será deslogado.', 'info');
        auth.logout();
    }

    showChangePasswordForm() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Alterar Senha</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="change-password-form">
                        <div class="form-group">
                            <label for="current-password">Senha Atual</label>
                            <input type="password" id="current-password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="new-password">Nova Senha</label>
                            <input type="password" id="new-password" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirm-password">Confirmar Nova Senha</label>
                            <input type="password" id="confirm-password" required>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Alterar Senha</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        const form = modal.querySelector('#change-password-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const newPassword = modal.querySelector('#new-password').value;
            const confirmPassword = modal.querySelector('#confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                ui.showAlert('As senhas não coincidem!', 'danger');
                return;
            }
            
            ui.showAlert('Senha alterada com sucesso!', 'success');
            modal.remove();
        });
    }

    getLevelText(level) {
        const texts = {
            'beginner': 'Iniciante',
            'intermediate': 'Intermediário',
            'advanced': 'Avançado'
        };
        return texts[level] || level;
    }

    getPlanText(plan) {
        const texts = {
            'junior': 'Júnior',
            'pleno': 'Pleno',
            'senior': 'Sênior'
        };
        return texts[plan] || plan;
    }

    getStatusText(status) {
        const texts = {
            'active': 'Ativo',
            'pending_payment': 'Pagamento Pendente',
            'inactive': 'Inativo'
        };
        return texts[status] || status;
    }
}

// Inicializar aplicação
const app = new MainApp();