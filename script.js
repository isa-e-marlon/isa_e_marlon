console.log('SCRIPT CORRIGIDO FINAL - SEM ERROS DE SINTAXE');

const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjYyMTEsImV4cCI6MjA2NDEwMjIxMX0.uLeYHOAClgS9UIFqx9R4wMmxCbyH98EEVFxwVI2uk98';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. CHECAR LOGIN
    const session = supabaseClient.auth.session();
    usuarioLogado = session ? session.user : null;
    
    atualizarMenu();

    // Redireciona se tentar entrar em adicionar.html sem logar
    if (window.location.pathname.includes('adicionar.html') && !usuarioLogado) {
        window.location.href = 'login.html';
    }

    // 2. CARREGAR CONTEÚDO (Verifica qual página está aberta)
    const filmesContainer = document.getElementById('lista-desejos-container');
    if (filmesContainer) carregarFilmes();

    const lugaresContainer = document.getElementById('lugares-container');
    if (lugaresContainer) carregarLugares(lugaresContainer);

    const mensagensContainer = document.getElementById('mensagens-container');
    if (mensagensContainer) carregarMensagens(mensagensContainer);

    // 3. LOGIN FORM (Página de Login)
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const msg = document.getElementById('login-msg');
            
            if(msg) msg.innerText = "Entrando...";

            const { error } = await supabaseClient.auth.signIn({ email, password });
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

    // 4. ATIVAR OS FORMULÁRIOS DE ADIÇÃO
    configurarFormularios();
});

// ======================================================
//              MENU E LOGOUT
// ======================================================
function atualizarMenu() {
    const menu = document.getElementById('menu-principal');
    if (!menu) return;

    // Limpa links dinâmicos antigos para não duplicar
    menu.querySelectorAll('.link-dinamico').forEach(l => l.remove());

    if (usuarioLogado) {
        // Se logado: mostra ADICIONAR e SAIR
        const liAdd = document.createElement('li');
        liAdd.className = 'link-dinamico';
        liAdd.innerHTML = `<a href="adicionar.html">Adicionar</a>`;
        menu.appendChild(liAdd);

        const liSair = document.createElement('li');
        liSair.className = 'link-dinamico';
        liSair.innerHTML = `<a href="#" onclick="sair()" style="background:#ff4d4d; border:none;">Sair</a>`;
        menu.appendChild(liSair);
    } else {
        // Se não logado: mostra LOGIN
        const liLogin = document.createElement('li');
        liLogin.className = 'link-dinamico';
        liLogin.innerHTML = `<a href="login.html">Login 🔒</a>`;
        menu.appendChild(liLogin);
    }
}

window.sair = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
};

// ======================================================
//              CARREGAMENTO DE DADOS
// ======================================================

// --- CARREGAR FILMES ---
async function carregarFilmes() {
    const listaDesejos = document.getElementById('lista-desejos-container');
    const listaAssistidos = document.getElementById('lista-assistidos-container');
    if (!listaDesejos || !listaAssistidos) return;

    listaDesejos.innerHTML = '<p class="texto-centro">Carregando...</p>';
    
    // Tabela Filmes usa 'created_at'
    const { data, error } = await supabaseClient
        .from('filmes').select('*').order('created_at', { ascending: false });

    if (error) {
        console.error("Erro Filmes:", error);
        listaDesejos.innerHTML = '<p class="texto-centro">Erro ao carregar filmes.</p>';
        return;
    }

    listaDesejos.innerHTML = '';
    listaAssistidos.innerHTML = '';

    if (data.length === 0) {
        listaDesejos.innerHTML = '<p class="texto-centro">Nenhum filme ainda.</p>';
        return;
    }

    data.forEach((filme) => {
        const div = document.createElement('div');
        div.className = 'card-filme';

        const btnExcluir = usuarioLogado 
            ? `<button class="btn-excluir-mini" onclick="excluirItem('filmes', '${filme.id}')">🗑️</button>` 
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
                    if(btn) {
                        btn.onclick = () => {
                            btn.style.display = 'none';
                            document.getElementById(`avaliar-${filme.id}`).style.display = 'block';
                        };
                    }
                }, 0);
            }
        }
    });
}

// --- CARREGAR LUGARES ---
async function carregarLugares(container) {
    container.innerHTML = '<p class="texto-centro">Carregando...</p>';
    // Tabela Lugares usa 'data_visita'
    const { data } = await supabaseClient.from('lugares').select('*').order('data_visita');
    if(!data) return;
    
    container.innerHTML = '';
    data.forEach(l => {
        const btnExcluir = usuarioLogado ? `<button class="excluir-btn2" onclick="excluirItem('lugares', '${l.id}')">🗑️</button>` : '';
        const div = document.createElement('div');
        div.className = 'lugar';
        
        div.innerHTML = `
            <p><strong>📍 ${l.nome_lugar}</strong></p>
            <p><small>${new Date(l.data_visita + 'T12:00:00').toLocaleDateString('pt-BR')}</small></p>
            ${btnExcluir}
        `;
        container.appendChild(div);
    });
}

