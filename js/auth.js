// auth.js - Integração com Supabase Auth
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.subscription = null;
        this._authListenerUnsub = null;
        this.init();
    }

    async init() {
        // Se houver um cliente Supabase disponível, obter usuário atual
        try {
            if (window.supabaseService) {
                const res = await window.supabaseService.getUser();
                if (res.success && res.user) {
                    this.currentUser = this._mapDbUser(res.user);
                    // buscar assinatura
                    await this._refreshSubscription();
                    // sincronizar cache local para compatibilidade com código existente
                    if (window.supabaseService && window.supabaseService.syncCache) {
                        await window.supabaseService.syncCache();
                    }
                    this.updateUIAfterLogin();
                }

                // Inscrever em mudanças de estado de autenticação (recebe registro da tabela `users` ou null)
                this._authListenerUnsub = window.supabaseService.onAuthStateChange(async (event, dbUser) => {
                    if (!dbUser) {
                        // logout
                        this.currentUser = null;
                        this.subscription = null;
                        this.updateUIAfterLogout();
                    } else {
                        this.currentUser = this._mapDbUser(dbUser);
                        await this._refreshSubscription();
                        if (window.supabaseService && window.supabaseService.syncCache) {
                            await window.supabaseService.syncCache();
                        }
                        this.updateUIAfterLogin();
                    }
                });
            }
        } catch (err) {
            console.warn('Auth init error:', err);
        }
    }

    _mapDbUser(dbUser) {
        if (!dbUser) return null;
        const name = dbUser.nome || dbUser.name || '';
        const email = dbUser.email || '';
        return {
            id: dbUser.id,
            email: email,
            name: name,
            avatar: dbUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}`,
            role: (dbUser.tipo || 'estudante'),
            plan: dbUser.plano || null,
            status: dbUser.status || null,
            created_at: dbUser.created_at || null,
            ultimo_login: dbUser.ultimo_login || null,
            // compatibilidade com código existente (camelCase)
            createdAt: dbUser.created_at || null,
            lastLogin: dbUser.ultimo_login || null
        };
    }

    async _refreshSubscription() {
        if (!this.currentUser || !window.supabaseService) return;
        const subRes = await window.supabaseService.fetchSubscriptionByUser(this.currentUser.id);
        if (subRes.success) {
            this.subscription = subRes.subscription;
        } else {
            this.subscription = null;
        }
    }

    async login(email, password) {
        if (!window.supabaseService) return { success: false, message: 'Serviço de autenticação indisponível' };
        const res = await window.supabaseService.signIn(email, password);
        if (!res.success) {
            if (res.error?.message) return { success: false, message: res.error.message };
            return { success: false, message: 'Erro ao autenticar' };
        }

        // Obter usuário atual (registro da tabela `users`)
        const userRes = await window.supabaseService.getUser();
        if (userRes.success && userRes.user) {
            this.currentUser = this._mapDbUser(userRes.user);
            await this._refreshSubscription();
            this.updateUIAfterLogin();
            return { success: true, user: this.currentUser };
        }

        return { success: false, message: 'Falha ao obter dados do usuário' };
    }

    async register(userData) {
        // Manter fluxo anterior: não criar usuário até confirmação de pagamento
        if (!userData.name || !userData.email || !userData.password || !userData.confirmPassword) {
            return { success: false, message: 'Preencha todos os campos' };
        }
        if (userData.password !== userData.confirmPassword) {
            return { success: false, message: 'As senhas não coincidem' };
        }
        if (userData.password.length < 6) {
            return { success: false, message: 'A senha deve ter pelo menos 6 caracteres' };
        }
        if (!userData.plan) return { success: false, message: 'Selecione um plano' };

        localStorage.setItem('selected-plan', userData.plan);
        return {
            success: true,
            userData: {
                name: userData.name,
                email: userData.email,
                password: userData.password,
                plan: userData.plan
            },
            redirectToPayment: true,
            message: 'Cadastro recebido. Complete seu pagamento.'
        };
    }

    async completeRegistrationAfterPayment(userData) {
        // A criação do usuário deverá ser feita via backend ou usando supabase.auth.signUp
        // Para manter a política do front-end (não decidir permissões), recomenda-se criar o usuário via backend
        // Aqui mantemos o comportamento local como fallback (sem autenticar automaticamente)
        if (!userData || !userData.email) return { success: false };
        // fallback local creation (kept for compatibility)
        if (window.database && window.database.createUser) {
            const newUser = window.database.createUser({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                plan: userData.plan,
                status: 'active',
                createdAt: new Date().toISOString()
            });
            this.currentUser = newUser;
            localStorage.setItem('novatek-current-user', JSON.stringify(newUser));
            this.updateUIAfterLogin();
            return { success: true, user: newUser };
        }
        return { success: false, message: 'Não foi possível criar usuário' };
    }

    async logout() {
        if (window.supabaseService) {
            await window.supabaseService.signOut();
        }
        this.currentUser = null;
        this.subscription = null;
        localStorage.removeItem('novatek-current-user');
        localStorage.removeItem('selected-plan');
        if (this._authListenerUnsub) {
            try { this._authListenerUnsub(); } catch (e) {}
            this._authListenerUnsub = null;
        }
        this.updateUIAfterLogout();
        return { success: true };
    }

    updateUIAfterLogin() {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) loginScreen.classList.add('hidden');
        const painel = document.getElementById('painel-do-aluno');
        if (painel) painel.classList.remove('hidden');

        if (this.currentUser) {
            this.updateUserInfo();
            if (!this.hasActiveSubscription()) {
                setTimeout(() => router.navigateTo('subscription'), 100);
            } else {
                setTimeout(() => router.navigateTo('painel-do-aluno'), 100);
            }
        }
    }

    updateUIAfterLogout() {
        const loginScreen = document.getElementById('login-screen');
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
            const loginForm = document.getElementById('login-form');
            if (loginForm) loginForm.reset();
        }
        const painel = document.getElementById('painel-do-aluno');
        if (painel) painel.classList.add('hidden');
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.remove('active');
        const userMenu = document.getElementById('user-menu-dropdown'); if (userMenu) userMenu.classList.add('hidden');
        const notifications = document.getElementById('notifications-dropdown'); if (notifications) notifications.classList.add('hidden');
    }

    updateUserInfo() {
        const user = this.currentUser;
        if (!user) return;
        const userNameElements = document.querySelectorAll('#user-name, #welcome-message');
        userNameElements.forEach(element => {
            if (element.id === 'welcome-message') element.textContent = `Bem-vindo, ${user.name.split(' ')[0]}!`;
            else element.textContent = user.name;
        });
        const avatarElements = document.querySelectorAll('#header-user-avatar, #user-avatar-img');
        avatarElements.forEach(el => el.src = user.avatar || el.src);
        const roleElement = document.getElementById('user-role'); if (roleElement) roleElement.textContent = user.role === 'admin' ? 'Administrador' : 'Estudante';
        const dateElement = document.getElementById('current-date'); if (dateElement) dateElement.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const adminMenu = document.getElementById('admin-menu'); if (adminMenu) { if (user.role === 'admin') adminMenu.classList.remove('hidden'); else adminMenu.classList.add('hidden'); }
        if (window.ui && window.ui.updateNotifications) window.ui.updateNotifications();
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    isAdmin() {
        return this.currentUser && this.currentUser.role === 'admin';
    }

    hasActiveSubscription() {
        if (!this.subscription) return false;
        const status = (this.subscription.status || '').toLowerCase();
        return status === 'ativo' || status === 'active' || status === 'active_payment' || status === 'paid';
    }

    getCurrentUser() {
        return this.currentUser;
    }

    async updateUserProfile(updates) {
        if (!this.currentUser) return null;
        try {
            if (window.supabaseClient) {
                // Tentar atualizar perfil na tabela `profiles` (se existir)
                const supabase = window.supabaseClient;
                if (updates.name || updates.avatar || updates.role) {
                    await supabase.from('profiles').upsert({ id: this.currentUser.id, full_name: updates.name, avatar_url: updates.avatar, role: updates.role });
                }
                // Atualizar dados de autenticação se necessário
                if (updates.email || updates.password) {
                    await supabase.auth.updateUser({ email: updates.email, password: updates.password });
                }
                // Atualizar info local
                Object.assign(this.currentUser, updates);
                this.updateUserInfo();
                return this.currentUser;
            }
        } catch (err) {
            console.warn('Falha ao atualizar perfil:', err);
            return null;
        }
        return null;
    }
}

// Instância global
const auth = new AuthSystem();