console.log('SCRIPT CARREGADO');

const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjYyMTEsImV4cCI6MjA2NDEwMjIxMX0.uLeYHOAClgS9UIFqx9R4wMmxCbyH98EEVFxwVI2uk98';

// MUDANÇA AQUI: Trocamos o nome da variável de 'supabase' para 'supabaseClient'
// para não brigar com a biblioteca original.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const lugaresContainer = document.getElementById('lugares-container');
  if (lugaresContainer) {
    carregarLugares(lugaresContainer);
  }

  const mensagensContainer = document.getElementById('mensagens-container');
  if (mensagensContainer) {
    carregarMensagens(mensagensContainer);
  }

  // --- ADICIONAR MENSAGEM ---
  const mensagemForm = document.getElementById('adicionar-mensagem-form');
  if (mensagemForm) {
    mensagemForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const btn = mensagemForm.querySelector('button');
      const textoOriginal = btn.innerText;
      btn.innerText = 'Enviando...'; btn.disabled = true;

      try {
        const imagemInput = document.getElementById('imagem-url');
        const mensagem = document.getElementById('mensagem').value;

        if (imagemInput.files.length > 0) {
            const imagemFile = imagemInput.files[0];
            const nomeUnico = `${Date.now()}-${imagemFile.name.replace(/\s/g, '-')}`;

            // Usa supabaseClient aqui
            const { data: uploadData, error: uploadError } = await supabaseClient.storage
            .from('imagens')
            .upload(`public/${nomeUnico}`, imagemFile);

            if (uploadError) throw uploadError;

            const imagemUrl = `${SUPABASE_URL}/storage/v1/object/public/imagens/public/${nomeUnico}`;

            // Usa supabaseClient aqui
            const { data, error } = await supabaseClient
            .from('mensagens')
            .insert([{ imagem_url: imagemUrl, mensagem: mensagem }]);

            if (error) throw error;

            alert('Mensagem adicionada com sucesso!');
            mensagemForm.reset();
            if(mensagensContainer) carregarMensagens(mensagensContainer);
        }
      } catch (error) {
          console.error('Erro:', error);
          alert('Erro ao adicionar mensagem.');
      } finally {
          btn.innerText = textoOriginal; btn.disabled = false;
      }
    });
  }

  // --- ADICIONAR LUGAR ---
  const lugarForm = document.getElementById('adicionar-lugar-form');
  if (lugarForm) {
    lugarForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const btn = lugarForm.querySelector('button');
      const textoOriginal = btn.innerText;
      btn.innerText = 'Salvando...'; btn.disabled = true;

      const nome_lugar = document.getElementById('nome-lugar').value;
      const data_visita = document.getElementById('data-visita').value;

      if (!nome_lugar || !data_visita) {
        alert('Por favor, preencha todos os campos.');
        btn.innerText = textoOriginal; btn.disabled = false;
        return;
      }

      // Usa supabaseClient aqui
      const { data, error } = await supabaseClient
        .from('lugares')
        .insert([{ nome_lugar, data_visita }]);

      if (error) {
        console.error('Erro ao adicionar lugar:', error);
        alert('Erro ao adicionar lugar.');
      } else {
        alert('Lugar adicionado com sucesso!');
        lugarForm.reset();
        if(lugaresContainer) carregarLugares(lugaresContainer);
      }
      
      btn.innerText = textoOriginal; btn.disabled = false;
    });
  }
});

// --- FUNÇÃO CARREGAR LUGARES ---
async function carregarLugares(container) {
  container.innerHTML = '<p class="texto-centro">Carregando lugares...</p>';

  // Usa supabaseClient aqui
  const { data, error } = await supabaseClient
    .from('lugares')
    .select('*')
    .order('data_visita', { ascending: true });

  if (error) {
    container.innerHTML = '<p class="texto-centro">Erro ao carregar lugares.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p class="texto-centro">Nenhum lugar adicionado ainda.</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach((lugar) => {
    const div = document.createElement('div');
    div.className = 'lugar';
    const dataFormatada = new Date(lugar.data_visita + 'T12:00:00').toLocaleDateString('pt-BR');
    
    div.innerHTML = `
      <p><strong>${lugar.nome_lugar}</strong></p>
      <p><small>${dataFormatada}</small></p>
      <button class="excluir-btn2" data-id="${lugar.id}">🗑️ Excluir</button>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll('.excluir-btn2').forEach(botao => {
    botao.addEventListener('click', async (event) => {
      const id = event.target.getAttribute('data-id');
      const confirmacao = confirm('Tem certeza que deseja excluir este lugar?');
      if (!confirmacao) return;

      // Usa supabaseClient aqui
      const { error } = await supabaseClient.from('lugares').delete().eq('id', id);
      if (error) {
        console.error('Erro ao excluir lugar:', error);
        alert('Erro ao excluir.');
      } else {
        alert('Lugar excluído com sucesso!');
        carregarLugares(container);
      }
    });
  });
}

// --- FUNÇÃO CARREGAR MENSAGENS ---
async function carregarMensagens(container) {
  container.innerHTML = '<p class="texto-centro">Carregando mensagens...</p>';

  // Usa supabaseClient aqui
  const { data, error } = await supabaseClient
    .from('mensagens')
    .select('*')
    .order('data', { ascending: false });

  if (error) {
    container.innerHTML = '<p class="texto-centro">Erro ao carregar mensagens.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p class="texto-centro">Nenhuma mensagem adicionada ainda.</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach((mensagem) => {
    const div = document.createElement('div');
    div.className = 'mensagem';
    const dataDisplay = mensagem.data ? new Date(mensagem.data).toLocaleDateString('pt-BR') : '';

    div.innerHTML = `
      <img src="${mensagem.imagem_url}" alt="Imagem">
      <p>${mensagem.mensagem}</p>
      <p><small>${dataDisplay}</small></p>
      <button class="excluir-btn" data-id="${mensagem.id}" data-img="${mensagem.imagem_url}">🗑️ Excluir</button>
    `;
    container.appendChild(div);
  });

  document.querySelectorAll('.excluir-btn').forEach((botao) => {
    botao.addEventListener('click', async (event) => {
      const id = event.target.getAttribute('data-id');
      const imagemUrl = event.target.getAttribute('data-img');
      const confirmacao = confirm('Tem certeza que deseja excluir esta mensagem?');

      if (!confirmacao) return;

      if (imagemUrl && imagemUrl.includes('/object/public/imagens/')) {
          const path = imagemUrl.split('/object/public/imagens/')[1];
          // Usa supabaseClient aqui
          const { error: erroStorage } = await supabaseClient
            .storage
            .from('imagens')
            .remove([path]);
          
          if (erroStorage) console.error('Aviso storage:', erroStorage);
      }

      // Usa supabaseClient aqui
      const { error: erroDB } = await supabaseClient
        .from('mensagens')
        .delete()
        .eq('id', id);

      if (erroDB) {
        console.error('Erro ao excluir mensagem:', erroDB);
        alert('Erro ao excluir mensagem do banco de dados.');
      } else {
        alert('Mensagem excluída com sucesso!');
        carregarMensagens(container);
      }
    });
  });
}
