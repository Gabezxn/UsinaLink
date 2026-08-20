(function () {
  function notify(message, type) {
    if (window.showToast) window.showToast(message);
    else if (window.UsinaLinkUi?.showFeedback) window.UsinaLinkUi.showFeedback(message, type);
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  function bindSolicitacaoForm() {
    const form = document.querySelector('.js-solicitacao-form');
    if (!form) return;
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const peca = String(data.get('peca') || '').trim();
      const categoria = String(data.get('categoria') || '').trim();
      if (!peca) { notify('Informe o nome da peça.', 'error'); return; }
      if (!categoria) { notify('Selecione uma categoria.', 'error'); return; }

      const button = form.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Publicando...';

      try {
        const payload = {
          peca,
          categoria,
          material: data.get('material') || undefined,
          quantidade: data.get('quantidade') || undefined,
          prazoDesejado: data.get('prazoDesejado') || undefined,
          urgencia: data.get('urgencia') || undefined,
          localEntrega: data.get('localEntrega') || undefined,
          descricao: data.get('descricao') || undefined,
        };

        const arquivo = form.querySelector('input[name="arquivo"]')?.files?.[0];
        if (arquivo) {
          if (arquivo.size > 5 * 1024 * 1024) throw new Error('Arquivo maior que 5 MB. Escolha um arquivo menor.');
          payload.arquivoTecnico = await readFileAsDataUrl(arquivo);
          payload.arquivoTecnicoNome = arquivo.name;
        }

        await window.UsinaLinkApi.post('/solicitacoes', payload);
        notify('Solicitação publicada com sucesso.', 'success');
        window.setTimeout(() => { window.location.href = form.dataset.redirect || 'solicitacoes.html'; }, 600);
      } catch (error) {
        notify(error.message, 'error');
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  }

  function statusBadge(status) {
    const map = { aberta: 'info', em_analise: 'warning', concluida: 'success', cancelada: 'muted' };
    const cls = map[status] || 'info';
    const label = { aberta: 'Aberta', em_analise: 'Em análise', concluida: 'Concluída', cancelada: 'Cancelada' }[status] || status || 'Aberta';
    return `<span class="badge ${cls}">${label}</span>`;
  }

  async function loadSolicitacoes() {
    const body = document.querySelector('[data-solicitacoes-body]');
    if (!body) return;
    try {
      const rows = await window.UsinaLinkApi.get('/solicitacoes/meus');
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">Nenhuma solicitação encontrada. <a href="nova-solicitacao.html">Criar a primeira</a>.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(row => `
        <tr data-search-row>
          <td>${row.peca || ''}</td>
          <td>${row.categoria || ''}</td>
          <td>${row.quantidade ?? '-'}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${row.prazoDesejado ? new Date(row.prazoDesejado).toLocaleDateString('pt-BR') : '-'}</td>
          <td><button class="table-action js-alert" type="button">Ver</button></td>
        </tr>`).join('');
    } catch (error) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px;">Falha ao carregar solicitações: ${error.message}</td></tr>`;
    }
  }

  bindSolicitacaoForm();
  loadSolicitacoes();
}());