// --- CARREGAR MENSAGENS ---
async function carregarMensagens(container) {
    container.innerHTML = '<p class="texto-centro">Carregando...</p>';
    
    // Tabela Mensagens usa 'data'
    const { data, error } = await supabaseClient
        .from('mensagens')
        .select('*')
        .order('data', {ascending:false});

    if(error) {
        console.error("Erro Mensagens:", error);
        container.innerHTML = '<p class="texto-centro">Erro ao carregar mensagens.</p>';
        return;
    }
    
    if(!data) return;
    container.innerHTML = '';
    data.forEach(m => {
        const btnExcluir = usuarioLogado ? `<button class="excluir-btn" onclick="excluirMensagem('${m.id}', '${m.imagem_url}')">🗑️ Excluir</button>` : '';
        const div = document.createElement('div');
        div.className = 'mensagem';
        
        const dataFormatada = m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '';

        div.innerHTML = `
            <img src="${m.imagem_url}">
            <p>${m.mensagem}</p>
            <p><small>${dataFormatada}</small></p>
            ${btnExcluir}
        `;
        container.appendChild(div);
    });
}

// ======================================================
//              AÇÕES DE USUÁRIO
// ======================================================
window.mudarAba = (aba) => {
    const abaQuero = document.getElementById('aba-quero-ver');
    const abaVistos = document.getElementById('aba-ja-vistos');
    if(abaQuero) abaQuero.style.display = 'none';
    if(abaVistos) abaVistos.style.display = 'none';

    document.querySelectorAll('.aba-btn').forEach(b => b.classList.remove('ativa'));
    
    const abaSelecionada = document.getElementById(`aba-${aba}`);
    if(abaSelecionada) abaSelecionada.style.display = 'block';

    const idx = aba === 'quero-ver' ? 0 : 1;
    const btn = document.querySelectorAll('.aba-btn')[idx];
    if(btn) btn.classList.add('ativa');
};

window.avaliarFilme = async (id, nota) => {
    await supabaseClient.from('filmes').update({ assistido: true, nota: nota }).eq('id', id);
    carregarFilmes();
};

window.excluirItem = async (tabela, id) => {
    if(!confirm('Tem certeza?')) return;
    await supabaseClient.from(tabela).delete().eq('id', id);
    if(tabela === 'filmes') carregarFilmes();
    if(tabela === 'lugares') carregarLugares(document.getElementById('lugares-container'));
};

window.excluirMensagem = async (id, url) => {
    if(!confirm('Excluir mensagem?')) return;
    if(url.includes('/imagens/')) await supabaseClient.storage.from('imagens').remove([url.split('/imagens/')[1]]);
    await supabaseClient.from('mensagens').delete().eq('id', id);
    carregarMensagens(document.getElementById('mensagens-container'));
};

// ======================================================
//              CONFIGURAÇÃO DE FORMULÁRIOS
// ======================================================
function configurarFormularios() {
    
    // --- 1. FILMES ---
    const filmeForm = document.getElementById('adicionar-filme-form');
    if(filmeForm) {
        filmeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!usuarioLogado) return alert('Faça login!');
            
            const nome = document.getElementById('nome-filme').value;
            await supabaseClient.from('filmes').insert([{ nome_filme: nome }]);
            alert('Filme salvo!'); 
            filmeForm.reset(); 
            // Se estiver na tela de filmes, recarrega
            carregarFilmes(); 
        });
    }

    // --- 2. LUGARES ---
    const lugarForm = document.getElementById('adicionar-lugar-form');
    if(lugarForm) {
        lugarForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!usuarioLogado) return alert('Faça login!');

            const nome = document.getElementById('nome-lugar').value;
            const data = document.getElementById('data-visita').value;
            await supabaseClient.from('lugares').insert([{ nome_lugar: nome, data_visita: data }]);
            alert('Lugar salvo!'); 
            lugarForm.reset();
        });
    }

    // --- 3. MENSAGENS (COM FOTO) ---
    const msgForm = document.getElementById('adicionar-mensagem-form');
    if(msgForm) {
        msgForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if(!usuarioLogado) return alert('Faça login!');
            
            const btn = msgForm.querySelector('button');
            const txt = btn.innerText;
            btn.innerText = 'Enviando...'; btn.disabled = true;

            try {
                const imgInput = document.getElementById('imagem-url');
                const texto = document.getElementById('mensagem').value;
                
                if(imgInput.files.length > 0) {
                    const arquivo = imgInput.files[0];
                    const nomeArquivo = `public/${Date.now()}-${arquivo.name.replace(/\s/g, '-')}`;
                    
                    // Upload Imagem
                    const { error: upError } = await supabaseClient.storage.from('imagens').upload(nomeArquivo, arquivo);
                    if(upError) throw upError;
                    
                    const urlFinal = `${SUPABASE_URL}/storage/v1/object/public/imagens/${nomeArquivo}`;
                    
                    // Salvar no Banco (Usando a data atual)
                    const hoje = new Date().toISOString(); 
                    const { error: insError } = await supabaseClient
                        .from('mensagens')
                        .insert([{ 
                            imagem_url: urlFinal, 
                            mensagem: texto,
                            data: hoje 
                        }]);
                        
                    if(insError) throw insError;
                    
                    alert('Enviado!'); 
                    msgForm.reset();
                }
            } catch(err) { 
                console.error("ERRO DETALHADO:", err); 
                alert('Erro no envio: ' + (err.message || err.error_description || 'Olhe o console (F12)'));
            } finally { 
                btn.innerText = txt; 
                btn.disabled = false; 
            }
        });
    }
}
