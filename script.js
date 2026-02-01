console.log('SCRIPT CARREGADO - VERSÃO COMPLETA COM LOGIN E FILMES');

const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
// Chave Pública (Anon Key) - Segura para o Front-end
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjYyMTEsImV4cCI6MjA2NDEwMjIxMX0.uLeYHOAClgS9UIFqx9R4wMmxCbyH98EEVFxwVI2uk98';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variável global para saber se o usuário é o dono do site
let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. VERIFICAÇÃO DE LOGIN
    const session = supabaseClient.auth.session();
    usuarioLogado = session ? session.user : null;
    
    atualizarMenu(); // Atualiza o menu (mostra/esconde "Adicionar" e "Sair")

    // PROTEÇÃO: Se tentar entrar em 'adicionar.html' sem estar logado, manda pro login
    if (window.location.pathname.includes('adicionar.html') && !usuarioLogado) {
        window.location.href = 'login.html';
    }

    // 2. CARREGAMENTO DAS PÁGINAS
    // Verifica qual container existe na página atual e carrega o conteúdo
    const filmesContainer = document.getElementById('lista-desejos-container');
    if (filmesContainer) carregarFilmes();

    const lugaresContainer = document.getElementById('lugares-container');
    if (lugaresContainer) carregarLugares(lugaresContainer);

    const mensagensContainer = document.getElementById('mensagens-container');
    if (mensagensContainer) carregarMensagens(mensagensContainer);

    // 3. LÓGICA DO FORMULÁRIO DE LOGIN
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('login-msg');
            
            if(msg) msg.innerText = "Entrando...";

            const { user, error } = await supabaseClient.auth.signIn({ email, password });
            if (error) {
                if(msg) {
                    msg.innerText = "Erro: Email ou senha incorretos.";
                    msg.style.color = "red";
                }
                console.error(error);
            } else {
                window.location.href = 'index.html'; // Sucesso! Vai para a home
            }
        });
    }

    // 4. ATIVAR FORMULÁRIOS DE ADICIONAR (Se estiver na página correta)
    configurarFormularios();
});

// ======================================================
//              FUNÇÕES DE EXIBIÇÃO (LOADERS)
// ======================================================

// --- CARREGAR FILMES (COM ABAS E ESTRELAS) ---
async function carregarFilmes() {
    const listaDesejos = document.getElementById('lista-desejos-container');
    const listaAssistidos = document.getElementById('lista-assistidos-container');

    // Se não tiver os containers (ex: está na página index), sai da função
    if (!listaDesejos || !listaAssistidos) return;

    listaDesejos.innerHTML = '<p class="texto-centro">Carregando filmes...</p>';
    
    const { data, error } = await supabaseClient
        .from('filmes')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        listaDesejos.innerHTML = '<p class="texto-centro">Erro ao carregar.</p>';
        return;
    }

    // Limpa os containers para encher de novo
    listaDesejos.innerHTML = '';
    listaAssistidos.innerHTML = '';

    if (data.length === 0) {
        listaDesejos.innerHTML = '<p class="texto-centro">Nenhum filme na lista. Adicione um!</p>';
        return;
    }

    data.forEach((filme) => {
        const div = document.createElement('div');
        div.className = 'card-filme'; // Classe definida no CSS novo

        // Botão de Excluir (Só aparece se estiver LOGADO)
        const btnExcluir = usuarioLogado 
            ? `<button class="btn-excluir-mini" onclick="excluirItem('filmes', ${filme.id})">🗑️</button>` 
            : '';

        if (filme.assistido) {
            // --- JÁ VISTOS (ABA 2) ---
            // Gera as estrelas douradas baseadas na nota
            let estrelas = '';
            for(let i=1; i<=5; i++) {
                estrelas += i <= filme.nota ? '⭐' : '☆';
            }
            
            div.innerHTML = `
                ${btnExcluir}
                <div class="nome-filme">${filme.nome_filme}</div>
                <div style="color: #ffd700; font-size: 1.2rem; margin-top:5px;">${estrelas}</div>
                <small style="color:#999">Assistido</small>
            `;