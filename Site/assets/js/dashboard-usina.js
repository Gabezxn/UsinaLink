(function () {
  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function money(value) {
    return typeof formatMoneyBR === "function" ? formatMoneyBR(value) : `R$ ${Number(value || 0).toFixed(2)}`;
  }

  function statusLabel(status) {
    return typeof statusPropostaLabel === "function" ? statusPropostaLabel(status) : (status || "Enviada");
  }

  function propostaRowMarkup(item) {
    const status = statusLabel(item.status);
    const badge = typeof badgeClass === "function" ? badgeClass(status) : "info";
    const peca = item.pedido?.itens?.[0]?.nome || "Peça industrial";
    const cliente = item.pedido?.empresaCompradora?.nomeFantasia || item.pedido?.empresaCompradora?.razaoSocial || "-";
    return `<tr data-search-row><td>${esc(peca)}</td><td>${esc(cliente)}</td><td>${esc(money(item.valor))}</td><td>${esc(item.prazo || "A combinar")}</td><td><span class="badge ${badge}">${esc(status)}</span></td><td><button class="table-action js-alert" type="button">Ver detalhes</button></td></tr>`;
  }

  async function loadDashboard() {
    if (!window.UsinaLinkApi) return;
    const propostasBody = document.querySelector("[data-dashboard-propostas-body]");
    try {
      const [pedidosDisponiveis, propostas] = await Promise.all([
        window.UsinaLinkApi.get("/pedidos/disponiveis"),
        window.UsinaLinkApi.get("/propostas/enviadas"),
      ]);

      const aceitas = propostas.filter((p) => p.status === "aceita");
      const faturamento = aceitas.reduce((total, p) => total + (Number(p.valor) || 0), 0);

      const setStat = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
      setStat("[data-stat-pedidos-disponiveis]", pedidosDisponiveis.length);
      setStat("[data-stat-propostas-enviadas]", propostas.length);
      setStat("[data-stat-propostas-aceitas]", aceitas.length);
      setStat("[data-stat-faturamento]", money(faturamento));

      if (propostasBody) {
        const recentes = [...propostas].sort((a, b) => new Date(b.dataEnvio) - new Date(a.dataEnvio)).slice(0, 4);
        propostasBody.innerHTML = recentes.length
          ? recentes.map(propostaRowMarkup).join("")
          : '<tr><td colspan="6" style="text-align:center; padding: 24px;">Nenhuma proposta enviada ainda.</td></tr>';
      }
    } catch (error) {
      if (propostasBody) propostasBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`;
    }
  }

  loadDashboard();
}());
