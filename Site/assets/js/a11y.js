/* UsinaLink: acessibilidade. Expõe window.UsinaA11y = { get, set, reset }. Preferências em localStorage['usinalinkA11y']. */
(function () {
  "use strict";
  var KEY = "usinalinkA11y";
  var DEFAULTS = { fontScale: 100, contrast: "normal", theme: "light", spacing: false, dyslexia: false, reduceMotion: false, highlightLinks: false };
  var SCALES = [100, 112, 125, 150];
  var root = document.documentElement;
  var prefs = load();

  function load() {
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { saved = {}; }
    return sanitize(Object.assign({}, DEFAULTS, saved));
  }
  function sanitize(p) {
    var out = Object.assign({}, DEFAULTS);
    out.fontScale = SCALES.indexOf(Number(p.fontScale)) >= 0 ? Number(p.fontScale) : 100;
    out.contrast = p.contrast === "high" ? "high" : "normal";
    out.theme = ["light", "dark", "auto"].indexOf(p.theme) >= 0 ? p.theme : "light";
    ["spacing", "dyslexia", "reduceMotion", "highlightLinks"].forEach(function (k) { out[k] = p[k] === true; });
    return out;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { /* sem armazenamento */ } }
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  function apply() {
    root.style.fontSize = prefs.fontScale + "%";
    var dark = prefs.theme === "dark" || (prefs.theme === "auto" && mq && mq.matches);
    root.classList.toggle("a11y-contrast-high", prefs.contrast === "high");
    root.classList.toggle("a11y-dark", !!dark);
    root.classList.toggle("a11y-spacing", prefs.spacing);
    root.classList.toggle("a11y-dyslexia", prefs.dyslexia);
    root.classList.toggle("a11y-reduce-motion", prefs.reduceMotion);
    root.classList.toggle("a11y-links", prefs.highlightLinks);
    syncPanel();
  }
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { if (prefs.theme === "auto") apply(); });

  window.UsinaA11y = {
    get: function () { return Object.assign({}, prefs); },
    set: function (partial) { prefs = sanitize(Object.assign({}, prefs, partial || {})); save(); apply(); },
    reset: function () { prefs = Object.assign({}, DEFAULTS); save(); apply(); }
  };

  /* ---------- Painel ---------- */
  var toggle, panel;
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text) n.textContent = text;
    return n;
  }
  function checkbox(id, label, key) {
    var l = el("label", { "for": id });
    var i = el("input", { type: "checkbox", id: id, "data-pref": key });
    l.appendChild(i); l.appendChild(document.createTextNode(label));
    return l;
  }
  function build() {
    toggle = el("button", { type: "button", id: "a11y-toggle", "class": "a11y-toggle", "aria-expanded": "false", "aria-controls": "a11y-panel" });
    toggle.appendChild(el("span", { "aria-hidden": "true" }, "♿"));
    toggle.appendChild(el("span", { "class": "a11y-label" }, "Acessibilidade"));
    panel = el("div", { id: "a11y-panel", "class": "a11y-panel", role: "dialog", "aria-modal": "true", "aria-labelledby": "a11y-title", hidden: "" });
    var close = el("button", { type: "button", "class": "a11y-close", id: "a11y-close" }, "Fechar");
    panel.appendChild(close);
    panel.appendChild(el("h2", { id: "a11y-title" }, "Opções de acessibilidade"));

    var f1 = el("fieldset"); f1.appendChild(el("legend", {}, "Tamanho da fonte"));
    var row = el("div", { "class": "a11y-row" });
    SCALES.forEach(function (s) { row.appendChild(el("button", { type: "button", "data-font": String(s), "aria-pressed": "false" }, s + "%")); });
    f1.appendChild(row); panel.appendChild(f1);

    var f2 = el("fieldset"); f2.appendChild(el("legend", {}, "Contraste e tema"));
    var hc = el("button", { type: "button", id: "a11y-contrast", "aria-pressed": "false" }, "Alto contraste");
    var sel = el("select", { id: "a11y-theme", "aria-label": "Tema" });
    [["light", "Tema claro"], ["dark", "Tema escuro"], ["auto", "Seguir o sistema"]].forEach(function (o) { sel.appendChild(el("option", { value: o[0] }, o[1])); });
    var row2 = el("div", { "class": "a11y-row" }); row2.appendChild(hc); row2.appendChild(sel);
    f2.appendChild(row2); panel.appendChild(f2);

    var f3 = el("fieldset"); f3.appendChild(el("legend", {}, "Leitura"));
    f3.appendChild(checkbox("a11y-spacing", "Mais espaçamento entre linhas e letras", "spacing"));
    f3.appendChild(checkbox("a11y-dyslexia", "Fonte para dislexia", "dyslexia"));
    f3.appendChild(checkbox("a11y-motion", "Reduzir animações", "reduceMotion"));
    f3.appendChild(checkbox("a11y-links", "Destacar links", "highlightLinks"));
    panel.appendChild(f3);

    var actions = el("div", { "class": "a11y-actions" });
    actions.appendChild(el("button", { type: "button", id: "a11y-reset" }, "Restaurar padrão"));
    panel.appendChild(actions);

    document.body.appendChild(toggle); document.body.appendChild(panel);

    toggle.addEventListener("click", function () { panel.hidden ? openPanel() : closePanel(); });
    close.addEventListener("click", closePanel);
    document.getElementById("a11y-reset").addEventListener("click", function () { window.UsinaA11y.reset(); });
    panel.addEventListener("click", function (e) {
      var b = e.target.closest && e.target.closest("[data-font]");
      if (b) window.UsinaA11y.set({ fontScale: Number(b.getAttribute("data-font")) });
    });
    hc.addEventListener("click", function () { window.UsinaA11y.set({ contrast: prefs.contrast === "high" ? "normal" : "high" }); });
    sel.addEventListener("change", function () { window.UsinaA11y.set({ theme: sel.value }); });
    panel.addEventListener("change", function (e) {
      var k = e.target.getAttribute && e.target.getAttribute("data-pref");
      if (k) { var p = {}; p[k] = e.target.checked; window.UsinaA11y.set(p); }
    });
    panel.addEventListener("keydown", trap);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !panel.hidden) { e.preventDefault(); closePanel(); } });
    syncPanel();
  }
  function syncPanel() {
    if (!panel) return;
    Array.prototype.forEach.call(panel.querySelectorAll("[data-font]"), function (b) { b.setAttribute("aria-pressed", String(Number(b.getAttribute("data-font")) === prefs.fontScale)); });
    document.getElementById("a11y-contrast").setAttribute("aria-pressed", String(prefs.contrast === "high"));
    document.getElementById("a11y-theme").value = prefs.theme;
    Array.prototype.forEach.call(panel.querySelectorAll("[data-pref]"), function (i) { i.checked = prefs[i.getAttribute("data-pref")] === true; });
  }
  function focusables() {
    return Array.prototype.filter.call(panel.querySelectorAll("button, select, input, [href], [tabindex]:not([tabindex='-1'])"), function (n) { return !n.disabled; });
  }
  function trap(e) {
    if (e.key !== "Tab") return;
    var f = focusables(); if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  function openPanel() { panel.hidden = false; toggle.setAttribute("aria-expanded", "true"); var f = focusables(); (f[1] || f[0]).focus(); }
  function closePanel() { panel.hidden = true; toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }

  /* ---------- Pular para o conteúdo ---------- */
  function skipLink() {
    var main = document.querySelector("main, [role='main']");
    if (!main) return;
    if (!main.id) main.id = "conteudo";
    if (main.getAttribute("tabindex") === null) main.setAttribute("tabindex", "-1");
    var a = el("a", { "class": "a11y-skip", href: "#" + main.id }, "Pular para o conteúdo");
    a.addEventListener("click", function () { window.setTimeout(function () { main.focus(); }, 0); });
    document.body.insertBefore(a, document.body.firstChild);
  }

  /* ---------- VLibras ---------- */
  function vlibras() {
    if (document.querySelector("[vw]")) return;
    var vw = el("div", { vw: "", "class": "enabled" });
    var btn = el("div", { "vw-access-button": "", "class": "active" });
    var wrap = el("div", { "vw-plugin-wrapper": "" });
    wrap.appendChild(el("div", { "class": "vw-plugin-top-wrapper" }));
    vw.appendChild(btn); vw.appendChild(wrap);
    document.body.appendChild(vw);
    var s = document.createElement("script");
    s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
    s.async = true;
    s.onload = function () { try { new window.VLibras.Widget("https://vlibras.gov.br/app"); } catch (e) { /* VLibras indisponível */ } };
    s.onerror = function () { /* sem rede: a página segue funcionando */ };
    document.head.appendChild(s);
  }

  function init() { skipLink(); build(); vlibras(); apply(); }
  apply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
