/* "Esqueci minha senha" e "Criar nova senha" com a cara do login de cada conta (usina em laranja, pessoa física em verde-água, empresa em azul).
   O tipo vem do login de onde a pessoa chegou (?tipo=...) ou do link do e-mail (#...&tipo=...). Roda antes do senha.js, que apaga o código do endereço. */
(function () {
  "use strict";
  var q = new URLSearchParams(window.location.search).get("tipo");
  var h = /(?:^|[#&])tipo=([a-z_]+)/.exec(window.location.hash);
  var tipo = q || (h ? h[1] : "");
  var corpo = document.body;
  function marcar(seletor, classe) {
    document.querySelectorAll(seletor).forEach(function (el) { el.classList.add(classe); });
  }
  if (tipo === "usina") {
    corpo.classList.add("usina-auth");
    marcar(".brand-icon", "orange-icon");
    marcar(".auth-card", "usina-login-card");
    marcar(".auth-card .eyebrow", "orange-text");
    marcar(".input-icon", "orange-focus");
    document.querySelectorAll(".input-icon > span").forEach(function (el) { el.removeAttribute("aria-hidden"); }); // como no login da usina, o símbolo do campo aparece
    marcar(".auth-card button[type='submit']", "btn-orange");
  } else if (tipo === "pessoa_fisica") {
    corpo.classList.add("pf-mode");
  }
})();
