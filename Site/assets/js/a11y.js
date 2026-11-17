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
    vlibrasEscuro();
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
    var icone = el("span", { "aria-hidden": "true", "class": "a11y-icon" });
    // Icone de cadeira de rodas em SVG (traço), no lugar do emoji
    icone.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" focusable="false"><circle cx="10" cy="4.2" r="1.7" fill="currentColor" stroke="none"/><path d="M10 7.5V13h5.2l2.8 5.5"/><path d="M10 10.2h4.2"/><path d="M7.6 12.6a4.9 4.9 0 1 0 6.9 6.2"/></svg>';
    toggle.appendChild(icone);
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
  // O VLibras novo desenha o painel e o avatar dentro de um shadow DOM (#vlibras-app-root), fora do [vw].
  // No modo escuro a página inteira é invertida por filtro, então o painel precisa de uma segunda inversão
  // (aplicada em cada filho do shadow DOM; no host não serve, porque ele prende o painel ao fim da página).
  function vlibrasEscuro() {
    var host = document.getElementById("vlibras-app-root");
    var sr = host && host.shadowRoot;
    if (!sr) return;
    var escuro = root.classList.contains("a11y-dark");
    Array.prototype.forEach.call(sr.children, function (c) {
      if (c.tagName === "STYLE") return;
      c.style.filter = escuro ? "invert(1) hue-rotate(180deg)" : "";
    });
  }
  function vigiarVlibras() {
    var tentativas = 0;
    var timer = window.setInterval(function () {
      var host = document.getElementById("vlibras-app-root");
      var sr = host && host.shadowRoot;
      if (sr && window.MutationObserver) {
        window.clearInterval(timer);
        new MutationObserver(vlibrasEscuro).observe(sr, { childList: true });
        vlibrasEscuro();
      } else if (++tentativas > 120) window.clearInterval(timer);
    }, 500);
  }

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
    s.onload = function () { try { new window.VLibras.Widget("https://vlibras.gov.br/app"); vigiarVlibras(); } catch (e) { /* VLibras indisponível */ } };
    s.onerror = function () { /* sem rede: a página segue funcionando */ };
    document.head.appendChild(s);
  }

  /* ---------- Melhorias automáticas (idempotentes): tabelas, landmarks, autocomplete ---------- */
  function setAttr(node, name, value) { if (node.getAttribute(name) !== value) node.setAttribute(name, value); }
  function labelText(input) {
    var l = input.closest("label, .field");
    return l ? (l.textContent || "") : "";
  }
  function enhance() {
    // Tabelas: legenda (só leitor de tela) e escopo dos cabeçalhos
    Array.prototype.forEach.call(document.querySelectorAll("table"), function (tb) {
      var cap = tb.querySelector("caption");
      if (!cap) {
        var box = tb.closest("section, article, .card");
        var h = (box && box.querySelector("h2, h3")) || document.querySelector("h1");
        cap = document.createElement("caption");
        cap.className = "a11y-sr-only";
        cap.textContent = tb.getAttribute("aria-label") || (h && h.textContent.trim()) || "Tabela de dados";
        tb.insertBefore(cap, tb.firstChild);
      }
      Array.prototype.forEach.call(tb.querySelectorAll("th"), function (th) {
        if (!th.hasAttribute("scope")) th.setAttribute("scope", th.closest("thead") || th.parentElement === tb.rows[0] ? "col" : "row");
      });
      var wrap = tb.closest(".table-wrap");
      if (wrap && wrap.scrollWidth > wrap.clientWidth) {
        setAttr(wrap, "tabindex", "0"); setAttr(wrap, "role", "region"); setAttr(wrap, "aria-label", cap.textContent);
      }
    });
    // Landmarks com nome e página atual no menu
    Array.prototype.forEach.call(document.querySelectorAll("nav:not([aria-label]):not([aria-labelledby])"), function (n) { n.setAttribute("aria-label", n.classList.contains("side-nav") ? "Menu principal" : "Navegação"); });
    Array.prototype.forEach.call(document.querySelectorAll("aside:not([aria-label]):not([aria-labelledby])"), function (a) { a.setAttribute("aria-label", "Barra lateral"); });
    Array.prototype.forEach.call(document.querySelectorAll("nav a.active"), function (a) { setAttr(a, "aria-current", "page"); });
    // Autocomplete (WCAG 1.3.5)
    Array.prototype.forEach.call(document.querySelectorAll("input:not([autocomplete])"), function (i) {
      var login = i.form && i.form.classList.contains("js-login-form"), ac = null;
      if (i.type === "email") ac = login ? "username" : "email";
      else if (i.type === "password") ac = login || /atual/i.test(labelText(i)) ? "current-password" : "new-password";
      else if (i.type === "tel") ac = "tel";
      else if (i.dataset.fieldKey === "nome") ac = /empresa|usina/.test((i.form && i.form.dataset.accountType) || "") ? "organization" : "name";
      else if (i.dataset.fieldKey === "cargo") ac = "organization-title";
      if (ac) i.setAttribute("autocomplete", ac);
    });
  }

  /* ---------- Modais: foco entra, fica preso, ESC fecha e o foco volta ao botão que abriu ---------- */
  var tracked = [];  // [{ backdrop, opener }]
  var pendingOpener = null;
  document.addEventListener("click", function (e) { pendingOpener = (e.target.closest && e.target.closest("button, a, [role='button']")) || null; }, true);
  function visibleBackdrops() {
    return Array.prototype.filter.call(document.querySelectorAll(".modal-backdrop"), function (b) { return !b.hidden && getComputedStyle(b).display !== "none"; });
  }
  function focusablesIn(root) {
    return Array.prototype.filter.call(root.querySelectorAll("button, [href], input:not([type='hidden']), select, textarea, [tabindex]:not([tabindex='-1'])"), function (n) { return !n.disabled && !n.hidden && n.offsetParent !== null; });
  }
  function closeButton(b) { return b.querySelector(".modal-close, [data-m-close], .js-action-modal-close, button[aria-label='Fechar']"); }
  function syncModals() {
    var vis = visibleBackdrops();
    vis.forEach(function (b) {
      if (tracked.some(function (t) { return t.backdrop === b; })) return;
      tracked.push({ backdrop: b, opener: pendingOpener || document.activeElement });
      var dlg = b.querySelector("[role='dialog']") || b;
      if (!dlg.getAttribute("aria-label") && !dlg.getAttribute("aria-labelledby")) { var h = dlg.querySelector("h1, h2, h3"); if (h) dlg.setAttribute("aria-label", h.textContent.trim()); }
      setAttr(dlg, "aria-modal", "true");
      dlg.setAttribute("tabindex", "-1");
      var f = focusablesIn(dlg).filter(function (n) { return n !== closeButton(b); });
      (f[0] || closeButton(b) || dlg).focus();
    });
    tracked = tracked.filter(function (t) {
      if (vis.indexOf(t.backdrop) >= 0) return true;
      if (t.opener && document.contains(t.opener) && t.opener.focus) t.opener.focus();
      return false;
    });
  }
  document.addEventListener("keydown", function (e) {
    if (!tracked.length || (panel && !panel.hidden)) return;
    var top = tracked[tracked.length - 1].backdrop;
    if (e.key === "Escape") {
      e.preventDefault();
      var c = closeButton(top);
      if (c) c.click(); else top.hidden = true;
      return;
    }
    if (e.key === "Tab") {
      var dlg = top.querySelector("[role='dialog']") || top, f = focusablesIn(dlg);
      if (!f.length) { e.preventDefault(); dlg.focus(); return; }
      if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === dlg)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      else if (!dlg.contains(document.activeElement)) { e.preventDefault(); f[0].focus(); }
    }
  }, true);
  var pending = false;
  function schedule() { if (pending) return; pending = true; window.requestAnimationFrame(function () { pending = false; enhance(); syncModals(); }); }
  function observe() {
    if (!window.MutationObserver) return;
    new MutationObserver(schedule).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["hidden", "class", "style"] });
    window.addEventListener("resize", schedule);
  }

  function init() { skipLink(); build(); vlibras(); apply(); enhance(); syncModals(); observe(); }
  apply();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
