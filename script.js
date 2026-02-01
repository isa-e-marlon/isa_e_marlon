const SUPABASE_URL = 'https://lejsawwjzbgjussohadn.supabase.co';
// Chave ANON (Pública) - Segura para usar no site
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlanNhd3dqemJnanVzc29oYWRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1MjYyMTEsImV4cCI6MjA2NDEwMjIxMX0.Mh-v7c-g-wP8h7a7z7y8k-c9l0b3u4o1n2r3s4t5v6';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  const containerLugares = document.getElementById('lugares-container');
  if (containerLugares) carregarLugares(containerLugares);

  const containerMensagens = document.getElementById('mensagens-container');
  if (containerMensagens) carregarMensagens(containerMensagens);

  const mensagemForm = document.getElementById('adicionar-mensagem-form');
  if (mensagemForm) {
    mensagemForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = mensagemForm.querySelector('button[type="submit"]');
      submitBtn.innerText = 'Enviando...'; submitBtn.disabled = true;

      try {
          const imagemInput = document.getElementById('imagem-url');
          const mensagem = document.getElementById('mensagem').value;
          if (imagemInput.files.length > 0) {
            const imagemFile = imagemInput.files[0];
            const fileName = `public/${Date.now()}_${imagemFile.name.replace(/\s/g, '-')}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('imagens').upload(fileName, imagemFile);
            if (uploadError) throw uploadError;

            const imagemUrl = `${SUPABASE_URL}/storage/v1/object/public/imagens/${uploadData.path}`;
            const { error } = await supabase.from('mensagens').insert([{ imagem_url: imagemUrl, mensagem: mensagem }]);
            if (error) throw error;
            alert('Mensagem adicionada com sucesso!'); mensagemForm.reset();
          }
      } catch (error) {
          console.error('Erro:', error); alert('Erro ao adicionar mensagem.');
      } finally {
          submitBtn.innerText = 'Adicionar Mensagem'; submitBtn.disabled = false;
      }
    });
  }

  const lugarForm = document.getElementById('adicionar-lugar-form');
  if (lugarForm) {
    lugarForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submitBtn = lugarForm.querySelector('button[type="submit"]');
      submitBtn.innerText = 'Salvando...'; submitBtn.disabled = true;
      const nomeLugar = document.getElementById('nome-lugar').value;
      const dataVisita = document.getElementById('data-visita').value;
      const { error } = await supabase.from('lugares').insert([{ nome_lugar: nomeLugar, data_visita: dataVisita }]);
      
      if (error) { console.error('Erro:', error); alert('Erro ao salvar o lugar.'); }
      else { alert('Lugar adicionado com sucesso!'); lugarForm.reset(); }
      
      submitBtn.innerText = 'Adicionar Lugar'; submitBtn.disabled = false;
    });
  }
});

async function carregarLugares(container) {
  container.innerHTML = '<p class="texto-centro">Carregando lugares...</p>';
  const { data, error } = await supabase.from('lugares').select('*').order('data_visita', { ascending: false });
  if (error || !data) { container.innerHTML = '<p class="texto-centro">Erro ao carregar lugares.</p>'; return; }
  if (data.length === 0) { container.innerHTML = '<p class="texto-centro">Nenhum lugar adicionado ainda.</p>'; return; }

  container.innerHTML = '';
  data.forEach(lugar => {
    const div = document.createElement('div'); div.className = 'lugar';
    const dataFormatada = new Date(lugar.data_visita + 'T12:00:00').toLocaleDateString('pt-BR');
    div.innerHTML = `<p><strong>${lugar.nome_lugar}</strong></p><p><small>Visitado em: ${dataFormatada}</small></p>`;
    container.appendChild(div);
  });
}

async function carregarMensagens(container) {
   container.innerHTML = '<p class="texto-centro">Carregando mensagens...</p>';
   // Tenta ordenar por created_at (padrão)
  const { data, error } = await supabase.from('mensagens').select('*').order('created_at', { ascending: false }); 
  if (error) { container.innerHTML = '<p class="texto-centro">Erro ao carregar mensagens.</p>'; return; }
  if (data.length === 0) { container.innerHTML = '<p class="texto-centro">Nenhuma mensagem adicionada ainda.</p>'; return; }

  container.innerHTML = '';
  data.forEach(mensagem => {
    const div = document.createElement('div'); div.className = 'mensagem';
    const dataCol = mensagem.created_at || mensagem.data || new Date().toISOString();
    const dataFormatada = new Date(dataCol).toLocaleDateString('pt-BR');
    div.innerHTML = `<img src="${mensagem.imagem_url}" alt="Imagem" loading="lazy"><p>${mensagem.mensagem}</p><p><small>${dataFormatada}</small></p>`;
    container.appendChild(div);
  });
}
