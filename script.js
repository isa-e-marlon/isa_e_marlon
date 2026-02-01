console.log('SCRIPT ATUALIZADO CARREGADO');

const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjYyMTEsImV4cCI6MjA2NDEwMjIxMX0.uLeYHOAClgS9UIFqx9R4wMmxCbyH98EEVFxwVI2uk98';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. CHECAR SESSÃO
    // O Supabase mantém o login salvo no navegador. Se você vê botões de apagar,
    // é porque esta variável está voltando como verdadeira.
    const session = supabaseClient.auth.session();
    usuarioLogado = session ? session.user : null;
    
    console.log("Status do Usuário:", usuarioLogado ? "Logado" : "Não Logado");

    // 2. ATUALIZAR O MENU (Adiciona Login ou Sair)
    atualizarMenu();

    // Proteção da página Adicionar
    if (window.location.pathname.includes('adicionar.html') && !usuarioLogado) {
        window.location.href = 'login.html';
    }

    // 3. CARREGAR CONTEÚDO
    const filmesContainer = document.getElementById('lista-desejos-container');
    if (filmesContainer) carregarFilmes();

    const lugaresContainer = document.getElementById('lugares-container');
    if (lugaresContainer) carregarLugares(lugaresContainer);

    const mensagensContainer = document.getElementById('mensagens-container');
    if (mensagensContainer) carregarMensagens(mensagensContainer);

    // 4. LÓGICA DO LOGIN
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
                    msg.innerText = "Erro: " + error.message;
                    msg.style.color = "red";
                }
            } else {
                window.location.href = 'index.html';
            }
        });
    }

    // 5. ATIVAR FORMULÁRIOS
    configurarFormularios();
});

// --- FUNÇÃO DO MENU (CORRIGIDA) ---
function atualizarMenu() {
    const menu = document.getElementById('menu-principal');
    if (!menu) return;

    // Remove botões antigos para não duplicar se rodar de novo
    const linksAntigos = menu.querySelectorAll('.link-dinamico');
    linksAntigos.forEach(link => link.remove());

    if (usuarioLogado) {
        // --- SE ESTIVER LOGADO: Mostra "Adicionar" e "Sair" ---
        
        const liAdd = document.createElement('li');
        liAdd.className = 'link-dinamico';
        liAdd.innerHTML = `<a href="adicionar.html">Adicionar</a>`;
        menu.appendChild(liAdd);

        const liSair = document.createElement('li');
        liSair.className = 'link-dinamico';
        // Botão Sair com cor diferente
        liSair.innerHTML = `<a href="#" onclick="sair()" style="background-color: #ff4d4d; border:none;">Sair</a>`;
        menu.appendChild(liSair);

    } else {
        // --- SE NÃO ESTIVER LOGADO: Mostra "Login" ---
        
        const liLogin = document.createElement('li');
        liLogin.className = 'link-dinamico';
        liLogin.innerHTML = `<a href="login.html">Login 🔒</a>`;
        menu.appendChild(liLogin);
    }
}

// --- FUNÇÃO SAIR ---
window.sair = async () => {
    await supabaseClient.auth.signOut();
    alert("Você saiu da conta.");
    window.location.href = 'index.html'; // Recarrega a página para atualizar o menu
}

// --- CARREGAR FILMES ---
async function carregarFilmes() {
    const listaDesejos = document.getElementById('lista-desejos-container');
    const listaAssistidos = document.getElementById('lista-assistidos-container');
    if (!listaDesejos || !listaAssistidos) return;

    listaDesejos.innerHTML = '<p class="texto-centro">Carregando...</p>';
    
    const { data, error } = await supabaseClient
        .from('filmes').select('*').order('created_at', { ascending: false });

    if (error) return;

    listaDesejos.innerHTML = '';
    listaAssistidos.innerHTML = '';

    if (data.length === 0) {
        listaDesejos.innerHTML = '<p class="texto-centro">Nenhum filme ainda.</p>';
        return;
    }

    data.forEach((filme) => {
        const div = document.createElement('div');
        div.className = 'card-filme';

        // O botão de excluir só é criado se usuarioLogado for true
        const btnExcluir = usuarioLogado 
            ? `<button class="btn-excluir-mini" onclick="excluirItem('filmes', ${filme.id})">🗑️</button>` 
            : '';

        if (filme.assistido) {
            let estrelas = '';
            for(let i=1; i<=5; i++) estrelas += i <= filme.nota ? '⭐' : '☆';
            
            div.innerHTML = `
                ${btnExcluir}
                <div class="nome-filme">${filme.nome_filme}</div>
                <div style="color: #ffd700; font-size: 1.2rem;">${estrelas}</div>
            `;
            listaAssistidos.appendChild(div);
        } else {
            // Se logado, mostra opção de avaliar. Se não, só mostra o nome.
            let interacao = usuarioLogado 
                ? `<button class="btn-ja-vi" id="btn-ver-${filme.id}">Já assistimos!</button>
                   <div id="avaliar-${filme.id}" class="avaliar-area" style="display:none;">
                     ${[1,2,3,4,5].map(n => `<button class="estrelas-btn" onclick="avaliarFilme(${filme.id}, ${n})">⭐</button>`).join('')}
                   </div>`
                : '';

            div.innerHTML = `
                ${btnExcluir}
                <div class="nome-filme">🎬 ${filme.nome_filme}</div>
                ${interacao}
            `;
            listaDesejos.appendChild(div);

            if (usuarioLogado) {
                setTimeout(() => {
                    const btn = document.getElementById(`btn-ver-${filme.id}`);
                    if(btn) btn.onclick = () => {
                        btn.style.display = 'none';
                        document.getElementById(`avaliar-${filme.id}`).style.display = 'block';
                    }
                }, 0);
            }
        }
    });
}

