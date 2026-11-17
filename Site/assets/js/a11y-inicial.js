/* Aplica as preferências de acessibilidade (modo escuro, contraste, fonte...) já no <head>, antes da primeira pintura da página.
   Sem isto a página aparecia clara por um instante e só depois ficava escura (o a11y.js carrega no fim da página).
   A lógica é a mesma do apply() do a11y.js; o painel continua sendo montado por ele. */
(function () {
  try {
    var p = JSON.parse(localStorage.getItem("usinalinkA11y") || "{}") || {};
    var root = document.documentElement;
    var escalas = [100, 112, 125, 150];
    if (escalas.indexOf(Number(p.fontScale)) >= 0) root.style.fontSize = Number(p.fontScale) + "%";
    var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
    var escuro = p.theme === "dark" || (p.theme === "auto" && mq && mq.matches);
    if (escuro) root.classList.add("a11y-dark");
    if (p.contrast === "high") root.classList.add("a11y-contrast-high");
    if (p.spacing === true) root.classList.add("a11y-spacing");
    if (p.dyslexia === true) root.classList.add("a11y-dyslexia");
    if (p.reduceMotion === true) root.classList.add("a11y-reduce-motion");
    if (p.highlightLinks === true) root.classList.add("a11y-links");
  } catch (e) { /* sem armazenamento: o a11y.js aplica o padrão depois */ }
})();
