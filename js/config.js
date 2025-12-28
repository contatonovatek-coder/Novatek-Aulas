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
                'Fundamentos de front-end e back-end',
                'Lógica de programação + HTML, CSS, JavaScript',
                'Projetos simples para portfólio',
                'Git e boas práticas básicas'
            ]
        },
        PLENO: {
            id: 'pleno',
            name: 'Pleno',
            price: 125,
            description: 'Para quem quer evoluir rapidamente',
            features: [
                'Aplicações completas e escaláveis',
                'Arquitetura de projetos e APIs',
                'Banco de dados e autenticação',
                'Qualidade de código e manutenção'
            ]
        },
        SENIOR: {
            id: 'senior',
            name: 'Sênior',
            price: 160,
            description: 'Experiência completa de aprendizado',
            features: [
                'Arquitetura de sistemas e design patterns',
                'Performance, segurança e escalabilidade',
                'Liderança técnica e mentoria',
                'Visão de negócio e estratégia de software'
            ]
        }
    }
};