// Utilitarios compartilhados pelas paginas da pessoa fisica (window.PF).
(function () {
  const api = () => window.UsinaLinkApi;

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  }

  function money(value) {
    const n = Number(value);
    return Number.isFinite(n) && value !== null && value !== undefined && value !== ""
      ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "Sob consulta";
  }

  function date(value) {
    return value ? new Date(value).toLocaleDateString("pt-BR") : "-";
  }

  function dateTime(value) {
    return value ? new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "-";
  }

  function toast(message) {
    if (typeof window.showToast === "function") window.showToast(message);
  }

  // ---- status das compras de pecas do catalogo ----
  const STATUS = {
    registrada: { rotulo: "Aguardando a usina", classe: "warning" },
    aceita: { rotulo: "Aceita - pague para continuar", classe: "info" },
    paga: { rotulo: "Paga", classe: "success" },
    em_separacao: { rotulo: "Em separação", classe: "info" },
    enviada: { rotulo: "Enviada", classe: "info" },
    entregue: { rotulo: "Entregue", classe: "success" },
    recusada: { rotulo: "Recusada pela usina", classe: "muted" },
    cancelada: { rotulo: "Cancelada", classe: "muted" },
  };
  const FINALIZADOS = ["entregue", "recusada", "cancelada"];

  function statusBadge(status) {
    const s = STATUS[status] || { rotulo: status || "-", classe: "info" };
    return `<span class="badge ${s.classe}">${esc(s.rotulo)}</span>`;
  }

  function stars(nota) {
    const n = Math.round(Number(nota) || 0);
    return `<span class="rating-stars" aria-label="${n} de 5 estrelas">${[1, 2, 3, 4, 5].map((i) => `<span class="${i <= n ? "filled" : ""}">★</span>`).join("")}</span>`;
  }

  function emptyState(titulo, texto) {
    return `<div class="empty-state"><strong>${esc(titulo)}</strong><span>${esc(texto)}</span></div>`;
  }

  // ---- favoritos ----
  const favoritos = { chaves: null, carregando: null };

  function carregarFavoritos() {
    if (!favoritos.carregando) {
      favoritos.carregando = api().get("/favoritos")
        .then((rows) => { favoritos.chaves = new Set(rows.map((f) => `${f.tipo}:${f.idReferencia}`)); return rows; })
        .catch(() => { favoritos.chaves = new Set(); return []; });
    }
    return favoritos.carregando;
  }

  function pintarCoracoes(raiz = document) {
    raiz.querySelectorAll("[data-fav-tipo]").forEach((btn) => {
      const ativo = favoritos.chaves?.has(`${btn.dataset.favTipo}:${btn.dataset.favId}`);
      btn.classList.toggle("active", !!ativo);
      btn.setAttribute("aria-pressed", ativo ? "true" : "false");
      btn.textContent = ativo ? "♥" : "♡";
      btn.title = ativo ? "Remover dos favoritos" : "Adicionar aos favoritos";
    });
  }

  async function atualizarCoracoes(raiz = document) {
    await carregarFavoritos();
    pintarCoracoes(raiz);
  }

  function coracao(tipo, id) {
    return `<button class="fav-btn" type="button" data-fav-tipo="${esc(tipo)}" data-fav-id="${esc(id)}" aria-pressed="false" title="Adicionar aos favoritos">♡</button>`;
  }

  document.addEventListener("click", async (event) => {
    const btn = event.target.closest("[data-fav-tipo]");
    if (!btn) return;
    event.preventDefault();
    const { favTipo: tipo, favId: id } = btn.dataset;
    btn.disabled = true;
    try {
      await carregarFavoritos();
      const r = await api().post(`/favoritos/${tipo}/${id}`, {});
      const chave = `${tipo}:${id}`;
      if (r.favorito) favoritos.chaves.add(chave); else favoritos.chaves.delete(chave);
      pintarCoracoes();
      toast(r.favorito ? "Adicionado aos favoritos" : "Removido dos favoritos");
      document.dispatchEvent(new CustomEvent("pf:favorito", { detail: { tipo, id, favorito: r.favorito } }));
    } catch (error) {
      toast(error.message);
    } finally {
      btn.disabled = false;
    }
  });

  // ---- cards reutilizados em varias paginas ----
  function pecaCard(peca) {
    const fornecedor = peca.usina?.nomeFantasia || peca.usina?.razaoSocial || "Usina";
    const estoque = peca.estoque != null ? `${peca.estoque} ${peca.unidadeEstoque || "unidades"}` : "Sob consulta";
    return `<article class="card order-opportunity" data-search-row data-categoria="${esc(peca.categoria || "")}">
      ${peca.imagem ? `<img class="peca-foto" src="${esc(peca.imagem)}" alt="Foto de ${esc(peca.nome)}">` : ""}
      <div class="card-title-row"><h2>${esc(peca.nome)}</h2>${coracao("peca", peca.idPecaComercial)}</div>
      <p>${esc(peca.material || peca.categoria || "")}</p>
      <div class="quote-facts compact">
        <div><span>Estoque</span><strong>${esc(estoque)}</strong></div>
        <div><span>Prazo</span><strong>${esc(peca.prazoEntregaDias ? peca.prazoEntregaDias + " dias" : "A combinar")}</strong></div>
        <div><span>Valor unitário</span><strong>${esc(money(peca.valorUnitario))}</strong></div>
        <div><span>Fornecedor</span><strong><a class="text-link" href="usina-pessoa-fisica.html?id=${esc(peca.idUsina)}">${esc(fornecedor)}</a></strong></div>
      </div>
      <div class="card-actions"><a class="btn btn-primary" href="peca-pessoa-fisica.html?id=${esc(peca.idPecaComercial)}">Ver detalhes e comprar</a></div>
    </article>`;
  }

  function usinaCard(usina) {
    const local = [usina.cidade, usina.estado].filter(Boolean).join(" / ") || "Local não informado";
    const nota = usina.quantidadeAvaliacoes
      ? `${stars(usina.mediaAvaliacoes)} <small>${esc(usina.mediaAvaliacoes)} (${esc(usina.quantidadeAvaliacoes)})</small>`
      : "<small>Sem avaliações ainda</small>";
    return `<article class="card order-opportunity" data-search-row>
      <div class="card-title-row"><h2>${esc(usina.nome)}</h2>${coracao("usina", usina.idUsina)}</div>
      <p>${esc(usina.especialidade || "Usina parceira")}</p>
      <div class="quote-facts compact">
        <div><span>Localização</span><strong>${esc(local)}</strong></div>
        <div><span>Avaliação</span><strong>${nota}</strong></div>
        <div><span>Peças no catálogo</span><strong>${esc(usina.quantidadePecas)}</strong></div>
        <div><span>Prazo médio</span><strong>${esc(usina.prazoMedio || "A combinar")}</strong></div>
      </div>
      <div class="card-actions"><a class="btn btn-primary" href="usina-pessoa-fisica.html?id=${esc(usina.idUsina)}">Ver usina</a></div>
    </article>`;
  }

  // ---- modal e confirmacao ----
  function modal({ kicker = "", title = "", body = "" }) {
    let el = document.querySelector("#pf-modal");
    if (!el) {
      el = document.createElement("div");
      el.id = "pf-modal";
      el.className = "modal-backdrop";
      el.hidden = true;
      el.innerHTML = '<section class="card modal-card" role="dialog" aria-modal="true"><div class="modal-header"><div><span class="eyebrow" data-m-kicker></span><h2 data-m-title></h2></div><button class="modal-close" type="button" data-m-close aria-label="Fechar">x</button></div><div data-m-body></div></section>';
      document.body.appendChild(el);
      el.addEventListener("click", (event) => { if (event.target === el || event.target.closest("[data-m-close]")) el.hidden = true; });
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") el.hidden = true; });
    }
    el.querySelector("[data-m-kicker]").textContent = kicker;
    el.querySelector("[data-m-title]").textContent = title;
    el.querySelector("[data-m-body]").innerHTML = body;
    el.hidden = false;
    return el;
  }

  function fecharModal() {
    const el = document.querySelector("#pf-modal");
    if (el) el.hidden = true;
  }

  /** Pede confirmacao; so executa onConfirm se o usuario confirmar. Cancelar nao faz nada. */
  function confirmar({ title, message, confirmText = "Confirmar", cancelText = "Cancelar", onConfirm }) {
    const el = modal({
      kicker: "Confirmação",
      title,
      body: `<p class="modal-copy">${esc(message)}</p><div class="form-actions"><button class="btn btn-ghost" type="button" data-m-close>${esc(cancelText)}</button><button class="btn btn-primary" type="button" data-m-confirm>${esc(confirmText)}</button></div>`,
    });
    const botao = el.querySelector("[data-m-confirm]");
    botao.addEventListener("click", async () => {
      botao.disabled = true;
      try { await onConfirm(); fecharModal(); } catch (error) { toast(error.message); botao.disabled = false; }
    });
  }

  function notaSelect(name, rotulo) {
    return `<label class="field"><span>${rotulo}</span><div class="input-wrap select-field"><span class="input-symbol">★</span><select name="${name}" required><option value="">Nota</option><option value="5">5 - Excelente</option><option value="4">4 - Bom</option><option value="3">3 - Regular</option><option value="2">2 - Ruim</option><option value="1">1 - Crítico</option></select></div></label>`;
  }

  /** Abre o formulario de avaliacao. alvo = { solicitacaoComercialId } ou { pedidoId }. */
  function avaliar({ alvo, titulo, aoConcluir }) {
    const el = modal({
      kicker: "Avaliação",
      title: titulo || "Avaliar entrega",
      body: `<form class="form-grid" data-form-avaliacao>
        ${notaSelect("notaGeral", "Nota geral")}${notaSelect("qualidade", "Qualidade")}${notaSelect("prazo", "Prazo")}${notaSelect("comunicacao", "Comunicação")}
        <label class="field span-2"><span>Comentário</span><textarea name="comentario" rows="3" placeholder="Conte como foi a sua experiência (opcional)"></textarea></label>
        <div class="form-actions span-2"><button class="btn btn-ghost" type="button" data-m-close>Cancelar</button><button class="btn btn-primary" type="submit">Enviar avaliação</button></div>
      </form>`,
    });
    const form = el.querySelector("[data-form-avaliacao]");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const dados = new FormData(form);
      const botao = form.querySelector('button[type="submit"]');
      botao.disabled = true;
      try {
        await api().post("/avaliacoes", {
          ...alvo,
          notaGeral: Number(dados.get("notaGeral")),
          qualidade: Number(dados.get("qualidade")),
          prazo: Number(dados.get("prazo")),
          comunicacao: Number(dados.get("comunicacao")),
          comentario: String(dados.get("comentario") || "").trim() || undefined,
        });
        fecharModal();
        toast("Avaliação enviada. Obrigado!");
        if (aoConcluir) aoConcluir();
      } catch (error) {
        toast(error.message);
        botao.disabled = false;
      }
    });
  }

  function parametro(nome) {
    return new URLSearchParams(window.location.search).get(nome);
  }

  window.PF = {
    api, esc, money, date, dateTime, toast, STATUS, FINALIZADOS, statusBadge, stars, emptyState,
    favoritos: { carregar: carregarFavoritos, pintar: atualizarCoracoes, coracao },
    pecaCard, usinaCard, parametro, modal, fecharModal, confirmar, avaliar,
  };
}());