// --- OUTRAS FUNÇÕES (Lugares e Mensagens) ---
async function carregarLugares(container) {
    container.innerHTML = '<p class="texto-centro">Carregando...</p>';
    const { data } = await supabaseClient.from('lugares').select('*').order('data_visita');
    if(!data) return;
    container.innerHTML = '';
    data.forEach(l => {
        const btnExcluir = usuarioLogado ? `<button class="excluir-btn2" onclick="excluirItem('lugares', ${l.id})">🗑️</button>` : '';
        const div = document.createElement('div');
        div.className = 'lugar';
        div.innerHTML = `<p><strong>📍 ${l.nome_lugar}</strong></p><p><small>${new Date(l.data_visita).toLocaleDateString('pt-BR')}</small></p>${btnExcluir}`;
        container.appendChild(div);
    });
}

async function carregarMensagens(container) {
    container.innerHTML = '<p class="texto-centro">Carregando...</p>';
    const { data } = await supabaseClient.from('mensagens').select('*').order('created_at', {ascending:false});
    if(!data) return;
    container.innerHTML = '';
    data.forEach(m => {
        const btnExcluir = usuarioLogado ? `<button class="excluir-btn" onclick="excluirMensagem(${m.id}, '${m.imagem_url}')">🗑️ Excluir</button>` : '';
        const div = document.createElement('div');
        div.className = 'mensagem';
        div.innerHTML = `<img src="${m.imagem_url}"><p>${m.mensagem}</p><p><small>${new Date(m.created_at).toLocaleDateString('pt-BR')}</small></p>${btnExcluir}`;
        container.appendChild(div);
    });
}

// --- AÇÕES GERAIS ---
window.mudarAba = (aba) => {
    document.getElementById('aba-quero-ver').style.display = 'none';
    document.getElementById('aba-ja-vistos').style.display = 'none';
    document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
    document.getElementById(`aba-${aba}`).style.display = 'block';
    const idx = aba === 'quero-ver' ? 0 : 1;
    document.querySelectorAll('.aba-btn')[idx].classList.add('ativa');
}

window.avaliarFilme = async (id, nota) => {
    await supabaseClient.from('filmes').update({ assistido: true, nota: nota }).eq('id', id);
    carregarFilmes();
}

window.excluirItem = async (tabela, id) => {
    if(!confirm('Tem certeza?')) return;
    await supabaseClient.from(tabela).delete().eq('id', id);
    if(tabela === 'filmes') carregarFilmes();
    if(tabela === 'lugares') carregarLugares(document.getElementById('lugares-container'));
}

window.excluirMensagem = async (id, url) => {
    if(!confirm('Excluir mensagem?')) return;
    if(url.includes('/imagens/')) await supabaseClient.storage.from('imagens').remove([url.split('/imagens/')[1]]);
    await supabaseClient.from('mensagens').delete().eq('id', id);
    carregarMensagens(document.getElementById('mensagens-container'));
}

function configurarFormularios() {
    // Lógica simplificada de submit (copie a lógica completa de upload se precisar)
    const setupForm = (id, tabela, campos) => {
        const form = document.getElementById(id);
        if(form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                if(!usuarioLogado) return alert('Faça login!');
                
                // Lógica de envio específica para cada tipo (Resumida para funcionar com o script anterior)
                // Se for filme:
                if(tabela === 'filmes') {
                    const nome = document.getElementById('nome-filme').value;
                    await supabaseClient.from('filmes').insert([{ nome_filme: nome }]);
                    alert('Salvo!'); form.reset();
                }
                // Se for lugar:
                if(tabela === 'lugares') {
                     const nome = document.getElementById('nome-lugar').value;
                     const data = document.getElementById('data-visita').value;
                     await supabaseClient.from('lugares').insert([{ nome_lugar: nome, data_visita: data }]);
                     alert('Salvo!'); form.reset();
                }
                // Se for mensagem (Lógica completa no script anterior, mantendo simples aqui)
                 if(tabela === 'mensagens') {
                     alert('Por favor, use o código de upload de imagem completo do passo anterior para mensagens!');
                 }
            });
        }
    };
    setupForm('adicionar-filme-form', 'filmes');
    setupForm('adicionar-lugar-form', 'lugares');
    // Para mensagens, recomendo manter a lógica de upload detalhada que você já tinha.
}