// supabaseClient.js - Inicializa o client do Supabase no frontend
(function(){
    // Tentativas de leitura das variáveis de ambiente no frontend:
    // 1) window.SUPABASE_URL / window.SUPABASE_ANON_KEY (recomendado)
    // 2) meta tags <meta name="supabase-url"> / <meta name="supabase-anon-key">
    const SUPABASE_URL = window.SUPABASE_URL || document.querySelector('meta[name="supabase-url"]')?.content || null;
    const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || document.querySelector('meta[name="supabase-anon-key"]')?.content || null;

    if (!window.supabase) {
        // SDK não carregado (verifique se o script CDN foi incluído)
        console.warn('Supabase SDK não detectado. As funcionalidades de Supabase ficarão indisponíveis.');
        window.supabaseClient = null;
        return;
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.warn('SUPABASE_URL ou SUPABASE_ANON_KEY não configurados. Defina window.SUPABASE_URL e window.SUPABASE_ANON_KEY ou meta tags.');
        window.supabaseClient = null;
        return;
    }

    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.info('Supabase client inicializado');
    } catch (err) {
        console.error('Falha ao criar Supabase client:', err);
        window.supabaseClient = null;
    }
})();
