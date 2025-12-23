// database.js - Sistema de banco de dados simulado
class Database {
    constructor() {
        this.dbName = 'novatek-dev-v2';
        this.init();
    }

    init() {
        if (!localStorage.getItem(this.dbName)) {
            this.seedDatabase();
        }
        this.loadDatabase();
    }

    loadDatabase() {
        const data = localStorage.getItem(this.dbName);
        this.data = data ? JSON.parse(data) : {};
    }

    saveDatabase() {
        localStorage.setItem(this.dbName, JSON.stringify(this.data));
    }

    seedDatabase() {
        const seedData = {
            users: [],
            courses: this.getCoursesData(),
            lessons: this.getLessonsData(),
            payments: [],
            subscriptions: [],
            certificates: [],
            notifications: [],
            userProgress: [],
            categories: [
                { id: 1, name: 'Frontend', icon: 'fas fa-code', color: '#4F46E5' },
                { id: 2, name: 'Backend', icon: 'fas fa-server', color: '#8B5CF6' },
                { id: 3, name: 'Full Stack', icon: 'fas fa-layer-group', color: '#10B981' },
                { id: 4, name: 'Mobile', icon: 'fas fa-mobile-alt', color: '#EF4444' },
                { id: 5, name: 'Data Science', icon: 'fas fa-chart-line', color: '#3B82F6' },
                { id: 6, name: 'DevOps', icon: 'fas fa-cloud', color: '#F59E0B' }
            ],
            instructors: [
                { id: 1, name: 'Carlos Mendes', role: 'Senior Frontend Engineer', avatar: 'https://i.pravatar.cc/150?img=1' },
                { id: 2, name: 'Ana Costa', role: 'React Specialist', avatar: 'https://i.pravatar.cc/150?img=5' },
                { id: 3, name: 'Roberto Alves', role: 'Backend Architect', avatar: 'https://i.pravatar.cc/150?img=8' },
                { id: 4, name: 'Patrícia Lima', role: 'UI/UX Designer', avatar: 'https://i.pravatar.cc/150?img=11' }
            ],
            adminStats: {
                totalUsers: 0,
                activeSubscriptions: 0,
                totalCourses: 0,
                monthlyRevenue: 0,
                recentActivities: []
            }
        };

        // Adicionar admin padrão
        seedData.users.push({
            id: 1,
            name: 'Administrador',
            email: 'admin@novatek.com',
            password: 'admin123',
            role: 'admin',
            avatar: 'https://i.pravatar.cc/150?img=60',
            plan: 'senior',
            status: 'active',
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true,
                emails: true
            }
        });

