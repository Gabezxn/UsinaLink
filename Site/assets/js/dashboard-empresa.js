(function () {
  function statusBadge(status) {
    const map = { aberta: ["info", "Aberta"], em_analise: ["warning", "Em analise"], concluida: ["success", "Concluida"], cancelada: ["muted", "Cancelada"] };
    const [cls, label] = map[status] || ["info", status || "Aberta"];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function solicitacaoRowMarkup(item) {
    return `<tr data-search-row>
      <td>${esc(item.peca)}</td>
      <td>${esc(item.categoria)}</td>
      <td>${item.quantidade ?? "-"}</td>
      <td>${statusBadge(item.status)}</td>
      <td>${item.prazoDesejado ? new Date(item.prazoDesejado).toLocaleDateString("pt-BR") : "-"}</td>
    </tr>`;
  }

  async function loadDashboard() {
    if (!window.UsinaLinkApi) return;
    const summary = document.querySelector("[data-dashboard-summary]");
    const tableBody = document.querySelector("[data-dashboard-solicitacoes-body]");
    if (!summary && !tableBody) return;

    try {
      const [solicitacoes, propostas, pedidos] = await Promise.all([
        window.UsinaLinkApi.get("/solicitacoes/meus"),
        window.UsinaLinkApi.get("/propostas/recebidas"),
        window.UsinaLinkApi.get("/pedidos/meus"),
      ]);

      const abertas = solicitacoes.filter((s) => s.status === "aberta").length;
      const emAndamento = pedidos.filter((p) => ["em_negociacao", "proposta_aceita", "em_producao", "enviado"].includes(p.status));
      const finalizados = pedidos.filter((p) => ["concluido", "concluida"].includes(p.status));

      const setStat = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
      setStat("[data-stat-solicitacoes-abertas]", abertas);
      setStat("[data-stat-propostas-recebidas]", propostas.length);
      setStat("[data-stat-pedidos-andamento]", emAndamento.length);
      setStat("[data-stat-pedidos-finalizados]", finalizados.length);

      if (tableBody) {
        const recentes = [...solicitacoes].slice(0, 5);
        tableBody.innerHTML = recentes.length
          ? recentes.map(solicitacaoRowMarkup).join("")
          : '<tr><td colspan="5" style="text-align:center; padding: 24px;">Nenhuma solicitacao ainda. <a href="nova-solicitacao.html">Criar a primeira</a>.</td></tr>';
      }
    } catch (error) {
      if (tableBody) tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 24px;">Falha ao carregar: ${error.message}</td></tr>`;
    }
  }

  loadDashboard();
}());
