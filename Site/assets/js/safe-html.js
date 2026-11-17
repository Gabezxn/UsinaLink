/* UsinaLink: escape de HTML e de URLs para tudo que vem do usuário ou da API e entra em innerHTML. */
(function () {
  "use strict";
  var MAP = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "`": "&#96;" };
  function escape(value) {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"'`]/g, function (c) { return MAP[c]; });
  }
  /** URL segura para href/src: só https/http, data de PDF/imagem ou caminhos relativos. Fora disso, "#". */
  function url(value) {
    var v = String(value === null || value === undefined ? "" : value).trim();
    if (/^(https?:\/\/|\/|\.\/|[a-z0-9_\-]+\.html)/i.test(v) || /^data:(application\/pdf|image\/(png|jpe?g|gif|webp));base64,[a-z0-9+\/=]+$/i.test(v)) return escape(v);
    return "#";
  }
  /** Prazo com uma unidade so: "45" -> "45 dias"; 30, 60, 90... dias -> "1 mês", "2 meses", "3 meses". Texto livre fica como esta. */
  function prazo(value, vazio) {
    var t = String(value === null || value === undefined ? "" : value).trim();
    if (!t) return vazio === undefined ? "A combinar" : vazio;
    var m = t.match(/^(\d+)(?:\s*(?:dias?|d))?$/i);
    if (!m) return t;
    var n = Number(m[1]);
    if (n >= 30 && n % 30 === 0) { var meses = n / 30; return meses + (meses === 1 ? " mês" : " meses"); }
    return n + (n === 1 ? " dia" : " dias");
  }
  window.SafeHtml = { escape: escape, url: url, prazo: prazo };
  window.formatPrazo = prazo;
  /** Urgência para exibir: "media" -> "Média", "alta" -> "Alta". */
  var URG = { baixa: "Baixa", normal: "Normal", media: "Média", "média": "Média", alta: "Alta", urgente: "Urgente", critica: "Crítica", "crítica": "Crítica" };
  window.formatUrgencia = function (value, vazio) {
    var t = String(value === null || value === undefined ? "" : value).trim();
    if (!t) return vazio === undefined ? "Normal" : vazio;
    return URG[t.toLowerCase()] || t.charAt(0).toUpperCase() + t.slice(1);
  };
})();
