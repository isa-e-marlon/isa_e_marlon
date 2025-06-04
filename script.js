const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODUyNjIxMSwiZXhwIjoyMDY0MTAyMjExfQ.pu6xATHMfR6SzFp6fuw4ECCwyvolX0fXVb8QEuhlMlk';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const lugaresContainer = document.getElementById('lugares-container');
  if (lugaresContainer) {
    carregarLugares(lugaresContainer);
  }

  const mensagensContainer = document.getElementById('mensagens-container');
  if (mensagensContainer) {
    carregarMensagens(mensagensContainer);
  }

  const mensagemForm = document.getElementById('adicionar-mensagem-form');
  if (mensagemForm) {
    mensagemForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const imagemInput = document.getElementById('imagem-url');
      const mensagem = document.getElementById('mensagem').value;

      if (imagemInput.files.length > 0) {
        const imagemFile = imagemInput.files[0];

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('imagens')
          .upload(`public/${imagemFile.name}`, imagemFile);

        if (uploadError) {
          console.error('Erro ao fazer upload da imagem:', uploadError);
          return;
        }

        const imagemUrl = `${SUPABASE_URL}/storage/v1/object/public/imagens/${uploadData.path}`;

        const { data, error } = await supabase
          .from('mensagens')
          .insert([{ imagem_url: imagemUrl, mensagem: mensagem }]);

        if (error) {
          console.error('Erro ao adicionar mensagem:', error);
        } else {
          alert('Mensagem adicionada com sucesso!');
          mensagemForm.reset();
          carregarMensagens(document.getElementById('mensagens-container'));
        }
      }
    });
  }

  const lugarForm = document.getElementById('adicionar-lugar-form');
  if (lugarForm) {
    lugarForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const nome_lugar = document.getElementById('nome-lugar').value;
      const data_visita = document.getElementById('data-visita').value;

      if (!nome_lugar || !data_visita) {
        alert('Por favor, preencha todos os campos.');
        return;
      }

      const { data, error } = await supabase
        .from('lugares')
        .insert([{ nome_lugar, data_visita }]);

      if (error) {
        console.error('Erro ao adicionar lugar:', error);
        alert('Erro ao adicionar lugar.');
      } else {
        alert('Lugar adicionado com sucesso!');
        lugarForm.reset();
        carregarLugares(document.getElementById('lugares-container'));
      }
    });
  }
});

async function carregarLugares(container) {
  const { data, error } = await supabase
    .from('lugares')
    .select('*')
    .order('data_visita', { ascending: true });

  if (error) {
    console.error('Erro ao carregar lugares:', error);
    container.innerHTML = '<p>Erro ao carregar lugares.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p>Nenhum lugar adicionado ainda.</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach((lugar) => {
    const div = document.createElement('div');
    div.className = 'lugar';
    div.innerHTML = `
      <p><strong>${lugar.nome_lugar}</strong></p>
      <p><small>${new Date(lugar.data_visita).toLocaleDateString()}</small></p>
    `;
    container.appendChild(div);
  });
}

async function carregarMensagens(container) {
  const { data, error } = await supabase
    .from('mensagens')
    .select('*')
    .order('data', { ascending: false });

  if (error) {
    console.error('Erro ao carregar mensagens:', error);
    container.innerHTML = '<p>Erro ao carregar mensagens.</p>';
    return;
  }

  if (data.length === 0) {
    container.innerHTML = '<p>Nenhuma mensagem adicionada ainda.</p>';
    return;
  }

  container.innerHTML = '';
  data.forEach((mensagem) => {
    const div = document.createElement('div');
    div.className = 'mensagem';
    div.innerHTML = `
      <img src="${mensagem.imagem_url}" alt="Imagem">
      <p>${mensagem.mensagem}</p>
      <p><small>${new Date(mensagem.data).toLocaleDateString()}</small></p>
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

      // Extrai o caminho do arquivo a partir da URL
      const path = imagemUrl.split('/object/public/imagens/')[1];

      // Exclui imagem do storage
      const { error: erroStorage } = await supabase
        .storage
        .from('imagens')
        .remove([`public/${path}`]);

      if (erroStorage) {
        console.error('Erro ao excluir imagem:', erroStorage);
      }

      // Exclui mensagem do banco
      const { error: erroDB } = await supabase
        .from('mensagens')
        .delete()
        .eq('id', id);

      if (erroDB) {
        console.error('Erro ao excluir mensagem:', erroDB);
      } else {
        alert('Mensagem excluída com sucesso!');
        carregarMensagens(container); // recarrega a lista
      }
    });
  });
}
