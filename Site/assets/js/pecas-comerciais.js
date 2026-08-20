(function () {
  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function notify(message, type) {
    if (window.showToast) window.showToast(message);
    else if (window.UsinaLinkUi?.showFeedback) window.UsinaLinkUi.showFeedback(message, type);
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function fornecedorNome(usina) {
    return usina?.nomeFantasia || usina?.razaoSocial || 'Usina';
  }

  function pecaCardMarkup(peca) {
    const fornecedor = fornecedorNome(peca.usina);
    return `<article class="card order-opportunity" data-search-row>
      <h2>${esc(peca.nome)}</h2><p>${esc(peca.material || peca.categoria || '')}</p>
      <div class="quote-facts compact"><div><span>Estoque</span><strong>${esc(peca.estoque != null ? `${peca.estoque} ${peca.unidadeEstoque || 'unidades'}` : 'Sob consulta')}</strong></div><div><span>Prazo</span><strong>${esc(peca.prazoEntregaDias ? peca.prazoEntregaDias + ' dias' : 'A combinar')}</strong></div><div><span>Valor unit&aacute;rio</span><strong>${esc(peca.valorUnitario != null ? formatMoney(peca.valorUnitario) : 'Sob consulta')}</strong></div><div><span>Fornecedor</span><strong>${esc(fornecedor)}</strong></div></div>
      <div class="card-actions"><button class="btn btn-ghost js-alert" type="button">Ver detalhes</button><button class="btn btn-primary js-comprar-peca" type="button" data-peca="${esc(peca.nome)}" data-fornecedor="${esc(fornecedor)}" data-valor="${esc(peca.valorUnitario ?? '')}">Solicitar compra</button></div>
    </article>`;
  }

  async function loadCatalogo() {
    const grid = document.querySelector('.order-card-grid');
    if (!grid || !window.UsinaLinkApi) return [];
    try {
      const pecas = await window.UsinaLinkApi.get('/pecas-comerciais');
      grid.innerHTML = pecas.length
        ? pecas.map(pecaCardMarkup).join('')
        : '<article class="card order-opportunity"><h2>Nenhuma peça no catálogo</h2><p>As usinas ainda não cadastraram peças comerciais.</p></article>';
      return pecas;
    } catch (error) {
      grid.innerHTML = `<article class="card order-opportunity"><h2>Falha ao carregar catálogo</h2><p>${esc(error.message)}</p></article>`;
      return [];
    }
  }

  async function loadMinhas() {
    const body = document.querySelector('[data-solicitacoes-comerciais-body]');
    if (!body) return [];
    try {
      const rows = await window.UsinaLinkApi.get('/solicitacoes-comerciais/minhas');
      body.innerHTML = rows.length
        ? rows.map(row => `
          <tr>
            <td>${esc(row.peca || '')}</td>
            <td>${esc(row.fornecedor || '-')}</td>
            <td>${row.valorUnitario ? formatMoney(row.valorUnitario) : '-'}</td>
            <td>${esc(row.quantidade ?? 1)}</td>
            <td><span class="badge success">Registrada</span></td>
            <td>${row.criadoEm ? new Date(row.criadoEm).toLocaleDateString('pt-BR') : '-'}</td>
          </tr>`).join('')
        : '<tr><td colspan="6" style="text-align:center; padding: 24px;">Nenhuma solicitação comercial ainda.</td></tr>';
      return rows;
    } catch (error) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`;
      return [];
    }
  }

  function updateStats(pecas, minhas) {
    const setStat = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    setStat('[data-stat-pecas-disponiveis]', pecas.length);
    setStat('[data-stat-entrega-rapida]', pecas.filter((p) => Number(p.prazoEntregaDias) > 0 && Number(p.prazoEntregaDias) <= 5).length);
    setStat('[data-stat-fornecedores]', new Set(pecas.map((p) => p.idUsina)).size);
    setStat('[data-stat-cotacoes-salvas]', minhas.length);
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest('.js-comprar-peca');
    if (!button) return;
    const peca = button.dataset.peca;
    const fornecedor = button.dataset.fornecedor;
    const valorUnitario = button.dataset.valor;
    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Enviando...';
    try {
      await window.UsinaLinkApi.post('/solicitacoes-comerciais', { peca, fornecedor, valorUnitario: valorUnitario || undefined, quantidade: '1' });
      notify('Solicitação comercial registrada.', 'success');
      const minhas = await loadMinhas();
      updateStats(await loadCatalogo(), minhas);
    } catch (error) {
      notify(error.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = originalText;
    }
  });

  Promise.all([loadCatalogo(), loadMinhas()]).then(([pecas, minhas]) => updateStats(pecas, minhas));
}());
