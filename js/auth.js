// auth.js - Sistema de autenticação CORRIGIDO
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        const savedUser = localStorage.getItem('novatek-current-user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUIAfterLogin();
        }
    }

    async login(email, password) {
        const user = database.getUserByEmail(email);
        
        if (!user) {
            return { success: false, message: "Usuário não encontrado" };
        }
        
        if (user.password !== password) {
            return { success: false, message: "Senha incorreta" };
        }
        
        // Verificar status da assinatura
        if (user.status === 'pending_payment') {
            return { 
                success: false, 
                redirectToPayment: true,
                user,
                message: "Complete seu pagamento para acessar a plataforma" 
            };
        }
        
        // Atualizar último login
        user.lastLogin = new Date().toISOString();
        database.updateUser(user.id, { lastLogin: user.lastLogin });
        
        // Salvar usuário atual
        this.currentUser = user;
        localStorage.setItem('novatek-current-user', JSON.stringify(user));
        
        // Atualizar UI
        this.updateUIAfterLogin();
        
        // Adicionar notificação
        database.addNotification(user.id, {
            title: "Login realizado",
            message: "Bem-vindo de volta à NOVATEK DEV!",
            type: "info"
        });
        
        database.addActivity({
            type: 'user_login',
            message: `Usuário logado: ${user.name}`
        });
        
        return { success: true, user };
    }

    async register(userData) {
        // Validar dados
        if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
            return { success: false, message: "Preencha todos os campos" };
        }
        
        if (userData.password !== userData.confirmPassword) {
            return { success: false, message: "As senhas não coincidem" };
        }
        
        if (userData.password.length < 6) {
            return { success: false, message: "A senha deve ter pelo menos 6 caracteres" };
        }
        
        // Verificar se email já existe
        if (database.getUserByEmail(userData.email)) {
            return { success: false, message: "Este e-mail já está cadastrado" };
        }
        
        // Validar plano selecionado
        if (!userData.plan) {
            return { success: false, message: "Selecione um plano" };
        }
        
        // Criar usuário
        const newUser = database.createUser({
            name: userData.name,
            email: userData.email,
            password: userData.password,
            plan: userData.plan
        });
        
        // Salvar usuário atual
        this.currentUser = newUser;
        localStorage.setItem('novatek-current-user', JSON.stringify(newUser));
        
        // Salvar plano selecionado para o fluxo de pagamento
        localStorage.setItem('selected-plan', userData.plan);
        
        return { 
            success: true, 
            user: newUser,
            redirectToPayment: true,
            message: "Cadastro realizado com sucesso! Complete seu pagamento."
        };
    }

    logout() {
        // Adicionar atividade
        if (this.currentUser) {
            database.addActivity({
                type: 'user_logout',
                message: `Usuário deslogado: ${this.currentUser.name}`
            });
        }
        
        // Limpar dados
        this.currentUser = null;
        localStorage.removeItem('novatek-current-user');
        localStorage.removeItem('selected-plan');
        
        // Atualizar UI
        this.updateUIAfterLogout();
        
        // Fechar todos os modais
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.add('hidden');
        });
        
        return { success: true };
    }

    updateUIAfterLogin() {
        // Esconder login screen
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
        
        // Mostrar dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.classList.remove('hidden');
        }
        
        if (this.currentUser) {
            this.updateUserInfo();
            
            // Se o usuário precisa pagar, redirecionar para pagamento
            if (this.currentUser.status === 'pending_payment') {
                setTimeout(() => {
                    router.navigateTo('payment');
                }, 100);
            } else {
                // Se já pagou, ir para dashboard
                setTimeout(() => {
                    router.navigateTo('dashboard');
                }, 100);
            }
        }
    }

    updateUIAfterLogout() {
        // Mostrar login screen
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
            // Resetar formulário
            const loginForm = document.getElementById('login-form');
            if (loginForm) {
                loginForm.reset();
            }
        }
        
        // Esconder dashboard
        const dashboard = document.getElementById('dashboard');
        if (dashboard) {
            dashboard.classList.add('hidden');
        }
        
        // Resetar sidebar mobile
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('active');
        }
        
        // Fechar menus abertos
        const userMenu = document.getElementById('user-menu-dropdown');
        if (userMenu) {
            userMenu.classList.add('hidden');
        }
        
        const notifications = document.getElementById('notifications-dropdown');
        if (notifications) {
            notifications.classList.add('hidden');
        }
    }

    updateUserInfo() {
        const user = this.currentUser;
        if (!user) return;

        // Atualizar nome do usuário
        const userNameElements = document.querySelectorAll('#user-name, #welcome-message');
        userNameElements.forEach(element => {
            if (element.id === 'welcome-message') {
                element.textContent = `Bem-vindo, ${user.name.split(' ')[0]}!`;
            } else {
                element.textContent = user.name;
            }
        });

        // Atualizar avatares
        const avatarElements = document.querySelectorAll('#header-user-avatar, #user-avatar-img');
        avatarElements.forEach(element => {
            element.src = user.avatar;
        });

        // Atualizar role
        const roleElement = document.getElementById('user-role');
        if (roleElement) {
            roleElement.textContent = user.role === 'admin' ? 'Administrador' : 'Estudante';
        }

        // Atualizar data atual
        const dateElement = document.getElementById('current-date');
        if (dateElement) {
            const now = new Date();
            dateElement.textContent = now.toLocaleDateString('pt-BR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        // Mostrar/ocultar menu admin
        const adminMenu = document.getElementById('admin-menu');
        if (adminMenu) {
            if (user.role === 'admin') {
                adminMenu.classList.remove('hidden');
            } else {
                adminMenu.classList.add('hidden');
            }
        }

        // Atualizar notificações
        if (window.ui && window.ui.updateNotifications) {
            window.ui.updateNotifications();
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    hasActiveSubscription() {
        return this.currentUser && this.currentUser.status === 'active';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateUserProfile(updates) {
        if (!this.currentUser) return null;
        
        const updatedUser = database.updateUser(this.currentUser.id, updates);
        if (updatedUser) {
            this.currentUser = updatedUser;
            localStorage.setItem('novatek-current-user', JSON.stringify(updatedUser));
            this.updateUserInfo();
            return updatedUser;
        }
        return null;
    }
}

// Instância global
const auth = new AuthSystem();