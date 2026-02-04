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
                        this.showAlert('Cadastro recebido. Abrindo pagamento...', 'info');
                        this.closeModal('register-modal');
                        // Abrir modal de pagamento sem autenticar o usuário
                        this.showPaymentScreen(result.userData, plan);
                    } else if (result.success) {
                        this.showAlert(result.message || 'Cadastro efetuado!', 'success');
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
                (!menuToggle || !menuToggle.contains(e.target))) {
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

        // Atualizar campo oculto para compatibilidade com o formulário de registro
        try {
            const hidden = document.getElementById('register-plan');
            if (hidden) hidden.value = planId;
        } catch (e) {}
    }

    async handleLogin() {
        const emailEl = document.getElementById('email');
        const passwordEl = document.getElementById('password');
        const email = emailEl?.value?.trim();
        const password = passwordEl?.value || '';

        if (!email || !password) {
            this.showAlert('Por favor, preencha todos os campos', 'warning');
            return;
        }

        const loginBtn = document.querySelector('.btn-login');
        const originalText = loginBtn ? loginBtn.innerHTML : null;
        if (loginBtn) {
            loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
            loginBtn.disabled = true;
        }

        // Timeout para evitar spinner infinito caso a chamada trave
        const timeoutMs = 15000;
        try {
            const loginPromise = auth.login(email, password);
            const result = await Promise.race([
                loginPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
            ]);

            if (result && result.redirectToPayment) {
                this.closeModal('register-modal');
                this.showPaymentScreen(result.user);
            } else if (result && result.success) {
                this.showAlert('Login realizado com sucesso!', 'success');
            } else if (result && !result.success) {
                this.showAlert(result.message || 'Erro no login', 'danger');
            } else {
                this.showAlert('Erro ao fazer login. Tente novamente.', 'danger');
            }
        } catch (error) {
            if (error && error.message === 'timeout') {
                this.showAlert('Tempo de resposta esgotado. Verifique sua conexão.', 'warning');
            } else {
                this.showAlert('Erro ao fazer login. Tente novamente.', 'danger');
            }
        } finally {
            if (loginBtn) {
                loginBtn.innerHTML = originalText || '<i class="fas fa-sign-in-alt"></i> Entrar';
                loginBtn.disabled = false;
            }
        }
    }

    showPaymentScreen(tempUserData, planId = null) {
        const plan = planId ? CONFIG.PLANS[planId.toUpperCase()] : CONFIG.PLANS.JUNIOR;

        const pixCode = `PIX:${(tempUserData && tempUserData.email) || 'guest'}:${Date.now()}:${planId || 'JUNIOR'}`;

        const modal = document.createElement('div');
        modal.className = 'modal pix-payment-modal';
        modal.id = `pix-payment-${Date.now()}`;
        modal.innerHTML = `
            <div class="modal-content" style="max-width:520px; max-height:90vh; display:flex; flex-direction:column;">
                <div class="modal-header">
                    <h2>Pagamento via PIX</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body" style="overflow:auto; padding:20px;">
                    <div style="display:flex; flex-direction:column; align-items:center; gap:16px;">
                        <img id="pix-qr-img" src="https://chart.googleapis.com/chart?chs=300x300&cht=qr&chl=${encodeURIComponent(pixCode)}" alt="QR Code" style="width:260px; height:260px; max-width:80%;" />
                        <p style="margin:0; text-align:center;">Escaneie o QR Code para pagar</p>

                        <style>
                            .pix-input-wrapper{width:100%;}
                            .pix-input-wrapper .pix-input{width:100%; padding:10px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box;}
                            .pix-input-wrapper .pix-copy-btn{display:inline-block}

                            /* Mobile: colocar o botão dentro do campo à direita */
                            @media (max-width:600px){
                                .pix-input-wrapper{position:relative}
                                .pix-input-wrapper .pix-input{padding-right:110px}
                                .pix-input-wrapper .pix-copy-btn{position:absolute; right:8px; top:50%; transform:translateY(-50%); height:36px; padding:6px 10px; border-radius:6px}
                                .pix-input-wrapper{display:block}
                            }

                            /* Desktop: botão ao lado */
                            @media (min-width:601px){
                                .pix-input-row{display:flex; gap:8px; align-items:center}
                                .pix-input-row .pix-copy-btn{position:static; transform:none}
                                .pix-input-row .pix-input{padding-right:10px}
                            }
                        </style>

                        <div class="pix-input-row pix-input-wrapper">
                            <input id="pix-code-input" class="pix-input" readonly value="${pixCode}" />
                            <button id="pix-copy-btn" class="pix-copy-btn btn btn-primary">Copiar código</button>
                        </div>

                        <div id="copy-feedback" style="color:var(--accent); font-weight:600; display:none;">Copiado!</div>

                        <div id="pix-timer" style="font-size:18px; font-weight:700;">10:00</div>

                        <div id="pix-expired" style="display:none; color:#c00; text-align:center;">Tempo expirado. Gere um novo pagamento.</div>

                        <div style="width:100%;">
                            <button id="pix-confirm-btn" class="btn btn-accent btn-block">Já paguei</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.openModal(modal.id);

        const qrImg = modal.querySelector('#pix-qr-img');
        const copyBtn = modal.querySelector('#pix-copy-btn');
        const codeInput = modal.querySelector('#pix-code-input');
        const feedback = modal.querySelector('#copy-feedback');
        const timerEl = modal.querySelector('#pix-timer');
        const expiredEl = modal.querySelector('#pix-expired');
        const confirmBtn = modal.querySelector('#pix-confirm-btn');

        let remaining = 600; // seconds
        timerEl.textContent = this.formatCountdown(remaining);

        const intervalId = setInterval(() => {
            remaining--;
            if (remaining <= 0) {
                clearInterval(intervalId);
                timerEl.textContent = '00:00';
                expiredEl.style.display = 'block';
                qrImg.style.opacity = '0.5';
                qrImg.style.pointerEvents = 'none';
                copyBtn.disabled = true;
                return;
            }
            timerEl.textContent = this.formatCountdown(remaining);
        }, 1000);

        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(codeInput.value);
                feedback.style.display = 'block';
                setTimeout(() => feedback.style.display = 'none', 2000);
            } catch (err) {
                this.showAlert('Não foi possível copiar para a área de transferência', 'danger');
            }
        });

        confirmBtn.addEventListener('click', async () => {
            confirmBtn.disabled = true;
            confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Confirmando...';
            clearInterval(intervalId);

            try {
                const result = await auth.completeRegistrationAfterPayment(tempUserData);
                if (result.success) {
                    this.closeModal(modal.id);
                    this.showAlert('Pagamento confirmado. Bem-vindo!', 'success');
                    router.navigateTo('painel-do-aluno');
                } else {
                    this.showAlert('Erro ao finalizar cadastro após pagamento', 'danger');
                    confirmBtn.disabled = false;
                    confirmBtn.innerHTML = 'Já paguei';
                }
            } catch (err) {
                this.showAlert('Erro ao processar confirmação', 'danger');
                confirmBtn.disabled = false;
                confirmBtn.innerHTML = 'Já paguei';
            }
        });

        modal.querySelector('.modal-close').addEventListener('click', () => {
            clearInterval(intervalId);
            this.closeModal(modal.id);
        });
    }

    formatCountdown(seconds) {
        const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
        const ss = String(seconds % 60).padStart(2, '0');
        return `${mm}:${ss}`;
    }

    formatTime(time) {
        if (!time) return '';

        // aceitar timestamps em segundos ou milissegundos e strings ISO
        const date = (typeof time === 'number' && String(time).length === 10) ? new Date(time * 1000) : new Date(time);
        if (isNaN(date.getTime())) return '';

        const diffMs = Date.now() - date.getTime();
        const sec = Math.floor(diffMs / 1000);
        if (sec < 60) return 'agora';

        const min = Math.floor(sec / 60);
        if (min < 60) return `há ${min} minuto${min > 1 ? 's' : ''}`;

        const hrs = Math.floor(min / 60);
        if (hrs < 24) return `há ${hrs} hora${hrs > 1 ? 's' : ''}`;

        const days = Math.floor(hrs / 24);
        if (days < 7) return `há ${days} dia${days > 1 ? 's' : ''}`;

        return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    }

    async processPayment(planId) {
        // Permitir iniciar pagamento mesmo para usuários não autenticados.
        // Usuários não autenticados serão direcionados para o registro (que abre o modal de pagamento em seguida).
        if (!auth.isAuthenticated()) {
            localStorage.setItem('selected-plan', planId);
            this.openModal('register-modal');
            return;
        }

        const user = auth.getCurrentUser();
        this.showPaymentScreen({ name: user.name, email: user.email }, planId);
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

    async showLesson(lessonId) {
        // Busca a lesson via Supabase se disponível, senão fallback local
        let lesson = null;
        if (window.supabaseService) {
            const lres = await window.supabaseService.getLessonById(lessonId);
            if (lres.success) lesson = lres.lesson;
        }

        if (!lesson && window.database) {
            lesson = window.database.getLessonById(lessonId);
        }

        if (!lesson) return;

        // course
        let course = null;
        if (window.supabaseService) {
            const cres = await window.supabaseService.getCourseById(lesson.course_id || lesson.courseId);
            if (cres.success) course = cres.course;
        }
        if (!course && window.database) course = window.database.getCourseById(lesson.courseId);

        const user = auth.getCurrentUser();
        const progressRes = user ? await window.supabaseService.getUserProgress(user.id, lesson.course_id || lesson.courseId) : { success: false };
        const progress = progressRes.success ? progressRes.progress : (window.database ? window.database.getUserProgress(user.id, lesson.courseId) : null);
        const isCompleted = progress?.completed_lessons?.includes(lesson.id) || false;

        const modalContent = document.getElementById('lesson-modal-content');
        const modalTitle = document.getElementById('lesson-modal-title');

        if (!modalContent || !modalTitle) return;

        modalTitle.textContent = `${course ? course.title + ' — ' : ''}${lesson.title}`;

        // all lessons (ordered)
        let allLessons = [];
        if (window.supabaseService) {
            const llist = await window.supabaseService.getLessonsByCourseId(lesson.course_id || lesson.courseId);
            if (llist.success) allLessons = llist.lessons || [];
        }
        if (!allLessons.length && window.database) allLessons = window.database.getLessonsByCourseId(lesson.courseId) || [];

        const lessonIndex = allLessons.findIndex(l => l.id === lesson.id);
        const lessonNumber = lessonIndex !== -1 ? (lessonIndex + 1) : 1;
        const totalLessons = allLessons.length;

        const statusLabel = isCompleted ? 'Concluída' : (progress && progress.lastAccessed ? 'Em andamento' : 'Não iniciada');
        const statusClass = isCompleted ? 'badge-accent' : (statusLabel === 'Em andamento' ? 'badge-warning' : 'badge-primary');

        const hasVideo = !!lesson.videoUrl;
        const hasLive = !!lesson.liveUrl || !!lesson.link;
        const hasActivity = !!lesson.activity;

        // materials via supabase (RLS garante acesso)
        let materials = [];
        if (window.supabaseService) {
            const mres = await window.supabaseService.fetchMaterialsByLesson(lesson.id);
            if (mres.success) materials = mres.materials || [];
            else if (mres.accessDenied) {
                // usuário não tem acesso aos materiais
                materials = null; // sinaliza acesso negado
            }
        }
        if (materials && !materials.length && window.database) materials = lesson.resources || [];

        // Se materials === null => acesso negado
        const materialsBlock = (materials === null) ? `<div class="block block-materials"><p class="text-danger">Você não tem permissão para acessar os materiais desta aula.</p></div>` : (materials && materials.length ? `
            <section class="block block-materials">
                <h4 class="block-title">Material para leitura</h4>
                <ul class="resources-list">
                    ${materials.map(m => `<li><i class="fas fa-file-pdf"></i> <a href="${m}" target="_blank">${m}</a></li>`).join('')}
                </ul>
            </section>
        ` : '');

        modalContent.innerHTML = `
            <div class="lesson-modal-content">
                <div class="lesson-top">
                    <div class="lesson-status-badge ${statusClass}">
                        <i class="fas ${isCompleted ? 'fa-check-circle' : (statusLabel === 'Em andamento' ? 'fa-spinner' : 'fa-circle')}"></i>
                        <span>${statusLabel}</span>
                    </div>
                    <div class="lesson-progress-indicator">Aula ${lessonNumber} de ${totalLessons}</div>
                </div>

                <h2 class="lesson-modal-title">${lesson.title}</h2>

                <div class="lesson-main-grid">
                    ${hasVideo ? `
                        <section class="block block-video">
                            <h4 class="block-title">Vídeo</h4>
                            <div class="video-player-container">
                                <iframe src="${lesson.videoUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>
                        </section>
                    ` : ''}

                    ${hasLive ? `
                        <section class="block block-live">
                            <h4 class="block-title">Aula ao vivo / Link</h4>
                            <p class="text-sm text-gray">${lesson.liveDescription || 'Acesse a sessão ao vivo ou recurso externo.'}</p>
                            <a class="btn btn-primary btn-lg live-enter" href="${lesson.liveUrl || lesson.link}" target="_blank" rel="noopener noreferrer">Entrar na aula</a>
                        </section>
                    ` : ''}

                    ${hasActivity ? `
                        <section class="block block-activity">
                            <h4 class="block-title">Atividade</h4>
                            <p class="text-gray">${lesson.activity?.description || lesson.activity}</p>
                            <button class="btn btn-outline btn-block start-activity">Iniciar atividade</button>
                        </section>
                    ` : ''}

                    ${materialsBlock}
                </div>

                <div class="lesson-actions-modal spaced">
                    <div class="left-actions">
                        <button class="btn btn-outline" id="prev-lesson"><i class="fas fa-chevron-left"></i> Aula anterior</button>
                        <button class="btn btn-outline" id="next-lesson">Próxima aula <i class="fas fa-chevron-right"></i></button>
                    </div>
                    <div class="right-actions">
                        <button class="btn ${isCompleted ? 'btn-outline-danger' : 'btn-accent'}" id="toggle-complete">
                            <i class="fas ${isCompleted ? 'fa-times-circle' : 'fa-check'}"></i>
                            ${isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
                        </button>
                        <button class="btn btn-primary" id="go-to-course"><i class="fas fa-external-link-alt"></i> Ir para o curso</button>
                    </div>
                </div>
            </div>
        `;

        // event handlers
        const prevBtn = modalContent.querySelector('#prev-lesson');
        const nextBtn = modalContent.querySelector('#next-lesson');
        const toggleBtn = modalContent.querySelector('#toggle-complete');
        const goToCourseBtn = modalContent.querySelector('#go-to-course');

        if (prevBtn) {
            const prevLesson = allLessons[lessonIndex - 1];
            if (!prevLesson) prevBtn.disabled = true;
            prevBtn.addEventListener('click', () => { if (prevLesson) this.showLesson(prevLesson.id); });
        }
        if (nextBtn) {
            const nextLesson = allLessons[lessonIndex + 1];
            if (!nextLesson) nextBtn.disabled = true;
            nextBtn.addEventListener('click', () => { if (nextLesson) this.showLesson(nextLesson.id); });
        }

        if (toggleBtn && user) {
            toggleBtn.addEventListener('click', async () => {
                if (!isCompleted) {
                    if (window.supabaseService) {
                        const upd = await window.supabaseService.updateUserProgress(user.id, lesson.course_id || lesson.courseId, lesson.id);
                        if (!upd.success) {
                            if (upd.accessDenied) return this.showAlert('Acesso negado ao marcar progresso.', 'danger');
                            return this.showAlert('Erro ao atualizar progresso.', 'danger');
                        }
                        const note = await window.supabaseService.addNotification(user.id, { title: 'Aula concluída!', message: `Você completou: ${lesson.title}`, type: 'success' });
                        if (!note.success) {
                            if (note.accessDenied) return this.showAlert('Acesso negado ao adicionar notificação.', 'danger');
                        }
                    } else if (window.database) {
                        database.updateUserProgress(user.id, lesson.courseId, lesson.id);
                        database.addNotification(user.id, { title: 'Aula concluída!', message: `Você completou: ${lesson.title}`, type: 'success' });
                    }
                } else {
                    if (window.supabaseService) {
                        const rem = await window.supabaseService.removeLessonFromProgress(user.id, lesson.course_id || lesson.courseId, lesson.id);
                        if (!rem.success) {
                            if (rem.accessDenied) return this.showAlert('Acesso negado ao atualizar progresso.', 'danger');
                            return this.showAlert('Erro ao atualizar progresso.', 'danger');
                        }
                        const note = await window.supabaseService.addNotification(user.id, { title: 'Marcação removida', message: `A marcação de conclusão foi removida: ${lesson.title}`, type: 'info' });
                        if (!note.success) {
                            if (note.accessDenied) return this.showAlert('Acesso negado ao adicionar notificação.', 'danger');
                        }
                    } else if (window.database) {
                        database.removeLessonFromProgress(user.id, lesson.courseId, lesson.id);
                        database.addNotification(user.id, { title: 'Marcação removida', message: `A marcação de conclusão foi removida: ${lesson.title}`, type: 'info' });
                    }
                }
                this.updateNotifications();
                this.showLesson(lessonId);
            });
        }

        if (goToCourseBtn) {
            goToCourseBtn.addEventListener('click', () => {
                this.closeModal('lesson-modal');
                router.navigateTo('courses');
            });
        }

        const startActivityBtn = modalContent.querySelector('.start-activity');
        if (startActivityBtn) startActivityBtn.addEventListener('click', () => this.showAlert('Iniciando atividade...', 'info'));

        this.openModal('lesson-modal');
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
// garantir disponibilidade via window (scripts podem esperar window.ui)
try { window.ui = ui; } catch (e) {}