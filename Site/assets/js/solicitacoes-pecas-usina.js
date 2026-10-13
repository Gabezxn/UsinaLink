(function () {
  const body = document.querySelector("[data-solicitacoes-pecas-body]");
  if (!body) return;

  let todas = [];
  let filtro = "todos";

  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function money(value) {
    return typeof formatMoneyBR === "function" ? formatMoneyBR(value) : `R$ ${Number(value || 0).toFixed(2)}`;
  }

  function total(row) {
    return Number(row.valorUnitario) * Number(row.quantidade || 1);
  }

  function rowMarkup(row) {
    const s = row.solicitante || {};
    const telefone = s.telefone && typeof maskPhone === "function" ? maskPhone(s.telefone) : s.telefone;
    const contato = [s.email, telefone].filter(Boolean).join(" / ") || "-";
    const tipo = s.tipo === "empresa" ? '<span class="badge info">Empresa</span>' : '<span class="badge warning">Pessoa f&iacute;sica</span>';
    const unit = row.valorUnitario != null ? money(row.valorUnitario) : "-";
    const totalTexto = row.valorUnitario != null ? money(total(row)) : "-";
    const data = row.criadoEm ? new Date(row.criadoEm).toLocaleDateString("pt-BR") : "-";
    return `<tr data-search-row><td>${esc(s.nome || "-")}</td><td>${tipo}</td><td>${esc(contato)}</td><td>${esc(row.peca)}</td><td>${esc(row.quantidade ?? 1)}</td><td>${esc(unit)}</td><td>${esc(totalTexto)}</td><td>${esc(data)}</td></tr>`;
  }

  function render() {
    const rows = todas.filter((row) => filtro === "todos" || row.solicitante?.tipo === filtro);
    body.innerHTML = rows.length
      ? rows.map(rowMarkup).join("")
      : '<tr><td colspan="8" style="text-align:center; padding: 24px;">Nenhuma solicita&ccedil;&atilde;o de pe&ccedil;a recebida ainda.</td></tr>';
  }

  function stats() {
    const set = (selector, value) => { const el = document.querySelector(selector); if (el) el.textContent = value; };
    set("[data-stat-total]", todas.length);
    set("[data-stat-empresas]", todas.filter((r) => r.solicitante?.tipo === "empresa").length);
    set("[data-stat-pessoas]", todas.filter((r) => r.solicitante?.tipo === "pessoa_fisica").length);
    set("[data-stat-valor]", money(todas.reduce((soma, r) => soma + (r.valorUnitario != null ? total(r) : 0), 0)));
  }

  document.querySelectorAll("[data-tipo-filter]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tipo-filter]").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    filtro = button.dataset.tipoFilter;
    render();
  }));

  window.UsinaLinkApi.get("/solicitacoes-comerciais/recebidas")
    .then((rows) => { todas = rows; stats(); render(); })
    .catch((error) => {
      body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 24px;">Falha ao carregar: ${esc(error.message)}</td></tr>`;
    });
}());
