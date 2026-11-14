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
  window.SafeHtml = { escape: escape, url: url };
})();
