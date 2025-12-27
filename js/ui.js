// ui.js - Sistema de interface
class UI {
    constructor() {
        this.currentTheme = 'light';
        this.init();
    }

    init() {
        this.initModals();
        this.initEventListeners();
        this.initTheme();
        this.initAnimations();
    }

    initTheme() {
        const savedTheme = localStorage.getItem('novatek-theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.currentTheme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('novatek-theme', theme);
        
        document.querySelectorAll('[data-theme]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
    }

    initAnimations() {
        this.addEntranceAnimations();
    }

    addEntranceAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.stat-card, .course-card, .plan-card').forEach(el => {
            observer.observe(el);
        });
    }

    initModals() {
        document.getElementById('register-link')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal('register-modal');
            this.renderRegistrationForm();
        });

        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                this.closeModal(modal.id);
            });
        });

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal').forEach(modal => {
                    if (!modal.classList.contains('hidden')) {
                        this.closeModal(modal.id);
                    }
                });
            }
        });
    }

    initEventListeners() {
        this.initNotificationSystem();
        this.initUserMenu();
        this.initSearch();
        this.initForms();
        this.initNavigation();
        this.initPaymentHandlers();
    }

    initNotificationSystem() {
        const notificationBtn = document.getElementById('notification-btn');
        const notificationsDropdown = document.getElementById('notifications-dropdown');
        
        if (notificationBtn && notificationsDropdown) {
            notificationBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                notificationsDropdown.classList.toggle('hidden');
                if (!notificationsDropdown.classList.contains('hidden')) {
                    this.loadNotifications();
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!notificationBtn.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                    notificationsDropdown.classList.add('hidden');
                }
            });
        }
    }

    initUserMenu() {
        const userAvatar = document.getElementById('header-user-menu');
        const userMenu = document.getElementById('user-menu-dropdown');
        
        if (userAvatar && userMenu) {
            userAvatar.addEventListener('click', (e) => {
                e.stopPropagation();
                userMenu.classList.toggle('hidden');
            });
            
            document.addEventListener('click', (e) => {
                if (!userAvatar.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.classList.add('hidden');
                }
            });
        }
    }

    initSearch() {
        const searchInput = document.getElementById('global-search');
        const searchResults = document.getElementById('search-results');
        
        if (searchInput && searchResults) {
            let searchTimeout;
            
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                const query = e.target.value.trim();
                
                if (query.length < 2) {
                    searchResults.classList.add('hidden');
                    return;
                }
                
                searchTimeout = setTimeout(() => {
                    this.performSearch(query);
                }, 300);
            });
            
            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                    searchResults.classList.add('hidden');
                }
            });
        }
    }

    initForms() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.addEventListener('click', () => {
                const passwordInput = document.getElementById('password');
                const icon = togglePassword.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                }
            });
        }

        // Registro: gerenciar loading do botão sem alterar lógica de validação
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('register-name')?.value.trim();
                const email = document.getElementById('register-email')?.value.trim();
                const password = document.getElementById('register-password')?.value;
                const confirmPassword = document.getElementById('register-confirm')?.value;

                // Determinar plano selecionado (localStorage ou card selecionado)
                let plan = localStorage.getItem('selected-plan');
                if (!plan) {
                    const selectedCard = document.querySelector('#plans-selection .plan-card.selected');
                    plan = selectedCard?.dataset.plan || selectedCard?.dataset.selectPlan || null;
                }

                const submitBtn = registerForm.querySelector('.btn-register');
                if (submitBtn) {
                    submitBtn.classList.add('loading');
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando...';
                    submitBtn.disabled = true;
                }

                try {
                    const result = await auth.register({ name, email, password, confirmPassword, plan });
                    if (result.success && result.redirectToPayment) {
                        this.showAlert('Cadastro efetuado. Redirecionando para pagamento...', 'info');
                        this.closeModal('register-modal');
                        this.showPaymentScreen(result.user, plan);
                    } else if (result.success) {
                        this.showAlert(result.message || 'Cadastro realizado!', 'success');
                        this.closeModal('register-modal');
                    } else {
                        this.showAlert(result.message || 'Erro no cadastro', 'danger');
                    }
                } catch (err) {
                    this.showAlert('Erro ao criar conta. Tente novamente.', 'danger');
                } finally {
                    if (submitBtn) {
                        submitBtn.classList.remove('loading');
                        submitBtn.disabled = false;
                        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> Criar Conta';
                    }
                }
            });
        }
    }

    initNavigation() {
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        document.addEventListener('click', (e) => {
            const sidebar = document.querySelector('.sidebar');
            const menuToggle = document.getElementById('menu-toggle');
            
            if (window.innerWidth <= 992 && 
                sidebar.classList.contains('active') &&
                !sidebar.contains(e.target) &&
                !menuToggle.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    initPaymentHandlers() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('[data-select-plan]')) {
                const planId = e.target.closest('[data-select-plan]').dataset.selectPlan;
                this.handlePlanSelection(planId);
            }
            
            if (e.target.closest('[data-process-payment]')) {
                const planId = e.target.closest('[data-process-payment]').dataset.processPayment;
                this.processPayment(planId);
            }
        });
    }

    renderRegistrationForm() {
        const plansContainer = document.getElementById('plans-selection');
        if (!plansContainer) return;

        const plans = Object.values(CONFIG.PLANS);
        plansContainer.innerHTML = '';

        plans.forEach((plan, index) => {
            const planElement = document.createElement('div');
            planElement.className = `plan-card ${index === 1 ? 'featured' : ''}`;
            planElement.innerHTML = `
                <div class="plan-card-header">
                    <h3>${plan.name}</h3>
                    ${index === 1 ? '<span class="plan-badge">Mais Popular</span>' : ''}
                </div>
                
                <div class="plan-price">
                    <span class="currency">R$</span>
                    <span class="amount">${plan.price}</span>
                    <span class="period">/mês</span>
                </div>
                
                <p class="plan-description">${plan.description}</p>
                
                <ul class="plan-features">
                    ${plan.features.slice(0, 4).map(feature => `
                        <li><i class="fas fa-check"></i> ${feature}</li>
                    `).join('')}
                </ul>
                
                <button class="btn btn-${index === 1 ? 'primary' : 'outline'} btn-block" 
                        data-select-plan="${plan.id}">
                    Selecionar Plano
                </button>
            `;

            plansContainer.appendChild(planElement);
        });
    }

    handlePlanSelection(planId) {
        localStorage.setItem('selected-plan', planId);
        
        document.querySelectorAll('.plan-card').forEach(card => {
            card.classList.remove('selected');
        });
        
        const selectedCard = document.querySelector(`[data-select-plan="${planId}"]`)?.closest('.plan-card');
        if (selectedCard) {
            selectedCard.classList.add('selected');
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        if (!email || !password) {
            this.showAlert('Por favor, preencha todos os campos', 'warning');
            return;
        }
        
        const loginBtn = document.querySelector('.btn-login');
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        loginBtn.disabled = true;
        
        try {
            const result = await auth.login(email, password);
            
            if (result.redirectToPayment) {
                this.closeModal('register-modal');
                this.showPaymentScreen(result.user);
            } else if (result.success) {
                this.showAlert('Login realizado com sucesso!', 'success');
            } else {
                this.showAlert(result.message, 'danger');
            }
        } catch (error) {
            this.showAlert('Erro ao fazer login. Tente novamente.', 'danger');
        } finally {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    }

    showPaymentScreen(user, planId = null) {
        const plan = planId ? CONFIG.PLANS[planId.toUpperCase()] : CONFIG.PLANS.JUNIOR;
        
        const modal = document.createElement('div');
        modal.className = 'modal payment-screen';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2>Finalizar Assinatura</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="payment-flow">
                        <div class="steps">
                            <div class="step active">1</div>
                            <div class="step">2</div>
                            <div class="step">3</div>
                        </div>
                        
                        <div class="step-content">
                            <div class="step-pane active" id="step-1">
                                <h3>Plano Selecionado</h3>
                                <div class="selected-plan-summary">
                                    <h4>${plan.name}</h4>
                                    <div class="plan-price-large">
                                        R$ <span>${plan.price}</span> /mês
                                    </div>
                                    <ul class="plan-features">
                                        ${plan.features.map(feature => `
                                            <li><i class="fas fa-check"></i> ${feature}</li>
                                        `).join('')}
                                    </ul>
                                </div>
                                <button class="btn btn-primary btn-block" id="next-step">
                                    Continuar <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                            
                            <div class="step-pane" id="step-2">
                                <h3>Dados Pessoais</h3>
                                <div class="user-info-review">
                                    <p><strong>Nome:</strong> ${user.name}</p>
                                    <p><strong>Email:</strong> ${user.email}</p>
                                </div>
                                <button class="btn btn-primary btn-block" id="proceed-payment">
                                    <i class="fas fa-lock"></i> Prosseguir para Pagamento
                                </button>
                            </div>
                            
                            <div class="step-pane" id="step-3">
                                <h3>Pagamento</h3>
                                <div id="payment-container">
                                    <div id="wallet_container"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.openModal(modal.id);

        const steps = modal.querySelectorAll('.step');
        const stepPanes = modal.querySelectorAll('.step-pane');
        let currentStep = 0;

        modal.querySelector('#next-step')?.addEventListener('click', () => {
            steps[currentStep].classList.remove('active');
            stepPanes[currentStep].classList.remove('active');
            
            currentStep++;
            steps[currentStep].classList.add('active');
            stepPanes[currentStep].classList.add('active');
        });

        modal.querySelector('#proceed-payment')?.addEventListener('click', async () => {
            steps[currentStep].classList.remove('active');
            stepPanes[currentStep].classList.remove('active');
            
            currentStep++;
            steps[currentStep].classList.add('active');
            stepPanes[currentStep].classList.add('active');

            try {
                // Aqui você chamaria o sistema de pagamento
                this.showAlert('Redirecionando para pagamento...', 'info');
            } catch (error) {
                this.showAlert('Erro ao processar pagamento', 'danger');
            }
        });

        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal(modal.id);
        });
    }

    async processPayment(planId) {
        if (!auth.isAuthenticated()) {
            this.showAlert('Faça login para continuar', 'warning');
            return;
        }

        const user = auth.getCurrentUser();
        this.showPaymentScreen(user, planId);
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            setTimeout(() => {
                modal.querySelector('.modal-content')?.classList.add('show');
            }, 10);
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.querySelector('.modal-content')?.classList.remove('show');
            
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }, 300);
        }
    }

    updateNotifications() {
        if (!auth.currentUser) return;
        
        const count = database.getUnreadNotificationsCount(auth.currentUser.id);
        const badge = document.getElementById('notification-badge');
        
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    loadNotifications() {
        if (!auth.currentUser) return;
        
        const notifications = database.getUserNotifications(auth.currentUser.id);
        const container = document.getElementById('notifications-list');
        
        if (!container) return;
        
        container.innerHTML = notifications.length > 0 ? 
            notifications.map(notification => `
                <div class="notification-item ${notification.read ? '' : 'unread'}">
                    <div class="notification-icon ${notification.type}">
                        <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
                    </div>
                    <div class="notification-content">
                        <p><strong>${notification.title}</strong> ${notification.message}</p>
                        <span class="notification-time">${this.formatTime(notification.date)}</span>
                        ${!notification.read ? `
                            <div class="notification-actions">
                                <button class="btn btn-sm" data-mark-read="${notification.id}">Marcar como lida</button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('') :
            `<div class="empty-state">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhuma notificação</p>
            </div>`;
        
        container.querySelectorAll('[data-mark-read]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const notificationId = parseInt(e.target.dataset.markRead);
                database.markNotificationAsRead(notificationId);
                this.updateNotifications();
                this.loadNotifications();
            });
        });
    }

    getNotificationIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'danger': 'exclamation-circle'
        };
        return icons[type] || 'bell';
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `${diffMins} min atrás`;
        if (diffHours < 24) return `${diffHours} h atrás`;
        if (diffDays < 7) return `${diffDays} dias atrás`;
        
        return date.toLocaleDateString('pt-BR');
    }

    performSearch(query) {
        const results = database.searchContent(query);
        const container = document.getElementById('search-results');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (results.courses.length === 0 && results.lessons.length === 0) {
            container.innerHTML = '<div class="search-no-results">Nenhum resultado encontrado</div>';
        } else {
            results.courses.forEach(course => {
                const element = document.createElement('div');
                element.className = 'search-result-item';
                element.innerHTML = `
                    <div class="search-result-icon">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="search-result-content">
                        <h4>${course.title}</h4>
                        <p>Curso • ${database.getCategoryById(course.categoryId)?.name || 'Geral'}</p>
                    </div>
                `;
                element.addEventListener('click', () => {
                    router.navigateTo('courses');
                    container.classList.add('hidden');
                });
                container.appendChild(element);
            });
            
            results.lessons.forEach(lesson => {
                const course = database.getCourseById(lesson.courseId);
                const element = document.createElement('div');
                element.className = 'search-result-item';
                element.innerHTML = `
                    <div class="search-result-icon">
                        <i class="fas fa-play-circle"></i>
                    </div>
                    <div class="search-result-content">
                        <h4>${lesson.title}</h4>
                        <p>Aula • ${course ? course.title : 'Curso'}</p>
                    </div>
                `;
                element.addEventListener('click', () => {
                    this.showLesson(lesson.id);
                    container.classList.add('hidden');
                });
                container.appendChild(element);
            });
        }
        
        container.classList.remove('hidden');
    }

    showLesson(lessonId) {
        const lesson = database.getLessonById(lessonId);
        if (!lesson) return;
        
        const course = database.getCourseById(lesson.courseId);
        const user = auth.getCurrentUser();
        const progress = user ? database.getUserProgress(user.id, lesson.courseId) : null;
        const isCompleted = progress?.completedLessons?.includes(lesson.id) || false;
        
        const modalContent = document.getElementById('lesson-modal-content');
        const modalTitle = document.getElementById('lesson-modal-title');
        
        if (modalContent && modalTitle) {
            modalTitle.textContent = lesson.title;
            
            modalContent.innerHTML = `
                <div class="lesson-modal-content">
                    <div class="video-player-container">
                        <iframe src="${lesson.videoUrl}" 
                                frameborder="0" 
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowfullscreen>
                        </iframe>
                    </div>
                    
                    <div class="lesson-info-modal">
                        <h3>${lesson.title}</h3>
                        <p class="lesson-description-modal">${lesson.description}</p>
                        
                        <div class="lesson-meta-modal">
                            <div>
                                <i class="fas fa-book"></i>
                                <span>${course ? course.title : 'Curso'}</span>
                            </div>
                            <div>
                                <i class="fas fa-clock"></i>
                                <span>${lesson.duration} min</span>
                            </div>
                            <div>
                                <i class="fas ${isCompleted ? 'fa-check-circle text-accent' : 'fa-circle'}"></i>
                                <span>${isCompleted ? 'Concluída' : 'Pendente'}</span>
                            </div>
                        </div>
                        
                        ${user && !isCompleted ? `
                            <button class="btn btn-accent btn-block mt-3" id="mark-lesson-complete">
                                <i class="fas fa-check"></i> Marcar como concluída
                            </button>
                        ` : ''}
                    </div>
                    
                    <div class="lesson-actions-modal">
                        <div class="lesson-navigation">
                            <button class="btn btn-outline" id="prev-lesson">
                                <i class="fas fa-chevron-left"></i> Anterior
                            </button>
                            <button class="btn btn-outline" id="next-lesson">
                                Próxima <i class="fas fa-chevron-right"></i>
                            </button>
                        </div>
                        <button class="btn btn-primary" id="go-to-course">
                            <i class="fas fa-external-link-alt"></i> Ir para o curso
                        </button>
                    </div>
                </div>
            `;
            
            if (user && !isCompleted) {
                const markCompleteBtn = modalContent.querySelector('#mark-lesson-complete');
                markCompleteBtn.addEventListener('click', () => {
                    database.updateUserProgress(user.id, lesson.courseId, lesson.id);
                    this.showLesson(lessonId);
                    
                    database.addNotification(user.id, {
                        title: "Aula concluída!",
                        message: `Você completou: ${lesson.title}`,
                        type: "success"
                    });
                    
                    this.updateNotifications();
                });
            }
            
            const goToCourseBtn = modalContent.querySelector('#go-to-course');
            goToCourseBtn.addEventListener('click', () => {
                this.closeModal('lesson-modal');
                router.navigateTo('courses');
            });
            
            this.openModal('lesson-modal');
        }
    }

    showAlert(message, type = 'info') {
        const existingAlert = document.querySelector('.global-alert');
        if (existingAlert) existingAlert.remove();
        
        const alert = document.createElement('div');
        alert.className = `global-alert alert-${type}`;
        alert.innerHTML = `
            <div class="alert-content">
                <i class="fas fa-${this.getAlertIcon(type)}"></i>
                <span>${message}</span>
                <button class="alert-close">&times;</button>
            </div>
        `;
        
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            min-width: 300px;
            max-width: 400px;
            background: white;
            border-radius: 8px;
            padding: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            z-index: 9999;
            animation: slideInRight 0.3s ease;
            border-left: 4px solid ${this.getAlertColor(type)};
        `;
        
        const alertContent = alert.querySelector('.alert-content');
        alertContent.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0.75rem;
        `;
        
        alert.querySelector('.alert-close').addEventListener('click', () => {
            alert.remove();
        });
        
        document.body.appendChild(alert);
        
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    getAlertIcon(type) {
        const icons = {
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'danger': 'exclamation-circle',
            'info': 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getAlertColor(type) {
        const colors = {
            'success': '#10B981',
            'warning': '#F59E0B',
            'danger': '#EF4444',
            'info': '#3B82F6'
        };
        return colors[type] || '#6B7280';
    }
}

// Instância global da UI
const ui = new UI();