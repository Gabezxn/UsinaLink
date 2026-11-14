(function () {
  const moneyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function onlyDigits(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function parseCurrency(value) {
    if (typeof value === "number") return value;
    const bruto = String(value || "").trim();
    // A API devolve números como "1500.50" (ponto decimal); em texto brasileiro a vírgula é o decimal e o ponto é milhar.
    if (/^-?\d+(\.\d+)?$/.test(bruto) && !/^-?\d{1,3}(\.\d{3})+$/.test(bruto)) return Number(bruto);
    const clean = bruto.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const number = Number(clean);
    return Number.isFinite(number) ? number : 0;
  }

  function formatCurrency(value) {
    return moneyFormatter.format(Number(value) || 0);
  }

  function formatDateTime(value) {
    const date = value ? new Date(value) : new Date();
    return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date);
  }

  function formatDate(value) {
    const date = value ? new Date(value) : new Date();
    return new Intl.DateTimeFormat("pt-BR").format(date);
  }

  function formatCpf(value) {
    return onlyDigits(value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  function formatCnpj(value) {
    return onlyDigits(value).slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
  }

  function formatPhone(value) {
    return onlyDigits(value).slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
  }

  function slugStatus(status) {
    return String(status || "pendente").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
  }

  function statusBadge(status) {
    const label = status || "Pendente";
    return `<span class="badge status-${slugStatus(label)}">${escapeHtml(label)}</span>`;
  }

  function orderNumber(id) {
    const raw = String(id || Date.now()).replace(/\D/g, "").slice(-5).padStart(5, "0");
    return `USL-${raw}`;
  }

  function calculateTotals(order, proposal, payment) {
    const value = parseCurrency(payment?.valorTotal || proposal?.valor || order?.valor || 18500);
    const freight = parseCurrency(proposal?.frete || order?.frete || 0);
    const discount = parseCurrency(payment?.desconto || 0);
    const taxes = Math.round((value + freight - discount) * 0.035 * 100) / 100;
    const subtotal = value + freight;
    const total = Math.max(0, subtotal - discount + taxes);
    return { subtotal, discount, taxes, total };
  }

  function showFeedback(message, type = "info") {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.setAttribute("aria-atomic", "true");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.dataset.type = type;
    toast.classList.add("show");
    window.setTimeout(() => toast.classList.remove("show"), 7000);
  }

  window.UsinaLinkUi = {
    onlyDigits,
    parseCurrency,
    formatCurrency,
    formatDate,
    formatDateTime,
    formatCpf,
    formatCnpj,
    formatPhone,
    escapeHtml,
    slugStatus,
    statusBadge,
    orderNumber,
    calculateTotals,
    showFeedback
  };
}());
