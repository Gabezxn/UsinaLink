// Animacoes do site (versao de teste). Tudo aqui respeita "reduzir movimento" (sistema e painel de acessibilidade).
(function () {
  "use strict";
  var root = document.documentElement;
  function reduzido() {
    return root.classList.contains("a11y-reduce-motion") || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  var registrado = null;
  function registrarRaio() {
    if (registrado !== null) return registrado;
    try {
      if (!(window.CSS && CSS.registerProperty && CSS.supports("mask-image", "radial-gradient(circle at 0 0, #000, #000)"))) return (registrado = false);
      try { CSS.registerProperty({ name: "--paint-r", syntax: "<length>", inherits: false, initialValue: "0px" }); } catch (e) { /* ja registrada */ }
      return (registrado = true);
    } catch (e) { return (registrado = false); }
  }

  /**
   * Troca de cor "pintada": o fundo antigo fica numa camada que vai sendo apagada em circulo a partir de `origem`
   * (o botao clicado), enquanto as cores do tema (variaveis registradas no CSS) mudam suavemente por baixo.
   * `aplicar` faz a troca de verdade (classes etc.). Sem suporte ou com movimento reduzido, so aplica.
   */
  function pintar(origem, aplicar) {
    if (reduzido() || !registrarRaio() || !document.body || !document.body.animate) { aplicar(); return; }
    var body = document.body;
    var cs = getComputedStyle(body);
    var rect = origem && origem.getBoundingClientRect ? origem.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 2, width: 0, height: 0 };
    var x = Math.round(rect.left + rect.width / 2), y = Math.round(rect.top + rect.height / 2);
    var raio = Math.ceil(Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))) + 80;
    var camada = document.createElement("div");
    camada.className = "paint-layer";
    camada.setAttribute("aria-hidden", "true");
    camada.style.backgroundImage = cs.backgroundImage;
    camada.style.backgroundColor = cs.backgroundColor;
    camada.style.setProperty("--paint-x", x + "px");
    camada.style.setProperty("--paint-y", y + "px");
    body.appendChild(camada);
    body.classList.add("paint-anim");
    void body.offsetWidth; // garante que a transicao das variaveis de cor parta da cor antiga
    aplicar();
    var anim = camada.animate([{ "--paint-r": "0px" }, { "--paint-r": raio + "px" }], { duration: 900, easing: "cubic-bezier(.4, 0, .2, 1)", fill: "forwards" });
    var fim = function () { camada.remove(); window.setTimeout(function () { body.classList.remove("paint-anim"); }, 150); };
    anim.onfinish = fim;
    anim.oncancel = fim;
  }

  /** Entrada suave dos blocos da pagina inicial ao rolar. Sem JS ou sem movimento, tudo aparece normalmente. */
  function revelar(seletores) {
    if (reduzido() || !("IntersectionObserver" in window)) return;
    var alvos = [];
    seletores.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) { if (alvos.indexOf(el) < 0) alvos.push(el); });
    });
    if (!alvos.length) return;
    root.classList.add("js-motion");
    var obs = new IntersectionObserver(function (itens) {
      itens.forEach(function (item) {
        if (!item.isIntersecting) return;
        item.target.classList.add("is-visible");
        obs.unobserve(item.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    alvos.forEach(function (el) {
      el.setAttribute("data-reveal", "");
      // escalonado entre irmaos: cada cartao entra um pouco depois do anterior
      var irmaos = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return alvos.indexOf(c) >= 0; }) : [el];
      el.style.setProperty("--reveal-delay", Math.max(0, irmaos.indexOf(el)) * 90 + "ms");
      obs.observe(el);
    });
  }

  window.UsinaMotion = { reduzido: reduzido, pintar: pintar, revelar: revelar };

  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector(".lp-hero")) {
      revelar([".lp-hero > *", ".lp-numbers .lp-stats", ".section > h2:not(.a11y-sr-only)", ".card.step-card", ".card.benefit-card", ".lp-profile", ".partner-card", ".lp-cta"]);
    }
  });
}());
