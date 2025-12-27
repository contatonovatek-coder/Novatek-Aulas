// admin.js - Sistema administrativo
class AdminSystem {
    constructor() {
        this.init();
    }

    init() {
        router.registerRoute('admin-painel-do-aluno', this.renderAdminPainelDoAluno.bind(this));
        router.registerRoute('admin-courses', this.renderAdminCourses.bind(this));
        router.registerRoute('admin-users', this.renderAdminUsers.bind(this));
        router.registerRoute('admin-lessons', this.renderAdminLessons.bind(this));
    }

    renderAdminPainelDoAluno() {
        if (!auth.isAdmin()) {
            router.navigateTo('painel-do-aluno');
            return;
        }

        const content = document.getElementById('painel-do-aluno-content');
        const stats = database.getAdminStats();

        content.innerHTML = `
            <div class="admin-painel-do-aluno">
                <div class="admin-hero">
                    <div class="hero-left">
                        <h1>Painel Administrativo</h1>
                        <p class="hero-sub">Visão geral rápida dos principais indicadores</p>
                    </div>
                    <div class="hero-right">
                        <div class="search-quick">
                            <input type="text" id="admin-search" placeholder="Pesquisar usuários, cursos...">
                            <button class="btn btn-primary" id="create-report-btn"><i class="fas fa-file-alt"></i> Relatório</button>
                        </div>
                    </div>
                </div>

                <div class="admin-stats">
                    <div class="admin-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.totalUsers}</h3>
                            <p>Usuários Cadastrados</p>
                            <a href="#" class="stat-link" data-route="admin-users">
                                Ver todos <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div class="admin-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-credit-card"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${stats.activeSubscriptions}</h3>
                            <p>Assinaturas Ativas</p>
                            <a href="#" class="stat-link">
                                Ver relatório <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div class="admin-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-book"></i>
                        </div>
                        <div class="stat-info">
                            <h3>${database.getAllCourses().length}</h3>
                            <p>Cursos Disponíveis</p>
                            <a href="#" class="stat-link" data-route="admin-courses">
                                Gerenciar <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                    
                    <div class="admin-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-info">
                            <h3>R$ ${stats.monthlyRevenue.toLocaleString()}</h3>
                            <p>Receita Mensal</p>
                            <a href="#" class="stat-link">
                                Ver detalhes <i class="fas fa-arrow-right"></i>
                            </a>
                        </div>
                    </div>
                </div>
                
                <div class="admin-sections">
                    <div class="admin-section">
                        <h3><i class="fas fa-chart-bar"></i> Atividade Recente</h3>
                        <div class="activities-list">
                            ${stats.recentActivities.map(activity => `
                                <div class="activity-item">
                                    <div class="activity-icon">
                                        <i class="fas fa-${this.getActivityIcon(activity.type)}"></i>
                                    </div>
                                    <div class="activity-content">
                                        <p>${activity.message}</p>
                                        <span class="activity-time">${ui.formatTime(activity.time)}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="admin-section">
                        <h3><i class="fas fa-chart-pie"></i> Distribuição de Planos</h3>
                        <div class="chart-container">
                            <canvas id="plansChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="admin-quick-actions">
                    <h3><i class="fas fa-bolt"></i> Ações Rápidas</h3>
                    <div class="actions-grid">
                        <div class="action-btn" data-action="add-course">
                            <i class="fas fa-plus-circle"></i>
                            <span>Adicionar Curso</span>
                        </div>
                        <div class="action-btn" data-action="add-user">
                            <i class="fas fa-user-plus"></i>
                            <span>Adicionar Usuário</span>
                        </div>
                        <div class="action-btn" data-action="send-notification">
                            <i class="fas fa-bullhorn"></i>
                            <span>Enviar Notificação</span>
                        </div>
                        <div class="action-btn" data-action="view-reports">
                            <i class="fas fa-file-alt"></i>
                            <span>Gerar Relatório</span>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderPlansChart();
        this.addAdminEventListeners();
    }

    getActivityIcon(type) {
        const icons = {
            'user_signup': 'user-plus',
            'course_completed': 'graduation-cap',
            'subscription': 'credit-card',
            'support': 'headset'
        };
        return icons[type] || 'bell';
    }

