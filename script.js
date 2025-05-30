
const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODUyNjIxMSwiZXhwIjoyMDY0MTAyMjExfQ.pu6xATHMfR6SzFp6fuw4ECCwyvolX0fXVb8QEuhlMlk'; // sua chave completa aqui

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('lugares-container');
  if (container) {
    carregarLugares(container);
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
        }
      }
    });
  }
});

async function carregarLugares(container) {
  const { data, error } = await supabase
    .from('lugares')
    .select('*')
    .order('data_visita', { ascending: false });

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
  data.forEach(lugar => {
    const div = document.createElement('div');
    div.className = 'lugar';
    div.innerHTML = `
      <p><strong>${lugar.nome_lugar}</strong></p>
      <p><small>${new Date(lugar.data_visita).toLocaleDateString()}</small></p>
    `;
    container.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('mensagens-container');
  if (container) {
    carregarMensagens(container);
  }
});

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
  data.forEach(mensagem => {
    const div = document.createElement('div');
    div.className = 'mensagem';
    div.innerHTML = `
      <img src="${mensagem.imagem_url}" alt="Imagem">
      <p>${mensagem.mensagem}</p>
      <p><small>${new Date(mensagem.data).toLocaleDateString()}</small></p>
    `;
    container.appendChild(div);
  });
}
