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
                <div class="section-header">
                    <h2>Gerenciar Cursos</h2>
                    <button class="btn btn-primary" id="add-course-btn">
                        <i class="fas fa-plus"></i> Adicionar Curso
                    </button>
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
                                        <td>${course.rating} ⭐</td>
                                        <td class="actions">
                                            <button class="btn btn-sm btn-outline" data-action="edit-course" data-id="${course.id}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline" data-action="view-course" data-id="${course.id}">
                                                <i class="fas fa-eye"></i>
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
                <div class="section-header">
                    <h2>Gerenciar Usuários</h2>
                    <button class="btn btn-primary" id="add-user-btn">
                        <i class="fas fa-user-plus"></i> Adicionar Usuário
                    </button>
                </div>
                
                <div class="admin-table-container">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>E-mail</th>
                                <th>Plano</th>
                                <th>Função</th>
                                <th>Data de Cadastro</th>
                                <th>Status</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${users.map(user => `
                                <tr>
                                    <td>
                                        <div class="flex items-center gap-3">
                                            <img src="${user.avatar}" alt="${user.name}" width="32" height="32" class="rounded-full">
                                            ${user.name}
                                        </div>
                                    </td>
                                    <td>${user.email}</td>
                                    <td><span class="badge ${this.getPlanBadgeClass(user.plan)}">${this.getPlanText(user.plan)}</span></td>
                                    <td><span class="badge ${user.role === 'admin' ? 'badge-danger' : 'badge-primary'}">${user.role === 'admin' ? 'Administrador' : 'Estudante'}</span></td>
                                    <td>${new Date(user.joinDate).toLocaleDateString('pt-BR')}</td>
                                    <td><span class="badge ${user.status === 'active' ? 'badge-accent' : user.status === 'pending_payment' ? 'badge-warning' : 'badge-danger'}">${this.getStatusText(user.status)}</span></td>
                                    <td class="actions">
                                        <button class="btn btn-sm btn-outline" data-action="edit-user" data-id="${user.id}">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline" data-action="view-user" data-id="${user.id}">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${user.id !== auth.currentUser.id ? `
                                            <button class="btn btn-sm btn-danger" data-action="delete-user" data-id="${user.id}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        ` : ''}
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;

        this.addUserManagementListeners();
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
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
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
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>${course ? 'Editar Curso' : 'Adicionar Novo Curso'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="course-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="course-title">Título *</label>
                                <input type="text" id="course-title" value="${course?.title || ''}" required>
                            </div>
                            <div class="form-group">
                                <label for="course-category">Categoria *</label>
                                <select id="course-category" required>
                                    <option value="">Selecione uma categoria</option>
                                    ${database.getAllCategories().map(cat => `
                                        <option value="${cat.id}" ${course?.categoryId === cat.id ? 'selected' : ''}>${cat.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="course-level">Nível *</label>
                                <select id="course-level" required>
                                    <option value="beginner" ${course?.level === 'beginner' ? 'selected' : ''}>Iniciante</option>
                                    <option value="intermediate" ${course?.level === 'intermediate' ? 'selected' : ''}>Intermediário</option>
                                    <option value="advanced" ${course?.level === 'advanced' ? 'selected' : ''}>Avançado</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="course-instructor">Instrutor *</label>
                                <select id="course-instructor" required>
                                    <option value="">Selecione um instrutor</option>
                                    ${database.data.instructors.map(instr => `
                                        <option value="${instr.id}" ${course?.instructorId === instr.id ? 'selected' : ''}>${instr.name}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="course-description">Descrição *</label>
                            <textarea id="course-description" rows="3" required>${course?.description || ''}</textarea>
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
        
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
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
        if (confirm('Tem certeza que deseja excluir este curso?')) {
            ui.showAlert('Curso excluído com sucesso!', 'success');
        }
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
                    case 'view-user':
                        this.viewUser(id);
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
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>${user ? 'Editar Usuário' : 'Adicionar Novo Usuário'}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <form id="user-form">
                        <div class="form-group">
                            <label for="user-name">Nome *</label>
                            <input type="text" id="user-name" value="${user?.name || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="user-email">Email *</label>
                            <input type="email" id="user-email" value="${user?.email || ''}" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="user-password">${user ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha *'}</label>
                            <input type="password" id="user-password" ${user ? '' : 'required'}>
                        </div>
                        
                        <div class="form-group">
                            <label for="user-role">Função *</label>
                            <select id="user-role" required>
                                <option value="student" ${user?.role === 'student' ? 'selected' : ''}>Estudante</option>
                                <option value="admin" ${user?.role === 'admin' ? 'selected' : ''}>Administrador</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="user-plan">Plano</label>
                            <select id="user-plan">
                                <option value="junior" ${user?.plan === 'junior' ? 'selected' : ''}>Júnior</option>
                                <option value="pleno" ${user?.plan === 'pleno' ? 'selected' : ''}>Pleno</option>
                                <option value="senior" ${user?.plan === 'senior' ? 'selected' : ''}>Sênior</option>
                            </select>
                        </div>
                        
                        <div class="modal-actions">
                            <button type="button" class="btn btn-outline modal-close">Cancelar</button>
                            <button type="submit" class="btn btn-primary">${user ? 'Atualizar' : 'Salvar'}</button>
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

        const form = modal.querySelector('#user-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            ui.showAlert(user ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!', 'success');
            modal.remove();
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
        if (confirm('Tem certeza que deseja excluir este usuário?')) {
            ui.showAlert('Usuário excluído com sucesso!', 'success');
        }
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