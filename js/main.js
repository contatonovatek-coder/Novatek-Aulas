// main.js - Sistema principal
class MainApp {
    constructor() {
        this.init();
    }

    init() {
        this.initRoutes();
        this.checkAuth();
        this.initThemeToggle();
    }

    initRoutes() {
        router.registerRoute('dashboard', this.renderDashboard.bind(this));
        router.registerRoute('courses', this.renderCourses.bind(this));
        router.registerRoute('lessons', this.renderLessons.bind(this));
        router.registerRoute('certificates', this.renderCertificates.bind(this));
        router.registerRoute('profile', this.renderProfile.bind(this));
        router.registerRoute('subscription', this.renderSubscription.bind(this));
        router.registerRoute('payment', this.renderPayment.bind(this));
        router.registerRoute('settings', this.renderSettings.bind(this));
        
        // Admin routes
        router.registerRoute('admin-dashboard', () => admin.renderAdminDashboard());
        router.registerRoute('admin-courses', () => admin.renderAdminCourses());
        router.registerRoute('admin-users', () => admin.renderAdminUsers());
        router.registerRoute('admin-lessons', () => admin.renderAdminLessons());
    }

    checkAuth() {
        if (auth.isAuthenticated()) {
            ui.updateUIAfterLogin();
            
            if (auth.currentUser.status === 'pending_payment') {
                router.navigateTo('payment');
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

    renderDashboard() {
        if (!auth.isAuthenticated() || !auth.hasActiveSubscription()) {
            if (auth.currentUser?.status === 'pending_payment') {
                router.navigateTo('payment');
                return;
            }
        }

        const content = document.getElementById('dashboard-content');
        const courses = database.getFeaturedCourses();
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="dashboard-home">
                <div class="dashboard-header mb-8">
                    <h1 class="text-3xl font-bold">Dashboard</h1>
                    <p class="text-gray mt-2">Bem-vindo de volta! Aqui está seu resumo.</p>
                </div>
                
                <div class="stats-cards grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="stats-container">
                    <!-- Estatísticas serão carregadas aqui -->
                </div>
                
                <div class="dashboard-grid grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                        <div class="section-header mb-6">
                            <h2 class="text-xl font-bold">Cursos em Destaque</h2>
                            <a href="#" class="text-primary font-medium" data-route="courses">
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

        this.loadDashboardStats();
        this.loadProgressData();
        this.addDashboardEvents();
    }

    loadDashboardStats() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const statsContainer = document.getElementById('stats-container');
        if (!statsContainer) return;

        const courses = database.getAllCourses();
        const userProgress = courses.map(course => 
            database.getUserProgress(user.id, course.id)
        ).filter(Boolean);

        const totalProgress = userProgress.length > 0 
            ? Math.round(userProgress.reduce((acc, p) => acc + p.progress, 0) / userProgress.length)
            : 0;

        const certificates = database.getCertificatesByUserId(user.id);
        const activeDays = Math.ceil((new Date() - new Date(user.joinDate)) / (1000 * 60 * 60 * 24));

        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-book-open"></i>
                </div>
                <div class="stat-info">
                    <h3>${userProgress.length}</h3>
                    <p>Cursos em Andamento</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="stat-info">
                    <h3>${totalProgress}%</h3>
                    <p>Progresso Médio</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-certificate"></i>
                </div>
                <div class="stat-info">
                    <h3>${certificates.length}</h3>
                    <p>Certificados</p>
                </div>
            </div>
            
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <div class="stat-info">
                    <h3>${activeDays}</h3>
                    <p>Dias Ativo</p>
                </div>
            </div>
        `;
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
                        <button class="btn btn-sm btn-primary mt-3" data-route="courses">
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
                    
                    <!-- instructor removed per design request -->
                    
                    ${progress ? `
                        <div class="course-progress mt-4">
                            <div class="progress-info flex justify-between text-sm mb-1">
                                <span>Progresso</span>
                                <span>${progress.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.progress}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="course-footer mt-6 pt-6 border-t border-gray-light">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center gap-4">
                                <span class="text-sm text-gray">
                                    <i class="fas fa-clock mr-1"></i> ${course.duration}h
                                </span>
                                <span class="text-sm text-gray">
                                    <i class="fas fa-play-circle mr-1"></i> ${course.lessons} aulas
                                </span>
                            </div>
                            ${user ? `
                                <button class="btn btn-sm ${progress?.progress > 0 ? 'btn-primary' : 'btn-outline'}"
                                        data-start-course="${course.id}">
                                    ${progress?.progress > 0 ? 'Continuar' : 'Começar'}
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    addDashboardEvents() {
        document.querySelectorAll('[data-start-course]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = parseInt(e.currentTarget.dataset.startCourse);
                this.startCourse(courseId);
            });
        });

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

    renderCourses() {
        const content = document.getElementById('dashboard-content');
        const courses = database.getAllCourses();
        const categories = database.getAllCategories();
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="courses-page">
                <div class="courses-header mb-8">
                    <h1 class="text-3xl font-bold">Todos os Cursos</h1>
                    <p class="text-gray mt-2">Aprenda programação com nossos cursos especializados</p>
                </div>
                
                <div class="courses-filters mb-8">
                    <div class="filter-group">
                        <label for="category-filter">Filtrar por categoria:</label>
                        <select id="category-filter" class="filter-select">
                            <option value="all">Todas as categorias</option>
                            ${categories.map(cat => `
                                <option value="${cat.id}">${cat.name}</option>
                            `).join('')}
                        </select>
                        
                        <label for="level-filter">Nível:</label>
                        <select id="level-filter" class="filter-select">
                            <option value="all">Todos os níveis</option>
                            <option value="beginner">Iniciante</option>
                            <option value="intermediate">Intermediário</option>
                            <option value="advanced">Avançado</option>
                        </select>
                    </div>
                </div>
                
                <div class="courses-grid-page grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="courses-grid">
                    ${courses.map(course => this.renderCourseCardFull(course)).join('')}
                </div>
            </div>
        `;

        this.addCourseFilters();
        this.addCourseEvents();
    }

    renderCourseCardFull(course) {
        const category = database.getCategoryById(course.categoryId);
        const instructor = database.getInstructorById(course.instructorId);
        const user = auth.getCurrentUser();
        const progress = user ? database.getUserProgress(user.id, course.id) : null;

        return `
            <div class="course-card hover-lift" data-category="${course.categoryId}" data-level="${course.level}">
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
                    
                    <div class="course-meta flex items-center gap-4 mt-4">
                        <span class="text-sm text-gray">
                            <i class="fas fa-clock mr-1"></i> ${course.duration}h
                        </span>
                        <span class="text-sm text-gray">
                            <i class="fas fa-play-circle mr-1"></i> ${course.lessons} aulas
                        </span>
                        <span class="text-sm text-gray">
                            <i class="fas fa-star mr-1"></i> ${course.rating}
                        </span>
                    </div>
                    
                    <!-- instructor removed per design request -->
                    
                    ${progress ? `
                        <div class="course-progress mt-4">
                            <div class="progress-info flex justify-between text-sm mb-1">
                                <span>Progresso</span>
                                <span>${progress.progress}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${progress.progress}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="course-actions mt-6">
                        ${user ? `
                            <button class="btn btn-sm ${progress?.progress > 0 ? 'btn-primary' : 'btn-outline'} btn-block"
                                    data-start-course="${course.id}">
                                ${progress?.progress > 0 ? 'Continuar Curso' : progress?.progress === 100 ? 'Revisar' : 'Começar Agora'}
                            </button>
                        ` : `
                            <button class="btn btn-sm btn-primary btn-block" onclick="ui.showAlert('Faça login para acessar os cursos', 'info')">
                                Acessar Curso
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    addCourseFilters() {
        const categoryFilter = document.getElementById('category-filter');
        const levelFilter = document.getElementById('level-filter');

        const applyFilters = () => {
            const selectedCategory = categoryFilter.value;
            const selectedLevel = levelFilter.value;
            
            document.querySelectorAll('.course-card').forEach(card => {
                const category = card.dataset.category;
                const level = card.dataset.level;
                
                const categoryMatch = selectedCategory === 'all' || category === selectedCategory;
                const levelMatch = selectedLevel === 'all' || level === selectedLevel;
                
                card.style.display = categoryMatch && levelMatch ? 'block' : 'none';
            });
        };

        if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
        if (levelFilter) levelFilter.addEventListener('change', applyFilters);
    }

    addCourseEvents() {
        document.querySelectorAll('[data-start-course]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const courseId = parseInt(e.currentTarget.dataset.startCourse);
                this.startCourse(courseId);
            });
        });
    }

    renderLessons() {
        const content = document.getElementById('dashboard-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="lessons-page">
                <div class="lessons-header mb-8">
                    <h1 class="text-3xl font-bold">Minhas Aulas</h1>
                    <p class="text-gray mt-2">Acompanhe seu progresso em cada curso</p>
                </div>
                
                ${user ? `
                    <div class="lessons-container">
                        ${database.getAllCourses().map(course => {
                            const lessons = database.getLessonsByCourseId(course.id);
                            const userProgress = database.getUserProgress(user.id, course.id);
                            const completedLessons = userProgress?.completedLessons || [];
                            
                            if (lessons.length === 0) return '';
                            
                            return `
                                <div class="course-section mb-8">
                                    <div class="section-header mb-4">
                                        <h2 class="text-xl font-bold">${course.title}</h2>
                                        <span class="text-primary font-bold">
                                            ${completedLessons.length}/${lessons.length} aulas
                                        </span>
                                    </div>
                                    
                                    <div class="lessons-list">
                                        ${lessons.map(lesson => {
                                            const isCompleted = completedLessons.includes(lesson.id);
                                            return `
                                                <div class="lesson-item ${isCompleted ? 'completed' : ''}">
                                                    <div class="flex items-center justify-between p-4 bg-white rounded-lg shadow">
                                                        <div class="flex items-center gap-4">
                                                            <div class="lesson-status ${isCompleted ? 'completed' : ''}">
                                                                <i class="fas fa-${isCompleted ? 'check-circle' : 'play-circle'}"></i>
                                                            </div>
                                                            <div>
                                                                <h4 class="mb-1 font-medium">${lesson.order}. ${lesson.title}</h4>
                                                                <p class="text-sm text-gray">${lesson.description || 'Sem descrição'}</p>
                                                            </div>
                                                        </div>
                                                        <div class="flex items-center gap-4">
                                                            <span class="text-sm text-gray">${lesson.duration} min</span>
                                                            <button class="btn btn-sm ${isCompleted ? 'btn-outline' : 'btn-primary'}" 
                                                                    data-watch-lesson="${lesson.id}">
                                                                <i class="fas fa-${isCompleted ? 'redo' : 'play'}"></i>
                                                                ${isCompleted ? 'Revisar' : 'Assistir'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver suas aulas</h3>
                        <p class="text-gray mb-6">Acesse sua conta para acompanhar seu progresso nas aulas.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">
                            Fazer Login
                        </button>
                    </div>
                `}
            </div>
        `;

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

    renderCertificates() {
        const content = document.getElementById('dashboard-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="certificates-page">
                <div class="certificates-header mb-8">
                    <h1 class="text-3xl font-bold">Meus Certificados</h1>
                    <p class="text-gray mt-2">Certificados de conclusão dos cursos</p>
                </div>
                
                ${user ? `
                    <div class="certificates-grid grid grid-cols-1 md:grid-cols-2 gap-6" id="certificates-container">
                        ${this.renderUserCertificates(user)}
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver seus certificados</h3>
                        <p class="text-gray mb-6">Acesse sua conta para visualizar seus certificados conquistados.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">
                            Fazer Login
                        </button>
                    </div>
                `}
            </div>
        `;
    }

    renderUserCertificates(user) {
        const certificates = database.getCertificatesByUserId(user.id);
        const courses = database.getAllCourses();
        
        if (certificates.length === 0) {
            return `
                <div class="col-span-2">
                    <div class="empty-state">
                        <i class="fas fa-graduation-cap text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Nenhum certificado ainda</h3>
                        <p class="text-gray mb-6">Complete seus cursos para obter certificados.</p>
                        <button class="btn btn-primary" data-route="courses">
                            <i class="fas fa-book mr-2"></i> Ver Cursos
                        </button>
                    </div>
                </div>
            `;
        }
        
        return certificates.map(cert => {
            const course = courses.find(c => c.id === cert.courseId);
            if (!course) return '';
            
            return `
                <div class="certificate-card">
                    <div class="certificate-header">
                        <i class="fas fa-certificate text-primary text-2xl"></i>
                        <div>
                            <h3 class="font-bold">${course.title}</h3>
                            <p class="text-sm text-gray">Emitido em ${new Date(cert.issuedAt).toLocaleDateString('pt-BR')}</p>
                        </div>
                    </div>
                    <div class="certificate-body">
                        <p class="text-gray mb-2">Certificado de conclusão emitido para</p>
                        <h4 class="text-xl font-bold mb-2">${user.name}</h4>
                        <p class="text-gray">pela conclusão do curso ${course.title}</p>
                    </div>
                    <div class="certificate-actions">
                        <button class="btn btn-outline" data-view-certificate="${cert.id}">
                            <i class="fas fa-eye mr-2"></i> Visualizar
                        </button>
                        <button class="btn btn-primary" data-download-certificate="${cert.id}">
                            <i class="fas fa-download mr-2"></i> Baixar PDF
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderProfile() {
        const content = document.getElementById('dashboard-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="profile-page">
                <div class="profile-header-page mb-8">
                    <h1 class="text-3xl font-bold">Meu Perfil</h1>
                    <button class="btn btn-primary" id="edit-profile-btn">
                        <i class="fas fa-edit mr-2"></i> Editar Perfil
                    </button>
                </div>
                
                ${user ? `
                    <div class="profile-card-page">
                        <div class="profile-avatar-section">
                            <div class="profile-avatar-large">
                                <img src="${user.avatar}" alt="${user.name}">
                                <button class="btn-change-avatar" id="change-avatar-btn">
                                    <i class="fas fa-camera"></i>
                                </button>
                            </div>
                            <div class="profile-info-section">
                                <h2 class="text-2xl font-bold">${user.name}</h2>
                                <p class="profile-email-page text-gray">${user.email}</p>
                                <span class="profile-plan-badge">Plano ${this.getPlanText(user.plan)}</span>
                            </div>
                        </div>
                        
                        <div class="profile-stats-page grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                            <div class="profile-stat-item">
                                <h3 class="text-2xl font-bold">${database.getAllCourses().filter(c => {
                                    const progress = database.getUserProgress(user.id, c.id);
                                    return progress && progress.progress > 0;
                                }).length}</h3>
                                <p class="text-sm text-gray">Cursos Iniciados</p>
                            </div>
                            <div class="profile-stat-item">
                                <h3 class="text-2xl font-bold">${database.getCertificatesByUserId(user.id).length}</h3>
                                <p class="text-sm text-gray">Certificados</p>
                            </div>
                            <div class="profile-stat-item">
                                <h3 class="text-2xl font-bold">${Math.ceil((new Date() - new Date(user.joinDate)) / (1000 * 60 * 60 * 24))}</h3>
                                <p class="text-sm text-gray">Dias na plataforma</p>
                            </div>
                            <div class="profile-stat-item">
                                <h3 class="text-2xl font-bold">${user.role === 'admin' ? 'Administrador' : 'Estudante'}</h3>
                                <p class="text-sm text-gray">Tipo de Conta</p>
                            </div>
                        </div>
                        
                        <div class="profile-details">
                            <h3 class="text-xl font-bold mb-4">Informações da Conta</h3>
                            <div class="info-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="info-item">
                                    <span class="info-label">Data de Cadastro</span>
                                    <span class="info-value">${new Date(user.joinDate).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Último Login</span>
                                    <span class="info-value">${new Date(user.lastLogin).toLocaleDateString('pt-BR')}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Status da Conta</span>
                                    <span class="info-value badge ${user.status === 'active' ? 'badge-accent' : 'badge-warning'}">
                                        ${this.getStatusText(user.status)}
                                    </span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Plano Atual</span>
                                    <span class="info-value">${this.getPlanText(user.plan)}</span>
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
        document.getElementById('edit-profile-btn')?.addEventListener('click', () => {
            this.showEditProfileForm();
        });

        document.getElementById('change-avatar-btn')?.addEventListener('click', () => {
            ui.showAlert('Funcionalidade de alterar avatar em desenvolvimento', 'info');
        });
    }

    showEditProfileForm() {
        const user = auth.getCurrentUser();
        if (!user) return;

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>Editar Perfil</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="edit-profile-form">
                        <div class="form-group">
                            <label for="edit-name">Nome Completo</label>
                            <input type="text" id="edit-name" value="${user.name}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-email">E-mail</label>
                            <input type="email" id="edit-email" value="${user.email}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="edit-avatar">URL do Avatar</label>
                            <input type="text" id="edit-avatar" value="${user.avatar}" placeholder="URL da imagem">
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Salvar Alterações</button>
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

        const form = modal.querySelector('#edit-profile-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const name = modal.querySelector('#edit-name').value;
            const email = modal.querySelector('#edit-email').value;
            const avatar = modal.querySelector('#edit-avatar').value;
            
            auth.updateUserProfile({ name, email, avatar });
            ui.showAlert('Perfil atualizado com sucesso!', 'success');
            modal.remove();
        });
    }

    renderSubscription() {
        const content = document.getElementById('dashboard-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="subscription-page">
                <div class="subscription-header mb-8">
                    <h1 class="text-3xl font-bold">Minha Assinatura</h1>
                    <p class="text-gray mt-2">Gerencie seu plano de assinatura</p>
                </div>
                
                ${user ? `
                    <div class="subscription-content">
                        <div class="current-plan mb-8">
                            <div class="section-header mb-4">
                                <h2 class="text-xl font-bold">Plano Atual</h2>
                                <span class="text-accent font-bold">${this.getPlanText(user.plan)}</span>
                            </div>
                            <div class="current-plan-details p-6 bg-white rounded-lg shadow">
                                <div class="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 class="text-xl font-bold">Plano ${this.getPlanText(user.plan)}</h3>
                                        <p class="text-gray">Válido até ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    <div class="text-right">
                                        <div class="text-2xl font-bold">R$ ${CONFIG.PLANS[user.plan.toUpperCase()]?.price || 0}</div>
                                        <p class="text-gray">por mês</p>
                                    </div>
                                </div>
                                ${user.status === 'active' ? `
                                    <button class="btn btn-danger" id="cancel-subscription-btn">
                                        <i class="fas fa-ban mr-2"></i> Cancelar Assinatura
                                    </button>
                                ` : `
                                    <button class="btn btn-primary" data-route="payment">
                                        <i class="fas fa-credit-card mr-2"></i> Ativar Assinatura
                                    </button>
                                `}
                            </div>
                        </div>
                        
                        <div class="payment-history">
                            <h3 class="text-xl font-bold mb-4">Histórico de Pagamentos</h3>
                            <div class="admin-table-container">
                                <table class="admin-table">
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
                                            <td>R$ ${CONFIG.PLANS[user.plan.toUpperCase()]?.price || 0}</td>
                                            <td>${this.getPlanText(user.plan)}</td>
                                            <td><span class="badge badge-accent">${user.status === 'active' ? 'Ativo' : 'Pendente'}</span></td>
                                            <td>
                                                ${user.status === 'active' ? `
                                                    <button class="btn btn-sm btn-outline">Comprovante</button>
                                                ` : ''}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="empty-state">
                        <i class="fas fa-sign-in-alt text-gray mb-4"></i>
                        <h3 class="text-xl font-bold mb-2">Faça login para ver sua assinatura</h3>
                        <p class="text-gray mb-6">Acesse sua conta para gerenciar seu plano de assinatura.</p>
                        <button class="btn btn-primary" onclick="ui.openModal('login-screen')">
                            Fazer Login
                        </button>
                    </div>
                `}
            </div>
        `;

        this.addSubscriptionEvents();
    }

    addSubscriptionEvents() {
        document.getElementById('cancel-subscription-btn')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja cancelar sua assinatura?')) {
                ui.showAlert('Assinatura cancelada com sucesso!', 'success');
            }
        });

        document.querySelectorAll('[data-route]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route;
                router.navigateTo(route);
            });
        });
    }

    renderPayment() {
        const content = document.getElementById('dashboard-content');
        const user = auth.getCurrentUser();

        if (!user || user.status !== 'pending_payment') {
            router.navigateTo('dashboard');
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
        const content = document.getElementById('dashboard-content');
        const user = auth.getCurrentUser();

        content.innerHTML = `
            <div class="settings-page">
                <div class="settings-header mb-8">
                    <h1 class="text-3xl font-bold">Configurações</h1>
                    <p class="text-gray mt-2">Personalize sua experiência na plataforma</p>
                </div>
                
                ${user ? `
                    <div class="settings-sections">
                        <div class="settings-section mb-8">
                            <h3 class="text-xl font-bold mb-4">Configurações da Conta</h3>
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <i class="fas fa-bell text-primary"></i>
                                    <div>
                                        <h4 class="font-bold">Notificações</h4>
                                        <p class="text-sm text-gray">Gerencie suas preferências de notificação</p>
                                    </div>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="notifications-toggle" ${user.preferences?.notifications ? 'checked' : ''}>
                                        <label for="notifications-toggle"></label>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <i class="fas fa-envelope text-primary"></i>
                                    <div>
                                        <h4 class="font-bold">E-mails</h4>
                                        <p class="text-sm text-gray">Controle os e-mails que você recebe</p>
                                    </div>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="emails-toggle" ${user.preferences?.emails ? 'checked' : ''}>
                                        <label for="emails-toggle"></label>
                                    </div>
                                </div>
                                
                                <div class="setting-item">
                                    <i class="fas fa-lock text-primary"></i>
                                    <div>
                                        <h4 class="font-bold">Privacidade</h4>
                                        <p class="text-sm text-gray">Gerencie sua privacidade e dados</p>
                                    </div>
                                    <button class="btn btn-outline">Configurar</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section mb-8">
                            <h3 class="text-xl font-bold mb-4">Segurança</h3>
                            <div class="settings-grid">
                                <div class="setting-item">
                                    <i class="fas fa-key text-primary"></i>
                                    <div>
                                        <h4 class="font-bold">Alterar Senha</h4>
                                        <p class="text-sm text-gray">Atualize sua senha periodicamente</p>
                                    </div>
                                    <button class="btn btn-outline" id="change-password-btn">Alterar</button>
                                </div>
                                
                                <div class="setting-item">
                                    <i class="fas fa-shield-alt text-primary"></i>
                                    <div>
                                        <h4 class="font-bold">Autenticação de Dois Fatores</h4>
                                        <p class="text-sm text-gray">Adicione uma camada extra de segurança</p>
                                    </div>
                                    <div class="toggle-switch">
                                        <input type="checkbox" id="2fa-toggle">
                                        <label for="2fa-toggle"></label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="settings-section mb-8">
                            <h3 class="text-xl font-bold mb-4">Aparência</h3>
                            <div class="theme-options">
                                <button class="theme-option ${ui.currentTheme === 'light' ? 'active' : ''}" data-theme="light">
                                    <i class="fas fa-sun"></i>
                                    <span>Claro</span>
                                </button>
                                <button class="theme-option ${ui.currentTheme === 'dark' ? 'active' : ''}" data-theme="dark">
                                    <i class="fas fa-moon"></i>
                                    <span>Escuro</span>
                                </button>
                                <button class="theme-option ${ui.currentTheme === 'auto' ? 'active' : ''}" data-theme="auto">
                                    <i class="fas fa-adjust"></i>
                                    <span>Automático</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="danger-zone mt-12 p-6 bg-white rounded-lg border-2 border-danger">
                            <h3 class="text-danger mb-4 flex items-center gap-2">
                                <i class="fas fa-exclamation-triangle"></i> Zona de Perigo
                            </h3>
                            <div class="danger-actions flex gap-4">
                                <button class="btn btn-outline-danger" id="export-data-btn">
                                    <i class="fas fa-download mr-2"></i> Exportar Meus Dados
                                </button>
                                <button class="btn btn-danger" id="delete-account-btn">
                                    <i class="fas fa-trash mr-2"></i> Excluir Minha Conta
                                </button>
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
        document.getElementById('change-password-btn')?.addEventListener('click', () => {
            this.showChangePasswordForm();
        });

        document.getElementById('export-data-btn')?.addEventListener('click', () => {
            ui.showAlert('Exportação de dados iniciada!', 'success');
        });

        document.getElementById('delete-account-btn')?.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
                ui.showAlert('Conta marcada para exclusão', 'warning');
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