(function () {
  function notify(message, type) {
    if (window.showToast) window.showToast(message);
    else if (window.UsinaLinkUi?.showFeedback) window.UsinaLinkUi.showFeedback(message, type);
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  async function loadMinhas() {
    const body = document.querySelector('[data-solicitacoes-comerciais-body]');
    if (!body) return;
    try {
      const rows = await window.UsinaLinkApi.get('/solicitacoes-comerciais/minhas');
      if (!rows.length) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px;">Nenhuma solicitação comercial ainda.</td></tr>';
        return;
      }
      body.innerHTML = rows.map(row => `
        <tr>
          <td>${row.peca || ''}</td>
          <td>${row.fornecedor || '-'}</td>
          <td>${row.valorUnitario ? formatMoney(row.valorUnitario) : '-'}</td>
          <td>${row.quantidade ?? 1}</td>
          <td><span class="badge success">Registrada</span></td>
          <td>${row.criadoEm ? new Date(row.criadoEm).toLocaleDateString('pt-BR') : '-'}</td>
        </tr>`).join('');
    } catch (error) {
      body.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">Falha ao carregar: ${error.message}</td></tr>`;
    }
  }

  function bindComprarButtons() {
    document.querySelectorAll('.js-comprar-peca').forEach((button) => {
      button.addEventListener('click', async () => {
        const peca = button.dataset.peca;
        const fornecedor = button.dataset.fornecedor;
        const valorUnitario = button.dataset.valor;
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Enviando...';
        try {
          await window.UsinaLinkApi.post('/solicitacoes-comerciais', { peca, fornecedor, valorUnitario, quantidade: '1' });
          notify('Solicitação comercial registrada.', 'success');
          await loadMinhas();
        } catch (error) {
          notify(error.message, 'error');
        } finally {
          button.disabled = false;
          button.textContent = originalText;
        }
      });
    });
  }

  bindComprarButtons();
  loadMinhas();
}());
