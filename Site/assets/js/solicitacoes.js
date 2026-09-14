(function () {
  let ultimasSolicitacoes = [];

  function notify(message, type) {
    if (window.showToast) window.showToast(message);
    else if (window.UsinaLinkUi?.showFeedback) window.UsinaLinkUi.showFeedback(message, type);
  }

  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  const TIPOS_ARQUIVO_ACEITOS = ['.pdf', '.dwg', '.png', '.jpg', '.jpeg'];

  function validarArquivo(file) {
    if (!file) return null;
    const nome = file.name.toLowerCase();
    const extensaoValida = TIPOS_ARQUIVO_ACEITOS.some((ext) => nome.endsWith(ext));
    if (!extensaoValida) return `Formato não aceito. Envie um arquivo ${TIPOS_ARQUIVO_ACEITOS.join(', ')}.`;
    if (file.size > 5 * 1024 * 1024) return 'Arquivo maior que 5 MB. Escolha um arquivo menor.';
    return null;
  }

  function validarCampoTexto(form, name, mensagem) {
    const campo = form.querySelector(`[name="${name}"]`);
    if (!campo.value.trim()) {
      setFieldState(campo, mensagem);
      return false;
    }
    setFieldState(campo, '');
    return true;
  }

  function validarFormulario(form) {
    let valido = true;
    let erroArquivoMsg = '';
    const quantidade = form.querySelector('[name="quantidade"]');
    const arquivo = form.querySelector('[name="arquivo"]');

    if (!validarCampoTexto(form, 'peca', 'Informe o nome da peça.')) valido = false;
    if (!validarCampoTexto(form, 'categoria', 'Selecione uma categoria.')) valido = false;
    if (!validarCampoTexto(form, 'material', 'Informe o material.')) valido = false;
    if (!validarCampoTexto(form, 'prazoDesejado', 'Informe o prazo desejado.')) valido = false;
    if (!validarCampoTexto(form, 'urgencia', 'Selecione a urgência.')) valido = false;
    if (!validarCampoTexto(form, 'localEntrega', 'Informe o local de entrega.')) valido = false;
    if (!validarCampoTexto(form, 'descricao', 'Informe a descrição técnica.')) valido = false;

    if (!quantidade.value || Number(quantidade.value) <= 0) {
      setFieldState(quantidade, 'Informe uma quantidade maior que zero.');
      valido = false;
    } else {
      setFieldState(quantidade, '');
    }

    const arquivoLabel = arquivo?.closest('.upload');
    const arquivoSelecionado = arquivo?.files?.[0];
    if (!arquivoSelecionado) {
      erroArquivoMsg = 'Anexe um arquivo técnico.';
    } else {
      erroArquivoMsg = validarArquivo(arquivoSelecionado) || '';
    }
    if (arquivoLabel) {
      arquivoLabel.classList.toggle('has-error', Boolean(erroArquivoMsg));
      let msgElement = arquivoLabel.querySelector('.field-message');
      if (!msgElement) {
        msgElement = document.createElement('small');
        msgElement.className = 'field-message';
        arquivoLabel.appendChild(msgElement);
      }
      msgElement.textContent = erroArquivoMsg;
    }
    if (erroArquivoMsg) valido = false;

    return valido;
  }

  function bindSolicitacaoForm() {
    const form = document.querySelector('.js-solicitacao-form');
    if (!form) return;

    form.querySelectorAll('[name="peca"], [name="categoria"], [name="material"], [name="quantidade"], [name="prazoDesejado"], [name="urgencia"], [name="localEntrega"], [name="descricao"]').forEach((input) => {
      input.addEventListener('input', () => setFieldState(input, ''));
      input.addEventListener('change', () => setFieldState(input, ''));
    });

    const arquivoInput = form.querySelector('[name="arquivo"]');
    arquivoInput?.addEventListener('change', () => {
      const label = arquivoInput.closest('.upload');
      const file = arquivoInput.files?.[0];
      const erro = file ? validarArquivo(file) : null;
      label?.classList.toggle('has-error', Boolean(erro));
      const msgElement = label?.querySelector('.field-message');
      if (msgElement) msgElement.textContent = erro || '';
      if (erro) notify(erro, 'error');
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!validarFormulario(form)) {
        notify('Confira os campos destacados antes de publicar.', 'error');
        return;
      }

      const data = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = 'Publicando...';

      try {
        const payload = {
          peca: String(data.get('peca') || '').trim(),
          categoria: String(data.get('categoria') || '').trim(),
          material: String(data.get('material') || '').trim(),
          quantidade: data.get('quantidade'),
          prazoDesejado: data.get('prazoDesejado'),
          urgencia: data.get('urgencia'),
          localEntrega: String(data.get('localEntrega') || '').trim(),
          descricao: String(data.get('descricao') || '').trim(),
        };

        const arquivo = form.querySelector('input[name="arquivo"]')?.files?.[0];
        payload.arquivoTecnico = await readFileAsDataUrl(arquivo);
        payload.arquivoTecnicoNome = arquivo.name;

        await window.UsinaLinkApi.post('/solicitacoes', payload);
        notify('Solicitação publicada com o arquivo anexado.', 'success');
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
      ultimasSolicitacoes = rows;
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 30px;">Nenhuma solicitação encontrada. <a href="nova-solicitacao.html">Criar a primeira</a>.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(row => `
        <tr data-search-row data-solicitacao-id="${esc(row.idSolicitacao)}">
          <td>${esc(row.peca)}</td>
          <td>${esc(row.categoria)}</td>
          <td>${row.quantidade ?? '-'}</td>
          <td>${statusBadge(row.status)}</td>
          <td>${row.prazoDesejado ? new Date(row.prazoDesejado).toLocaleDateString('pt-BR') : '-'}</td>
          <td><button class="table-action js-view-solicitacao" type="button">Ver</button></td>
        </tr>`).join('');
    } catch (error) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 30px;">Falha ao carregar solicitações: ${esc(error.message)}</td></tr>`;
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.js-view-solicitacao');
    if (!button) return;
    const id = button.closest('[data-solicitacao-id]')?.dataset.solicitacaoId;
    const item = ultimasSolicitacoes.find((s) => String(s.idSolicitacao) === id);
    if (!item || typeof openActionModal !== 'function') return;

    const arquivoInfo = item.arquivoTecnicoNome
      ? `<a href="${item.arquivoTecnico}" download="${esc(item.arquivoTecnicoNome)}" class="text-link">${esc(item.arquivoTecnicoNome)}</a>`
      : 'Nenhum arquivo anexado';

    openActionModal({
      title: item.peca || 'Detalhes da solicitação',
      kicker: 'Solicitação',
      body: `<div class="action-modal-grid">
        <div><span>Categoria</span><strong>${esc(item.categoria || '-')}</strong></div>
        <div><span>Material</span><strong>${esc(item.material || '-')}</strong></div>
        <div><span>Quantidade</span><strong>${esc(item.quantidade ?? '-')}</strong></div>
        <div><span>Urgência</span><strong>${esc(item.urgencia || '-')}</strong></div>
        <div><span>Status</span><strong>${esc(item.status || '-')}</strong></div>
        <div><span>Prazo desejado</span><strong>${item.prazoDesejado ? new Date(item.prazoDesejado).toLocaleDateString('pt-BR') : '-'}</strong></div>
        <div><span>Local de entrega</span><strong>${esc(item.localEntrega || '-')}</strong></div>
        <div><span>Arquivo técnico</span><strong>${arquivoInfo}</strong></div>
        <div class="span-2"><span>Descrição</span><strong>${esc(item.descricao || '-')}</strong></div>
      </div><div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button></div>`
    });
  });

  bindSolicitacaoForm();
  loadSolicitacoes();
}());
