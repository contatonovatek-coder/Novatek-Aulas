// config.js - Configurações do sistema
const CONFIG = {
    // Mercado Pago
    MERCADO_PAGO: {
        PUBLIC_KEY: 'APP_USR-cc878ede-658c-461a-a881-b97aba9b09dc',
        ACCESS_TOKEN: 'APP_USR-6705375114980508-122310-e21f95ee6a759d9f0a6d5a697db22fad-1403565329',
        CLIENT_ID: '6705375114980508',
        CLIENT_SECRET: 'CvferYNiKryr6bpNNTY5DVs6hHSuN4fL'
    },
    
    // Planos de assinatura
    PLANS: {
        JUNIOR: {
            id: 'junior',
            name: 'Júnior',
            price: 100,
            description: 'Ideal para iniciantes',
            features: [
                'Acesso a cursos básicos',
                'Suporte por e-mail',
                'Certificados inclusos',
                '1 projeto prático',
                'Comunidade de alunos'
            ]
        },
        PLENO: {
            id: 'pleno',
            name: 'Pleno',
            price: 125,
            description: 'Para quem quer evoluir rapidamente',
            features: [
                'Todos os recursos do Júnior',
                'Acesso a cursos intermediários',
                'Suporte prioritário',
                '3 projetos práticos',
                'Code reviews',
                'Webinars mensais'
            ]
        },
        SENIOR: {
            id: 'senior',
            name: 'Sênior',
            price: 160,
            description: 'Experiência completa de aprendizado',
            features: [
                'Todos os recursos do Pleno',
                'Acesso a todos os cursos',
                'Suporte 24/7',
                'Mentoria individual',
                'Projetos avançados',
                'Workshops exclusivos',
                'Acesso antecipado a novos cursos'
            ]
        }
    }
};