    renderPlansChart() {
        const ctx = document.getElementById('plansChart');
        if (!ctx) return;

        const data = {
            labels: ['Júnior', 'Pleno', 'Sênior'],
            datasets: [{
                data: [45, 30, 25],
                backgroundColor: [
                    'rgba(79, 70, 229, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)'
                ],
                borderWidth: 1
            }]
        };

        new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    renderAdminCourses() {
        if (!auth.isAdmin()) {
            router.navigateTo('painel-do-aluno');
            return;
        }

        const courses = database.getAllCourses();
        const content = document.getElementById('painel-do-aluno-content');

        content.innerHTML = `
            <div class="admin-courses">
                <div class="admin-hero section-header">
                    <div class="hero-left">
                        <h2>Gerenciar Cursos</h2>
                        <p class="hero-sub">Crie, edite e gerencie cursos</p>
                    </div>
                    <div class="hero-right">
                        <div class="filter-group">
                            <input type="text" id="admin-courses-search" placeholder="Pesquisar por título ou instrutor" class="filter-select" style="width:260px;">
                            <select id="admin-filter-category" class="filter-select">
                                <option value="">Todas as Categorias</option>
                                ${database.getAllCategories().map(cat => `
                                    <option value="${cat.id}">${cat.name}</option>
                                `).join('')}
                            </select>
                            <select id="admin-filter-level" class="filter-select">
                                <option value="">Todos os Níveis</option>
                                <option value="beginner">Iniciante</option>
                                <option value="intermediate">Intermediário</option>
                                <option value="advanced">Avançado</option>
                            </select>
                            <button class="btn btn-primary" id="add-course-btn"><i class="fas fa-plus"></i> Adicionar Curso</button>
                        </div>
                    </div>
                </div>
                
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Categoria</th>
                                <th>Nível</th>
                                <th>Instrutor</th>
                                <th>Estudantes</th>
                                <th>Avaliação</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${courses.map(course => {
                                const category = database.getCategoryById(course.categoryId);
                                const instructor = database.getInstructorById(course.instructorId);
                                return `
                                    <tr>
                                        <td>${course.title}</td>
                                        <td><span class="badge badge-primary">${category?.name || 'N/A'}</span></td>
                                        <td><span class="badge ${this.getLevelBadgeClass(course.level)}">${this.getLevelText(course.level)}</span></td>
                                        <td>${instructor?.name || 'N/A'}</td>
                                        <td>${course.students}</td>
                                        <td>
                                            <span class="rating">
                                                <span class="rating-value">${course.rating}</span>
                                                <i class="fas fa-star rating-icon" aria-hidden="true"></i>
                                            </span>
                                        </td>
                                        <td class="actions">
                                            <button class="btn btn-sm btn-outline" data-action="edit-course" data-id="${course.id}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" data-action="delete-course" data-id="${course.id}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.addCourseManagementListeners();
    }

    getLevelBadgeClass(level) {
        const classes = {
            'beginner': 'badge-accent',
            'intermediate': 'badge-warning',
            'advanced': 'badge-danger'
        };
        return classes[level] || 'badge-primary';
    }

    getLevelText(level) {
        const texts = {
            'beginner': 'Iniciante',
            'intermediate': 'Intermediário',
            'advanced': 'Avançado'
        };
        return texts[level] || level;
    }

    renderAdminUsers() {
        if (!auth.isAdmin()) {
            router.navigateTo('painel-do-aluno');
            return;
        }

        const users = database.getAllUsers();
        const content = document.getElementById('painel-do-aluno-content');

        content.innerHTML = `
            <div class="admin-users">
                <div class="admin-hero section-header">
                    <div class="hero-left">
                        <h2>Gerenciar Usuários</h2>
                        <p class="hero-sub">Crie, edite e gerencie contas de usuários</p>
                    </div>
                    <div class="hero-right">
                        <div class="filter-group">
                            <input type="text" id="admin-users-search" placeholder="Pesquisar por nome ou e-mail" class="filter-select" style="width:260px;">
                            <select id="admin-filter-plan" class="filter-select">
                                <option value="">Todos os Planos</option>
                                <option value="junior">Júnior</option>
                                <option value="pleno">Pleno</option>
                                <option value="senior">Sênior</option>
                            </select>
                            <select id="admin-filter-status" class="filter-select">
                                <option value="">Todos os Status</option>
                                <option value="active">Ativo</option>
                                <option value="pending_payment">Pagamento Pendente</option>
                                <option value="inactive">Inativo</option>
                            </select>
                            <button class="btn btn-ghost" id="export-users"><i class="fas fa-file-export"></i> Exportar</button>
                            <button class="btn btn-primary" id="add-user-btn"><i class="fas fa-user-plus"></i> Novo Usuário</button>
                        </div>
                    </div>
                </div>

                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Usuário</th>
                                <th>Plano</th>
                                <th>Função</th>
                                <th>Cadastro</th>
                                <th>Status</th>
                                <th style="width:150px">Ações</th>
                            </tr>
                        </thead>
                        <tbody id="admin-users-tbody"></tbody>
                    </table>
                </div>
            </div>
        `;

        const tbody = document.getElementById('admin-users-tbody');

        const renderRows = (list) => {
            tbody.innerHTML = list.map(user => `
                <tr>
                    <td>
                        <div style="display:flex; align-items:center; gap:12px">
                            <img src="${user.avatar}" alt="${user.name}" width="48" height="48" style="border-radius:9999px; object-fit:cover;">
                            <div>
                                <div style="font-weight:700; color:var(--dark-color)">${user.name}</div>
                                <div style="font-size:0.9rem; color:var(--gray-color)">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td><span class="badge ${this.getPlanBadgeClass(user.plan)}">${this.getPlanText(user.plan)}</span></td>
                    <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${user.role === 'admin' ? 'Administrador' : 'Estudante'}</span></td>
                    <td>${new Date(user.joinDate).toLocaleDateString('pt-BR')}</td>
                    <td><span class="badge ${user.status === 'active' ? 'badge-accent' : user.status === 'pending_payment' ? 'badge-warning' : 'badge-danger'}">${this.getStatusText(user.status)}</span></td>
                    <td class="actions">
                        <button class="btn btn-sm btn-outline" data-action="edit-user" data-id="${user.id}"><i class="fas fa-edit"></i></button>
                        ${user.id !== auth.currentUser.id ? `<button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user.id}"><i class="fas fa-trash"></i></button>` : ''}
                    </td>
                </tr>
            `).join('');

            this.addUserManagementListeners();
        };

        // initial render
        renderRows(users);

        // Wire up filters and search
        const searchInput = document.getElementById('admin-users-search');
        const planFilter = document.getElementById('admin-filter-plan');
        const statusFilter = document.getElementById('admin-filter-status');
        const exportBtn = document.getElementById('export-users');

        const applyFilters = () => {
            const q = searchInput.value.trim().toLowerCase();
            const plan = planFilter.value;
            const status = statusFilter.value;

            const filtered = users.filter(u => {
                if (q && !(u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))) return false;
                if (plan && u.plan !== plan) return false;
                if (status && u.status !== status) return false;
                return true;
            });

            renderRows(filtered);
        };

        searchInput.addEventListener('input', applyFilters);
        planFilter.addEventListener('change', applyFilters);
        statusFilter.addEventListener('change', applyFilters);

        exportBtn.addEventListener('click', () => {
            const data = users.map(u => ({ id: u.id, name: u.name, email: u.email, plan: u.plan, role: u.role, status: u.status }));
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'users-export.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        });

    }

    getPlanBadgeClass(plan) {
        const classes = {
            'junior': 'badge-primary',
            'pleno': 'badge-warning',
            'senior': 'badge-accent'
        };
        return classes[plan] || 'badge-primary';
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

    renderAdminLessons() {
        if (!auth.isAdmin()) {
            router.navigateTo('painel-do-aluno');
            return;
        }

        const lessons = database.data.lessons;
        const courses = database.getAllCourses();
        const content = document.getElementById('painel-do-aluno-content');

        content.innerHTML = `
            <div class="admin-lessons">
                <div class="section-header">
                    <h2>Gerenciar Aulas</h2>
                    <button class="btn btn-primary" id="add-lesson-btn">
                        <i class="fas fa-plus"></i> Adicionar Aula
                    </button>
                </div>
                
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Curso</th>
                                <th>Duração</th>
                                <th>Ordem</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${lessons.map(lesson => {
                                const course = courses.find(c => c.id === lesson.courseId);
                                return `
                                    <tr>
                                        <td>${lesson.title}</td>
                                        <td>${course ? course.title : 'N/A'}</td>
                                        <td>${lesson.duration} min</td>
                                        <td>${lesson.order}</td>
                                        <td class="actions">
                                            <button class="btn btn-sm btn-outline" data-action="edit-lesson" data-id="${lesson.id}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline" data-action="view-lesson" data-id="${lesson.id}">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button class="btn btn-sm btn-danger" data-action="delete-lesson" data-id="${lesson.id}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.addLessonManagementListeners();
    }

    addAdminEventListeners() {
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });

        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.dataset.route;
                router.navigateTo(route);
            });
        });

        // Quick report button from hero
        document.getElementById('create-report-btn')?.addEventListener('click', () => {
            this.handleQuickAction('view-reports');
        });
    }

    handleQuickAction(action) {
        switch(action) {
            case 'add-course':
                ui.showAlert('Funcionalidade de adicionar curso em desenvolvimento', 'info');
                break;
            case 'add-user':
                ui.showAlert('Funcionalidade de adicionar usuário em desenvolvimento', 'info');
                break;
            case 'send-notification':
                this.showSendNotificationModal();
                break;
            case 'view-reports':
                ui.showAlert('Funcionalidade de relatórios em desenvolvimento', 'info');
                break;
        }
    }

    showSendNotificationModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Enviar Notificação</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="notification-form">
                        <div class="form-group">
                            <label for="notification-title">Título</label>
                            <input type="text" id="notification-title" placeholder="Título da notificação" required>
                        </div>
                        <div class="form-group">
                            <label for="notification-message">Mensagem</label>
                            <textarea id="notification-message" rows="3" placeholder="Mensagem da notificação" required></textarea>
                        </div>
                        <div class="form-group">
                            <label for="notification-type">Tipo</label>
                            <select id="notification-type" required>
                                <option value="info">Informação</option>
                                <option value="success">Sucesso</option>
                                <option value="warning">Aviso</option>
                                <option value="danger">Urgente</option>
                            </select>
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">Enviar</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        const form = modal.querySelector('#notification-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const title = modal.querySelector('#notification-title').value;
            const message = modal.querySelector('#notification-message').value;
            const type = modal.querySelector('#notification-type').value;
            
            const users = database.getAllUsers();
            users.forEach(user => {
                database.addNotification(user.id, {
                    title,
                    message,
                    type
                });
            });
            
            ui.showAlert('Notificação enviada para todos os usuários!', 'success');
            modal.remove();
        });
    }

    addCourseManagementListeners() {
        document.getElementById('add-course-btn')?.addEventListener('click', () => {
            this.showCourseForm();
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const id = parseInt(e.currentTarget.dataset.id);
                
                switch(action) {
                    case 'edit-course':
                        this.editCourse(id);
                        break;
                    case 'view-course':
                        this.viewCourse(id);
                        break;
                    case 'delete-course':
                        this.deleteCourse(id);
                        break;
                }
            });
        });
    }

    showCourseForm(course = null) {
        const modal = document.createElement('div');
        modal.className = 'modal admin-user-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:760px;">
                <div class="modal-header">
                    <h2>${course ? 'Editar Curso' : 'Adicionar Novo Curso'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="course-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="course-title">Título *</label>
                                <div class="input-with-icon">
                                    <input type="text" id="course-title" value="${course?.title || ''}" required>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="course-category">Categoria *</label>
                                <div class="input-with-icon">
                                    <select id="course-category" required>
                                        <option value="">Selecione uma categoria</option>
                                        ${database.getAllCategories().map(cat => `
                                            <option value="${cat.id}" ${course?.categoryId === cat.id ? 'selected' : ''}>${cat.name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="course-level">Nível *</label>
                                <div class="input-with-icon">
                                    <select id="course-level" required>
                                        <option value="beginner" ${course?.level === 'beginner' ? 'selected' : ''}>Iniciante</option>
                                        <option value="intermediate" ${course?.level === 'intermediate' ? 'selected' : ''}>Intermediário</option>
                                        <option value="advanced" ${course?.level === 'advanced' ? 'selected' : ''}>Avançado</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="course-instructor">Instrutor *</label>
                                <div class="input-with-icon">
                                    <select id="course-instructor" required>
                                        <option value="">Selecione um instrutor</option>
                                        ${database.data.instructors.map(instr => `
                                            <option value="${instr.id}" ${course?.instructorId === instr.id ? 'selected' : ''}>${instr.name}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="course-description">Descrição *</label>
                            <div class="input-with-icon">
                                <textarea id="course-description" rows="4" required>${course?.description || ''}</textarea>
                            </div>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${course ? 'Atualizar' : 'Salvar'}</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        const form = modal.querySelector('#course-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            if (course) {
                ui.showAlert('Curso atualizado com sucesso!', 'success');
            } else {
                ui.showAlert('Curso criado com sucesso!', 'success');
            }
            
            modal.remove();
        });
    }

    editCourse(id) {
        const course = database.getCourseById(id);
        if (course) {
            this.showCourseForm(course);
        }
    }

    viewCourse(id) {
        const course = database.getCourseById(id);
        if (course) {
            router.navigateTo('courses');
        }
    }

    deleteCourse(id) {
        const course = database.getCourseById(id);
        if (!course) return;
        this.showDeleteCourseModal(course);
    }

    showDeleteCourseModal(course) {
        const modal = document.createElement('div');
        modal.className = 'modal admin-user-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:520px;">
                <div class="modal-header">
                    <h2>Excluir Curso</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-text-content">
                        <h3>Deseja realmente excluir este curso?</h3>
                        <p>"${course.title}"</p>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirm-delete-course"><i class="fas fa-trash-alt"></i> Excluir</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // close handlers
        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelector('#confirm-delete-course').addEventListener('click', () => {
            // remove course from database and related lessons
            database.data.courses = database.data.courses.filter(c => c.id !== course.id);
            database.data.lessons = database.data.lessons.filter(l => l.courseId !== course.id);
            database.saveDatabase();

            ui.showAlert('Curso excluído com sucesso!', 'success');
            modal.remove();
            this.renderAdminCourses();
        });
    }

    addUserManagementListeners() {
        document.getElementById('add-user-btn')?.addEventListener('click', () => {
            this.showUserForm();
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const id = parseInt(e.currentTarget.dataset.id);
                
                switch(action) {
                    case 'edit-user':
                        this.editUser(id);
                        break;
                    case 'delete-user':
                        this.deleteUser(id);
                        break;
                }
            });
        });
    }

    showUserForm(user = null) {
        const modal = document.createElement('div');
        modal.className = 'modal admin-user-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:760px;">
                <div class="modal-header">
                    <h2>${user ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-row">
                        <div class="avatar-column">
                            <div class="avatar-preview">
                                <img id="user-avatar-preview" src="${user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'Novo Usuario')}&background=4F46E5&color=fff`}" alt="avatar">
                            </div>
                            <div class="avatar-uploader">
                                <label class="avatar-upload-btn btn btn-outline">
                                    <input type="file" id="user-avatar-file" accept="image/*" style="display:none">
                                    <i class="fas fa-upload"></i> Fazer upload
                                </label>
                                <input type="hidden" id="user-avatar-data" value="${user?.avatar || ''}">
                                <small class="muted">PNG/JPG — máximo 2MB</small>
                            </div>
                        </div>

                        <div class="form-column">
                            <form id="user-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="user-name">Nome *</label>
                                        <input type="text" id="user-name" value="${user?.name || ''}" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="user-email">E-mail *</label>
                                        <input type="email" id="user-email" value="${user?.email || ''}" required>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="user-password">${user ? 'Nova Senha (opcional)' : 'Senha *'}</label>
                                        <div class="input-with-icon">
                                            <input type="password" id="user-password" ${user ? '' : 'required'}>
                                            <button type="button" class="password-toggle" aria-label="Mostrar senha"><i class="fas fa-eye"></i></button>
                                        </div>
                                    </div>
                                    <div class="form-group">
                                        <label for="user-role">Função *</label>
                                        <select id="user-role" required>
                                            <option value="student" ${user?.role === 'student' ? 'selected' : ''}>Estudante</option>
                                            <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Administrador</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="user-plan">Plano</label>
                                        <select id="user-plan">
                                            <option value="junior" ${user?.plan === 'junior' ? 'selected' : ''}>Júnior</option>
                                            <option value="pleno" ${user?.plan === 'pleno' ? 'selected' : ''}>Pleno</option>
                                            <option value="senior" ${user?.plan === 'senior' ? 'selected' : ''}>Sênior</option>
                                        </select>
                                    </div>

                                    <div class="form-group">
                                        <label for="user-status">Status</label>
                                        <select id="user-status">
                                            <option value="active" ${user?.status === 'active' ? 'selected' : ''}>Ativo</option>
                                            <option value="pending_payment" ${user?.status === 'pending_payment' ? 'selected' : ''}>Pagamento Pendente</option>
                                            <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Inativo</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="modal-actions">
                                    <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                                    <button type="submit" class="btn btn-primary">${user ? 'Atualizar' : 'Salvar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close handlers
        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        // Avatar upload + preview
        const fileInput = modal.querySelector('#user-avatar-file');
        const hiddenAvatar = modal.querySelector('#user-avatar-data');
        const avatarPreview = modal.querySelector('#user-avatar-preview');
        const nameInput = modal.querySelector('#user-name');

        function setPreviewFromData(dataUrl) {
            avatarPreview.src = dataUrl;
            hiddenAvatar.value = dataUrl;
        }

        // update preview when typing name (if no uploaded avatar)
        nameInput.addEventListener('input', () => {
            if (!hiddenAvatar.value) {
                avatarPreview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nameInput.value || 'Novo Usuario')}&background=4F46E5&color=fff`;
            }
        });

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                ui.showAlert('Formato inválido. Envie uma imagem.', 'warning');
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                ui.showAlert('Imagem muito grande. Máx. 2MB.', 'warning');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(ev) {
                setPreviewFromData(ev.target.result);
            };
            reader.readAsDataURL(file);
        });

        // password toggle
        const pwdToggle = modal.querySelector('.password-toggle');
        if (pwdToggle) {
            pwdToggle.addEventListener('click', () => {
                const pw = modal.querySelector('#user-password');
                const icon = pwdToggle.querySelector('i');
                if (pw.type === 'password') {
                    pw.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    pw.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }

        // Form submit: create or update user via database
        const form = modal.querySelector('#user-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const name = modal.querySelector('#user-name').value.trim();
            const email = modal.querySelector('#user-email').value.trim();
            const password = modal.querySelector('#user-password').value;
            const role = modal.querySelector('#user-role').value;
            const plan = modal.querySelector('#user-plan').value;
            const status = modal.querySelector('#user-status').value;
            const avatar = (hiddenAvatar && hiddenAvatar.value && hiddenAvatar.value.trim()) ? hiddenAvatar.value.trim() : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4F46E5&color=fff`;

            if (!name || !email) {
                ui.showAlert('Preencha nome e e-mail.', 'warning');
                return;
            }

            if (user) {
                const updates = { name, email, role, plan, status, avatar };
                if (password) updates.password = password;
                const updated = database.updateUser(user.id, updates);
                if (updated) {
                    ui.showAlert('Usuário atualizado com sucesso!', 'success');
                    this.renderAdminUsers();
                    modal.remove();
                } else {
                    ui.showAlert('Erro ao atualizar usuário.', 'danger');
                }
            } else {
                if (database.getUserByEmail(email)) {
                    ui.showAlert('Já existe um usuário com este e-mail.', 'warning');
                    return;
                }

                const newUser = database.createUser({ name, email, password, role, plan, status, avatar });
                if (newUser) {
                    ui.showAlert('Usuário criado com sucesso!', 'success');
                    this.renderAdminUsers();
                    modal.remove();
                } else {
                    ui.showAlert('Erro ao criar usuário.', 'danger');
                }
            }
        });
    }

    editUser(id) {
        const user = database.getUserById(id);
        if (user) {
            this.showUserForm(user);
        }
    }

    viewUser(id) {
        const user = database.getUserById(id);
        if (user) {
            ui.showAlert(`Visualizando usuário: ${user.name}`, 'info');
        }
    }

    deleteUser(id) {
        const user = database.getUserById(id);
        if (!user) return;
        this.showDeleteUserModal(user);
    }

    showDeleteUserModal(user) {
        const modal = document.createElement('div');
        modal.className = 'modal admin-user-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:520px;">
                <div class="modal-header">
                    <h2>Excluir Usuário</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="modal-text-content">
                        <h3>Deseja realmente excluir este usuário?</h3>
                        <p>"${user.name}"</p>
                    </div>
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirm-delete-user"><i class="fas fa-trash-alt"></i> Excluir</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelectorAll('.modal-close').forEach(btn => btn.addEventListener('click', () => modal.remove()));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

        modal.querySelector('#confirm-delete-user').addEventListener('click', () => {
            // remove user and related data from simulated database
            database.data.users = database.data.users.filter(u => u.id !== user.id);
            database.data.notifications = database.data.notifications.filter(n => n.userId !== user.id);
            database.data.subscriptions = database.data.subscriptions.filter(s => s.userId !== user.id);
            database.data.payments = database.data.payments.filter(p => p.userId !== user.id);
            database.data.userProgress = database.data.userProgress.filter(up => up.userId !== user.id);
            database.saveDatabase();

            ui.showAlert('Usuário excluído com sucesso!', 'success');
            modal.remove();
            this.renderAdminUsers();
        });
    }

    addLessonManagementListeners() {
        document.getElementById('add-lesson-btn')?.addEventListener('click', () => {
            this.showLessonForm();
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                const id = parseInt(e.currentTarget.dataset.id);
                
                switch(action) {
                    case 'edit-lesson':
                        this.editLesson(id);
                        break;
                    case 'view-lesson':
                        this.viewLesson(id);
                        break;
                    case 'delete-lesson':
                        this.deleteLesson(id);
                        break;
                }
            });
        });
    }

    showLessonForm(lesson = null) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>${lesson ? 'Editar Aula' : 'Adicionar Nova Aula'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="lesson-form">
                        <div class="form-group">
                            <label for="lesson-course">Curso *</label>
                            <select id="lesson-course" required>
                                <option value="">Selecione um curso</option>
                                ${database.getAllCourses().map(course => `
                                    <option value="${course.id}" ${lesson?.courseId === course.id ? 'selected' : ''}>${course.title}</option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="lesson-title">Título *</label>
                            <input type="text" id="lesson-title" value="${lesson?.title || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="lesson-description">Descrição</label>
                            <textarea id="lesson-description" rows="3">${lesson?.description || ''}</textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="lesson-duration">Duração (minutos) *</label>
                                <input type="number" id="lesson-duration" value="${lesson?.duration || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="lesson-order">Ordem *</label>
                                <input type="number" id="lesson-order" value="${lesson?.order || ''}" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="lesson-video">URL do Vídeo</label>
                            <input type="text" id="lesson-video" value="${lesson?.videoUrl || ''}" placeholder="https://www.youtube.com/embed/...">
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${lesson ? 'Atualizar' : 'Salvar'}</button>
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

        const form = modal.querySelector('#lesson-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            ui.showAlert(lesson ? 'Aula atualizada com sucesso!' : 'Aula criada com sucesso!', 'success');
            modal.remove();
        });
    }

    editLesson(id) {
        const lesson = database.getLessonById(id);
        if (lesson) {
            this.showLessonForm(lesson);
        }
    }

    viewLesson(id) {
        ui.showLesson(id);
    }

    deleteLesson(id) {
        if (confirm('Tem certeza que deseja excluir esta aula?')) {
            ui.showAlert('Aula excluída com sucesso!', 'success');
        }
    }
}

// Instância global do admin
const admin = new AdminSystem();