        this.data = seedData;
        this.saveDatabase();
        return seedData;
    }

    getCoursesData() {
        return [
            {
                id: 1,
                title: "JavaScript Moderno - Do Zero ao Avançado",
                description: "Domine JavaScript com ES6+, async/await, promises, e construa aplicações reais.",
                fullDescription: "Neste curso você aprenderá JavaScript do absoluto zero até tópicos avançados. Começaremos com os fundamentos e evoluiremos para conceitos modernos como arrow functions, destructuring, promises, async/await e muito mais.",
                categoryId: 1,
                level: 'intermediate',
                duration: 40,
                lessons: 35,
                students: 1250,
                rating: 4.8,
                instructorId: 1,
                image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                previewVideo: 'https://www.youtube.com/embed/PkZNo7MFNFg',
                price: 0,
                requirements: ['Conhecimentos básicos de HTML', 'Computador com acesso à internet'],
                whatYouWillLearn: [
                    'Fundamentos do JavaScript moderno',
                    'Manipulação do DOM',
                    'Programação assíncrona',
                    'ES6+ features',
                    'Projetos práticos'
                ],
                tags: ['javascript', 'frontend', 'es6', 'async'],
                featured: true,
                createdAt: '2023-01-15'
            },
            {
                id: 2,
                title: "React.js - Construindo Aplicações Profissionais",
                description: "Aprenda React com Hooks, Context API, Redux e crie projetos do mundo real.",
                fullDescription: "Curso completo de React.js focado em aplicações profissionais. Você aprenderá desde os fundamentos até técnicas avançadas como custom hooks, performance optimization, testing e deployment.",
                categoryId: 1,
                level: 'advanced',
                duration: 50,
                lessons: 42,
                students: 980,
                rating: 4.9,
                instructorId: 2,
                image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                previewVideo: 'https://www.youtube.com/embed/w7ejDZ8SWv8',
                price: 0,
                requirements: ['JavaScript intermediário', 'Conhecimentos básicos de HTML/CSS'],
                whatYouWillLearn: [
                    'Fundamentos do React',
                    'Hooks e Context API',
                    'State management',
                    'Routing com React Router',
                    'Projetos reais'
                ],
                tags: ['react', 'frontend', 'hooks', 'redux'],
                featured: true,
                createdAt: '2023-02-10'
            },
            {
                id: 3,
                title: "Node.js & Express - Backend Masterclass",
                description: "Desenvolva APIs RESTful robustas com Node.js, Express, MongoDB e autenticação JWT.",
                fullDescription: "Torne-se um desenvolvedor backend completo com Node.js e Express. Aprenda a construir APIs RESTful, integrar bancos de dados, implementar autenticação JWT, e muito mais.",
                categoryId: 2,
                level: 'intermediate',
                duration: 45,
                lessons: 38,
                students: 750,
                rating: 4.7,
                instructorId: 3,
                image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                previewVideo: 'https://www.youtube.com/embed/RLtyhwFtXQA',
                price: 0,
                requirements: ['JavaScript básico', 'Conhecimentos de terminal'],
                whatYouWillLearn: [
                    'Fundamentos do Node.js',
                    'Construção de APIs REST',
                    'Integração com MongoDB',
                    'Autenticação JWT',
                    'Deploy de aplicações'
                ],
                tags: ['nodejs', 'backend', 'express', 'mongodb'],
                featured: true,
                createdAt: '2023-03-05'
            },
            {
                id: 4,
                title: "HTML5 & CSS3 - Fundamentos Web Modernos",
                description: "Domine as bases do desenvolvimento web com HTML5 semântico e CSS3 moderno.",
                fullDescription: "Curso completo para iniciantes em desenvolvimento web. Aprenda HTML5 semântico, CSS3 com Flexbox e Grid, responsividade, acessibilidade e boas práticas.",
                categoryId: 1,
                level: 'beginner',
                duration: 30,
                lessons: 25,
                students: 2100,
                rating: 4.6,
                instructorId: 4,
                image: 'https://images.unsplash.com/photo-1547658719-da2b51169166?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                previewVideo: 'https://www.youtube.com/embed/916GWv2Qs08',
                price: 0,
                requirements: ['Nenhum conhecimento prévio necessário'],
                whatYouWillLearn: [
                    'HTML5 semântico',
                    'CSS3 moderno',
                    'Flexbox e Grid',
                    'Design responsivo',
                    'Projetos práticos'
                ],
                tags: ['html', 'css', 'web', 'frontend'],
                featured: false,
                createdAt: '2023-01-20'
            },
            {
                id: 5,
                title: "Python para Ciência de Dados",
                description: "Aprenda Python, Pandas, NumPy e Matplotlib para análise e visualização de dados.",
                fullDescription: "Curso completo de Python focado em ciência de dados. Aprenda a manipular dados, criar visualizações, e aplicar técnicas de análise com bibliotecas populares.",
                categoryId: 5,
                level: 'intermediate',
                duration: 55,
                lessons: 45,
                students: 620,
                rating: 4.8,
                instructorId: 1,
                image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                previewVideo: 'https://www.youtube.com/embed/rfscVS0vtbw',
                price: 0,
                requirements: ['Lógica de programação', 'Conhecimentos básicos de matemática'],
                whatYouWillLearn: [
                    'Fundamentos do Python',
                    'Pandas para análise de dados',
                    'Visualização com Matplotlib',
                    'NumPy para computação científica',
                    'Projetos reais'
                ],
                tags: ['python', 'datascience', 'pandas', 'numpy'],
                featured: false,
                createdAt: '2023-04-15'
            },
            {
                id: 6,
                title: "TypeScript - Tipagem Avançada",
                description: "Aprofunde-se em TypeScript com generics, decorators, interfaces avançadas.",
                fullDescription: "Domine TypeScript com este curso avançado. Aprenda tipos genéricos, decorators, namespaces, módulos, e como integrar TypeScript com frameworks modernos.",
                categoryId: 1,
                level: 'advanced',
                duration: 35,
                lessons: 30,
                students: 480,
                rating: 4.9,
                instructorId: 2,
                image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                previewVideo: 'https://www.youtube.com/embed/BwuLxPH8IDs',
                price: 0,
                requirements: ['JavaScript intermediário', 'Conhecimentos básicos de OOP'],
                whatYouWillLearn: [
                    'Tipos avançados',
                    'Generics',
                    'Decorators',
                    'Integração com React',
                    'Projetos escaláveis'
                ],
                tags: ['typescript', 'frontend', 'javascript'],
                featured: true,
                createdAt: '2023-05-20'
            }
        ];
    }

    getLessonsData() {
        return [
            // Curso 1 - JavaScript
            { id: 1, courseId: 1, title: "Introdução ao JavaScript", description: "Visão geral do JavaScript e configuração do ambiente.", duration: 45, videoUrl: "https://www.youtube.com/embed/PkZNo7MFNFg", order: 1, resources: ['slides.pdf', 'exercicios.zip'] },
            { id: 2, courseId: 1, title: "Variáveis e Tipos de Dados", description: "let, const, var e os tipos primitivos do JavaScript.", duration: 60, videoUrl: "https://www.youtube.com/embed/PkZNo7MFNFg", order: 2, resources: [] },
            { id: 3, courseId: 1, title: "Funções em JavaScript", description: "Funções tradicionais, arrow functions e parâmetros.", duration: 50, videoUrl: "https://www.youtube.com/embed/PkZNo7MFNFg", order: 3, resources: ['exemplos.js'] },
            
            // Curso 2 - React
            { id: 4, courseId: 2, title: "Introdução ao React", description: "O que é React e por que usá-lo.", duration: 55, videoUrl: "https://www.youtube.com/embed/w7ejDZ8SWv8", order: 1, resources: [] },
            { id: 5, courseId: 2, title: "Componentes e Props", description: "Criando componentes reutilizáveis.", duration: 65, videoUrl: "https://www.youtube.com/embed/w7ejDZ8SWv8", order: 2, resources: ['componentes-exemplo.zip'] },
            
            // Curso 3 - Node.js
            { id: 6, courseId: 3, title: "Introdução ao Node.js", description: "Configuração e primeiros passos.", duration: 50, videoUrl: "https://www.youtube.com/embed/RLtyhwFtXQA", order: 1, resources: [] },
            
            // Curso 4 - HTML/CSS
            { id: 7, courseId: 4, title: "HTML5 Semântico", description: "Estrutura semântica de páginas web.", duration: 40, videoUrl: "https://www.youtube.com/embed/916GWv2Qs08", order: 1, resources: [] },
            
            // Curso 5 - Python
            { id: 8, courseId: 5, title: "Introdução ao Python", description: "Instalação e sintaxe básica.", duration: 55, videoUrl: "https://www.youtube.com/embed/rfscVS0vtbw", order: 1, resources: [] },
            
            // Curso 6 - TypeScript
            { id: 9, courseId: 6, title: "TypeScript Basics", description: "Configuração e tipos básicos.", duration: 45, videoUrl: "https://www.youtube.com/embed/BwuLxPH8IDs", order: 1, resources: [] }
        ];
    }

    // Métodos para usuários
    createUser(userData) {
        const newId = this.data.users.length > 0 ? Math.max(...this.data.users.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: newId,
            ...userData,
            role: 'student',
            status: 'pending_payment',
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=4F46E5&color=fff`,
            joinDate: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            preferences: {
                theme: 'light',
                notifications: true,
                emails: true
            }
        };
        
        this.data.users.push(newUser);
        this.saveDatabase();
        
        this.data.adminStats.totalUsers = this.data.users.length;
        this.saveDatabase();
        
        return newUser;
    }

    getUserByEmail(email) {
        return this.data.users.find(user => user.email === email);
    }

    getUserById(id) {
        return this.data.users.find(user => user.id === id);
    }

    updateUser(id, updates) {
        const userIndex = this.data.users.findIndex(u => u.id === id);
        if (userIndex !== -1) {
            this.data.users[userIndex] = { ...this.data.users[userIndex], ...updates };
            this.saveDatabase();
            return this.data.users[userIndex];
        }
        return null;
    }

    // Métodos para cursos
    getAllCourses() {
        return this.data.courses;
    }

    getFeaturedCourses() {
        return this.data.courses.filter(course => course.featured);
    }

    getCourseById(id) {
        return this.data.courses.find(course => course.id === id);
    }

    getCoursesByCategory(categoryId) {
        return this.data.courses.filter(course => course.categoryId === categoryId);
    }

    // Métodos para categorias
    getAllCategories() {
        return this.data.categories;
    }

    getCategoryById(id) {
        return this.data.categories.find(cat => cat.id === id);
    }

    // Métodos para instrutores
    getInstructorById(id) {
        return this.data.instructors.find(instructor => instructor.id === id);
    }

    // Métodos para aulas
    getLessonsByCourseId(courseId) {
        return this.data.lessons
            .filter(lesson => lesson.courseId === courseId)
            .sort((a, b) => a.order - b.order);
    }

    getLessonById(id) {
        return this.data.lessons.find(lesson => lesson.id === id);
    }

    // Métodos para pagamentos
    createPayment(paymentData) {
        const newId = this.data.payments.length > 0 ? Math.max(...this.data.payments.map(p => p.id)) + 1 : 1;
        const payment = {
            id: newId,
            ...paymentData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.data.payments.push(payment);
        this.saveDatabase();
        return payment;
    }

    getPaymentsByUserId(userId) {
        return this.data.payments.filter(payment => payment.userId === userId);
    }

    // Métodos para assinaturas
    createSubscription(subscriptionData) {
        const newId = this.data.subscriptions.length > 0 ? Math.max(...this.data.subscriptions.map(s => s.id)) + 1 : 1;
        const subscription = {
            id: newId,
            ...subscriptionData,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.data.subscriptions.push(subscription);
        
        this.data.adminStats.activeSubscriptions = this.data.subscriptions.filter(s => s.status === 'active').length;
        this.saveDatabase();
        
        return subscription;
    }

    getSubscriptionByUserId(userId) {
        return this.data.subscriptions.find(sub => sub.userId === userId && sub.status === 'active');
    }

    updateSubscriptionStatus(userId, status) {
        const subscription = this.getSubscriptionByUserId(userId);
        if (subscription) {
            subscription.status = status;
            subscription.updatedAt = new Date().toISOString();
            this.saveDatabase();
        }
    }

    // Métodos para progresso
    getUserProgress(userId, courseId) {
        return this.data.userProgress.find(
            progress => progress.userId === userId && progress.courseId === courseId
        );
    }

    updateUserProgress(userId, courseId, lessonId) {
        let progress = this.getUserProgress(userId, courseId);
        const lessons = this.getLessonsByCourseId(courseId);
        
        if (!progress) {
            progress = {
                userId,
                courseId,
                completedLessons: [lessonId],
                lastAccessed: new Date().toISOString()
            };
            this.data.userProgress.push(progress);
        } else {
            if (!progress.completedLessons.includes(lessonId)) {
                progress.completedLessons.push(lessonId);
            }
            progress.lastAccessed = new Date().toISOString();
        }
        
        progress.progress = Math.round((progress.completedLessons.length / lessons.length) * 100);
        this.saveDatabase();
        
        return progress;
    }

    // Métodos para certificados
    createCertificate(certificateData) {
        const newId = this.data.certificates.length > 0 ? Math.max(...this.data.certificates.map(c => c.id)) + 1 : 1;
        const certificate = {
            id: newId,
            ...certificateData,
            issuedAt: new Date().toISOString()
        };
        
        this.data.certificates.push(certificate);
        this.saveDatabase();
        return certificate;
    }

    getCertificatesByUserId(userId) {
        return this.data.certificates.filter(cert => cert.userId === userId);
    }

    // Métodos para notificações
    addNotification(userId, notification) {
        const newId = this.data.notifications.length > 0 ? Math.max(...this.data.notifications.map(n => n.id)) + 1 : 1;
        const newNotification = {
            id: newId,
            userId,
            ...notification,
            date: new Date().toISOString(),
            read: false
        };
        
        this.data.notifications.push(newNotification);
        this.saveDatabase();
        return newNotification;
    }

    getUserNotifications(userId) {
        return this.data.notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    getUnreadNotificationsCount(userId) {
        return this.data.notifications.filter(n => n.userId === userId && !n.read).length;
    }

    markAllNotificationsAsRead(userId) {
        this.data.notifications.forEach(n => {
            if (n.userId === userId) n.read = true;
        });
        this.saveDatabase();
    }

    // Busca
    searchContent(query) {
        query = query.toLowerCase();
        return {
            courses: this.data.courses.filter(course => 
                course.title.toLowerCase().includes(query) || 
                course.description.toLowerCase().includes(query) ||
                course.tags.some(tag => tag.includes(query))
            ),
            lessons: this.data.lessons.filter(lesson => 
                lesson.title.toLowerCase().includes(query) || 
                lesson.description.toLowerCase().includes(query)
            )
        };
    }

    // Admin
    getAdminStats() {
        return this.data.adminStats;
    }

    getAllUsers() {
        return this.data.users;
    }

    getRecentActivities() {
        return this.data.adminStats.recentActivities;
    }

    addActivity(activity) {
        this.data.adminStats.recentActivities.unshift({
            id: Date.now(),
            ...activity,
            time: new Date().toISOString()
        });
        
        if (this.data.adminStats.recentActivities.length > 10) {
            this.data.adminStats.recentActivities.pop();
        }
        
        this.saveDatabase();
    }
}

// Instância global do banco de dados
const database = new Database();