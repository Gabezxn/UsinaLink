(function () {
  const body = document.querySelector("[data-solicitacoes-pecas-body]");
  if (!body) return;

  let todas = [];
  let filtroTipo = "todos";
  let filtroStatus = "todos";

  const STATUS = {
    registrada: { rotulo: "Nova - aguardando você", classe: "warning" },
    aceita: { rotulo: "Aguardando pagamento", classe: "info" },
    paga: { rotulo: "Paga - separar", classe: "success" },
    em_separacao: { rotulo: "Em separação", classe: "info" },
    enviada: { rotulo: "Enviada", classe: "info" },
    entregue: { rotulo: "Entregue", classe: "success" },
    recusada: { rotulo: "Recusada", classe: "muted" },
    cancelada: { rotulo: "Cancelada pelo comprador", classe: "muted" },
  };
  const ABERTAS = ["registrada", "aceita", "paga", "em_separacao", "enviada"];

  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function money(value) {
    return typeof formatMoneyBR === "function" ? formatMoneyBR(value) : `R$ ${Number(value || 0).toFixed(2)}`;
  }

  function total(row) {
    return row.total != null ? Number(row.total) : Number(row.valorUnitario) * Number(row.quantidade || 1);
  }

  function acoes(row) {
    switch (row.status) {
      case "registrada":
        return `<button class="table-action" type="button" data-acao="aceitar">Aceitar</button><button class="table-action" type="button" data-acao="recusar">Recusar</button>`;
      case "paga":
        return '<button class="table-action" type="button" data-acao="separar">Iniciar separação</button>';
      case "em_separacao":
        return '<button class="table-action" type="button" data-acao="enviar">Marcar como enviada</button>';
      default:
        return '<span class="muted-text">-</span>';
    }
  }

  function rowMarkup(row) {
    const s = row.solicitante || {};
    const telefone = s.telefone && typeof maskPhone === "function" ? maskPhone(s.telefone) : s.telefone;
    const contato = [s.email, telefone].filter(Boolean).join(" / ") || "-";
    const tipo = s.tipo === "empresa" ? '<span class="badge info">Empresa</span>' : '<span class="badge warning">Pessoa f&iacute;sica</span>';
    const st = STATUS[row.status] || { rotulo: row.status, classe: "info" };
    const unit = row.valorUnitario != null ? money(row.valorUnitario) : "-";
    const totalTexto = row.valorUnitario != null ? money(total(row)) : "-";
    const data = row.criadoEm ? new Date(row.criadoEm).toLocaleDateString("pt-BR") : "-";
    return `<tr data-search-row data-id="${esc(row.idSolicitacaoComercial)}"><td>${esc(s.nome || "-")}</td><td>${tipo}</td><td>${esc(contato)}</td><td>${esc(row.peca)}</td><td>${esc(row.quantidade ?? 1)}</td><td>${esc(unit)}</td><td>${esc(totalTexto)}</td><td><span class="badge ${st.classe}">${esc(st.rotulo)}</span></td><td>${esc(data)}</td><td>${acoes(row)}</td></tr>`;
  }

  function render() {
    const rows = todas.filter((row) => {
      if (filtroTipo !== "todos" && row.solicitante?.tipo !== filtroTipo) return false;
      if (filtroStatus === "novas") return row.status === "registrada";
      if (filtroStatus === "andamento") return ABERTAS.includes(row.status) && row.status !== "registrada";
      if (filtroStatus === "encerradas") return !ABERTAS.includes(row.status);
      return true;
    });
    body.innerHTML = rows.length
      ? rows.map(rowMarkup).join("")
      : '<tr><td colspan="10" style="text-align:center; padding: 24px;">Nenhuma solicita&ccedil;&atilde;o de pe&ccedil;a neste filtro.</td></tr>';
  }

  function stats() {
    const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    const validas = todas.filter((r) => !["recusada", "cancelada"].includes(r.status));
    set("[data-stat-total]", todas.length);
    set("[data-stat-novas]", todas.filter((r) => r.status === "registrada").length);
    set("[data-stat-separar]", todas.filter((r) => r.status === "paga").length);
    set("[data-stat-valor]", money(validas.reduce((soma, r) => soma + (r.valorUnitario != null ? total(r) : 0), 0)));
  }

  async function carregar() {
    todas = await window.UsinaLinkApi.get("/solicitacoes-comerciais/recebidas");
    stats();
    render();
  }

  async function executar(id, acao, observacao) {
    const atualizada = await window.UsinaLinkApi.patch(`/solicitacoes-comerciais/${id}/acao`, { acao, observacao });
    todas = todas.map((r) => (String(r.idSolicitacaoComercial) === String(id) ? atualizada : r));
    stats();
    render();
  }

  const MENSAGENS = {
    aceitar: { title: "Aceitar solicitação", message: "Aceitar esta solicitação? O comprador será avisado e poderá pagar.", confirmText: "Aceitar" },
    separar: { title: "Iniciar separação", message: "Confirmar que você começou a separar esta peça?", confirmText: "Iniciar separação" },
    enviar: { title: "Marcar como enviada", message: "Confirmar que a peça foi enviada ao comprador?", confirmText: "Marcar como enviada" },
  };

  body.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-acao]");
    if (!botao) return;
    const id = botao.closest("tr").dataset.id;
    const acao = botao.dataset.acao;

    if (acao === "recusar") {
      openActionModal({
        title: "Recusar solicitação",
        kicker: "Comercial",
        body: `<form class="form" data-form-recusa>
          <label class="field"><span>Motivo (opcional, o comprador verá)</span><textarea name="observacao" rows="3" placeholder="Ex.: peça sem estoque no momento"></textarea></label>
          <div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Voltar</button><button class="btn btn-orange" type="submit">Recusar solicitação</button></div>
        </form>`,
      });
      const form = document.querySelector("[data-form-recusa]");
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        try {
          await executar(id, "recusar", form.elements.observacao.value.trim() || undefined);
          ensureActionModal().hidden = true;
          showToast("Solicitação recusada");
        } catch (error) { showToast(error.message); }
      });
      return;
    }

    const texto = MENSAGENS[acao];
    if (!texto) return;
    openSimpleConfirm({
      ...texto,
      orange: true,
      cancelText: "Voltar",
      onConfirm: async () => {
        try { await executar(id, acao); showToast("Status atualizado"); } catch (error) { showToast(error.message); }
      },
    });
  });

  document.querySelectorAll("[data-tipo-filter]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tipo-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    filtroTipo = button.dataset.tipoFilter;
    render();
  }));

  document.querySelectorAll("[data-status-filter]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-status-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    filtroStatus = button.dataset.statusFilter;
    render();
  }));

  carregar().catch((error) => {
    body.innerHTML = `<tr><td colspan="10" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`;
  });
}());
