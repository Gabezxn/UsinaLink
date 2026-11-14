(function () {
  const esc = (v) => (window.SafeHtml ? window.SafeHtml.escape(v) : String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])));
  const ui = window.UsinaLinkUi || {};

  function session() {
    try {
      const raw = JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null") || {};
      return { empresaId: raw.empresaId, usinaId: raw.usinaId, tipo: raw.tipo };
    } catch {
      return {};
    }
  }

  async function apiGet(path) {
    if (window.UsinaLinkApi) return window.UsinaLinkApi.get(path);
    throw new Error("Cliente da API nao carregado.");
  }

  async function apiPost(path, body) {
    if (window.UsinaLinkApi) return window.UsinaLinkApi.post(path, body);
    throw new Error("Cliente da API nao carregado.");
  }

  async function apiPatch(path, body) {
    if (window.UsinaLinkApi?.patch) return window.UsinaLinkApi.patch(path, body);
    throw new Error("Cliente da API nao carregado.");
  }

  function notify(message, type = "info") {
    if (ui.showFeedback) ui.showFeedback(message, type);
    else if (window.showToast) window.showToast(message);
  }

  // A API devolve nomes com prefixo (idPedido, idUsina...); estas telas foram escritas
  // esperando nomes genericos (pedidoId, usinaId...). As funcoes abaixo fazem essa ponte.
  function normalizeReview(review) {
    return { ...review, id: review.idAvaliacao, pedidoId: review.idPedido, notaGeral: review.nota, compraId: review.idSolicitacaoComercial };
  }

  function normalizeOrder(order) {
    return { ...order, id: order.idPedido, empresaId: order.idEmpresaCompradora, peca: order.itens?.[0]?.nome || "" };
  }

  function normalizeProposal(proposal) {
    return {
      ...proposal,
      id: proposal.idProposta,
      pedidoId: proposal.idPedido,
      usinaId: proposal.idUsina,
      usina: proposal.usina?.nomeFantasia || proposal.usina?.razaoSocial || proposal.idUsina,
      peca: proposal.pedido?.itens?.[0]?.nome || "",
    };
  }

  function normalizeRequest(request) {
    return { ...request, id: request.idSolicitacao, usinaId: request.idUsina, pedidoId: request.idPedido };
  }

  function stars(value) {
    const note = Number(value || 0);
    return `<span class="rating-stars" aria-label="${note} de 5 estrelas">${[1, 2, 3, 4, 5].map(item => `<span class="${item <= note ? "filled" : ""}">★</span>`).join("")}</span>`;
  }

  function ratingField(name, label) {
    return `
      <label class="field">${label}
        <span class="input-wrap select-field">
          <select name="${name}" required>
            <option value="">Nota</option>
            <option value="5">5 - Excelente</option>
            <option value="4">4 - Bom</option>
            <option value="3">3 - Regular</option>
            <option value="2">2 - Ruim</option>
            <option value="1">1 - Critico</option>
          </select>
        </span>
      </label>`;
  }

  function renderReviewCard(review, canReply = false) {
    return `
      <article class="card review-card" data-review-id="${esc(review.id)}">
        <div class="review-head">
          <div><strong>${esc(review.compraId ? "Compra de peça #" + review.compraId : "Pedido " + review.pedidoId)}</strong><span>${new Date(review.criadoEm).toLocaleDateString("pt-BR")}</span></div>
          ${stars(review.notaGeral)}
        </div>
        <div class="review-metrics">
          <span>Qualidade ${stars(review.qualidade)}</span>
          <span>Prazo ${stars(review.prazo)}</span>
          <span>Comunicacao ${stars(review.comunicacao)}</span>
        </div>
        <p>${esc(review.comentario || "Sem comentario.")}</p>
        ${review.respostaDaUsina ? `<div class="review-reply"><strong>Resposta da usina</strong><span>${esc(review.respostaDaUsina)}</span></div>` : ""}
        ${canReply ? `<form class="review-reply-form" ${review.respostaDaUsina ? "hidden" : ""}><label class="field">${review.respostaDaUsina ? "Editar resposta" : "Responder avaliacao"}<span class="input-wrap"><input name="respostaDaUsina" type="text" minlength="3" required placeholder="Escreva uma resposta profissional" value="${esc(review.respostaDaUsina || "")}"></span></label><button class="btn btn-small" type="submit">${review.respostaDaUsina ? "Salvar resposta" : "Responder"}</button></form>${review.respostaDaUsina ? `<button class="btn btn-ghost btn-small" type="button" data-editar-resposta>Editar resposta</button>` : ""}` : ""}
      </article>`;
  }

  async function loadCompanyReviews() {
    const root = document.querySelector("[data-company-reviews]");
    if (!root) return;
    const form = document.querySelector("[data-review-form]");
    const select = document.querySelector("[data-review-order]");
    const list = document.querySelector("[data-review-list]");
    const state = session();
    if (!state.empresaId) { root.innerHTML = '<div class="empty-state"><strong>Faca login como empresa</strong><span>Entre com uma conta de empresa para ver e enviar avaliacoes.</span></div>'; return; }

    try {
      root.dataset.state = "loading";
      const [reviewsRaw, ordersRaw, proposalsRaw] = await Promise.all([
        apiGet(`/avaliacoes/empresa/${encodeURIComponent(state.empresaId)}`),
        apiGet("/pedidos/meus"),
        apiGet("/propostas/recebidas")
      ]);
      const reviews = reviewsRaw.map(normalizeReview);
      const orders = ordersRaw.map(normalizeOrder);
      const proposals = proposalsRaw.map(normalizeProposal);
      const reviewed = new Set(reviews.map(item => item.pedidoId));
      const STATUS_AVALIAVEIS = ["concluido", "concluida", "em_negociacao"];
      const available = orders.filter(order => STATUS_AVALIAVEIS.includes(order.status) && proposals.some(proposal => proposal.pedidoId === order.id && proposal.status === "aceita") && !reviewed.has(order.id));
      if (select) {
        select.innerHTML = available.length
          ? `<option value="">Selecione um pedido concluido</option>${available.map(order => `<option value="${esc(order.id)}">${esc(order.id)} - ${esc(order.peca)}</option>`).join("")}`
          : '<option value="">Nenhum pedido concluido disponivel</option>';
      }
      if (list) {
        list.innerHTML = reviews.length ? reviews.map(review => renderReviewCard(review)).join("") : '<div class="empty-state"><strong>Nenhuma avaliacao enviada</strong><span>Pedidos concluidos e ainda nao avaliados aparecem no formulario.</span></div>';
      }
      if (form) form.hidden = !available.length;
      root.dataset.state = "ready";
    } catch (error) {
      root.innerHTML = `<div class="empty-state"><strong>Falha ao carregar avaliacoes</strong><span>${esc(error.message)}</span></div>`;
    }
  }

  function bindCompanyReviewForm() {
    const form = document.querySelector("[data-review-form]");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      button.textContent = "Enviando...";
      try {
        await apiPost("/avaliacoes", {
          pedidoId: data.get("pedidoId"),
          notaGeral: Number(data.get("notaGeral")),
          qualidade: Number(data.get("qualidade")),
          prazo: Number(data.get("prazo")),
          comunicacao: Number(data.get("comunicacao")),
          comentario: data.get("comentario")
        });
        notify("Avaliacao enviada com sucesso.", "success");
        form.reset();
        await loadCompanyReviews();
      } catch (error) {
        notify(error.message, "error");
      } finally {
        button.disabled = false;
        button.textContent = "Enviar avaliacao";
      }
    });
  }

  async function loadPlantReviews() {
    const root = document.querySelector("[data-plant-reviews]");
    if (!root) return;
    const state = session();
    if (!state.usinaId) { root.innerHTML = '<div class="empty-state"><strong>Faca login como usina</strong><span>Entre com uma conta de usina para ver as avaliacoes recebidas.</span></div>'; return; }
    const usinaId = state.usinaId;
    try {
      const [summary, reviewsRaw] = await Promise.all([
        apiGet(`/avaliacoes/usina/${encodeURIComponent(usinaId)}/resumo`),
        apiGet(`/avaliacoes/usina/${encodeURIComponent(usinaId)}`)
      ]);
      const reviews = reviewsRaw.map(normalizeReview);
      document.querySelector("[data-review-average]").textContent = summary.mediaGeral || "0";
      document.querySelector("[data-review-count]").textContent = summary.quantidade || "0";
      document.querySelector("[data-review-quality]").textContent = summary.mediaQualidade || "0";
      document.querySelector("[data-review-deadline]").textContent = summary.mediaPrazo || "0";
      document.querySelector("[data-review-communication]").textContent = summary.mediaComunicacao || "0";
      root.innerHTML = reviews.length ? reviews.map(review => renderReviewCard(review, true)).join("") : '<div class="empty-state"><strong>Nenhuma avaliacao recebida</strong><span>As avaliacoes dos pedidos concluidos aparecem aqui.</span></div>';
      root.querySelectorAll("[data-editar-resposta]").forEach(botao => botao.addEventListener("click", () => {
        const card = botao.closest("[data-review-id]");
        card.querySelector(".review-reply-form").hidden = false;
        botao.hidden = true;
        card.querySelector(".review-reply-form input").focus();
      }));
      root.querySelectorAll(".review-reply-form").forEach(form => {
        form.addEventListener("submit", async (event) => {
          event.preventDefault();
          const card = form.closest("[data-review-id]");
          const data = new FormData(form);
          await apiPost(`/avaliacoes/${card.dataset.reviewId}/resposta`, { respostaDaUsina: data.get("respostaDaUsina") });
          notify("Resposta salva.", "success");
          await loadPlantReviews();
        });
      });
    } catch (error) {
      root.innerHTML = `<div class="empty-state"><strong>Falha ao carregar avaliacoes</strong><span>${esc(error.message)}</span></div>`;
    }
  }

  async function loadBlockRequests() {
    const root = document.querySelector("[data-block-requests]");
    if (!root) return;
    const state = session();
    const form = document.querySelector("[data-block-form]");
    if (!state.empresaId) { root.innerHTML = '<div class="empty-state"><strong>Faca login como empresa</strong><span>Entre com uma conta de empresa para ver suas solicitacoes.</span></div>'; return; }
    try {
      const [requestsRaw, proposalsRaw] = await Promise.all([
        apiGet(`/solicitacoes-bloqueio-usina/minhas`),
        apiGet(`/propostas/recebidas`)
      ]);
      const requests = requestsRaw.map(normalizeRequest);
      const proposals = proposalsRaw.map(normalizeProposal);
      const usinas = [...new Map(proposals.map(proposal => [proposal.usinaId, proposal])).values()];
      const usinaSelect = document.querySelector("[data-block-usina]");
      const pedidoSelect = document.querySelector("[data-block-pedido]");
      if (usinaSelect) usinaSelect.innerHTML = usinas.length ? usinas.map(item => `<option value="${esc(item.usinaId)}">${esc(item.usina || item.usinaId)}</option>`).join("") : '<option value="">Nenhuma usina disponivel</option>';
      if (pedidoSelect) pedidoSelect.innerHTML = proposals.map(item => `<option value="${esc(item.pedidoId)}">${esc(item.pedidoId)} - ${esc(item.peca)}</option>`).join("");
      root.innerHTML = requests.length ? requests.map(request => `
        <article class="card block-request-card">
          <div><strong>${esc(request.motivo)}</strong><span>${esc(request.usinaId)} / ${esc(request.pedidoId || "Sem pedido vinculado")}</span></div>
          ${ui.statusBadge ? ui.statusBadge(request.status) : `<span class="badge">${esc(request.status)}</span>`}
          <p>${esc(request.descricao)}</p>
          ${request.status === "pendente" ? `<button class="table-action" type="button" data-cancel-block="${esc(request.id)}">Cancelar solicitacao</button>` : ""}
        </article>`).join("") : '<div class="empty-state"><strong>Nenhuma solicitacao aberta</strong><span>Use o formulario para enviar uma solicitacao de moderacao.</span></div>';
      root.querySelectorAll("[data-cancel-block]").forEach(button => button.addEventListener("click", async () => {
        await apiPatch(`/solicitacoes-bloqueio-usina/${button.dataset.cancelBlock}/cancelar`, {});
        notify("Solicitacao cancelada.", "success");
        await loadBlockRequests();
      }));
      if (form) form.hidden = false;
    } catch (error) {
      root.innerHTML = `<div class="empty-state"><strong>Falha ao carregar solicitacoes</strong><span>${esc(error.message)}</span></div>`;
    }
  }

  function bindBlockForm() {
    const form = document.querySelector("[data-block-form]");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const button = form.querySelector("button[type='submit']");
      button.disabled = true;
      button.textContent = "Enviando...";
      try {
        await apiPost("/solicitacoes-bloqueio-usina", {
          usinaId: data.get("usinaId"),
          pedidoId: data.get("pedidoId") || undefined,
          motivo: data.get("motivo"),
          descricao: data.get("descricao")
        });
        notify("Solicitacao enviada para moderacao.", "success");
        form.reset();
        await loadBlockRequests();
      } catch (error) {
        notify(error.message, "error");
      } finally {
        button.disabled = false;
        button.textContent = "Enviar solicitacao";
      }
    });
  }

  loadCompanyReviews();
  bindCompanyReviewForm();
  loadPlantReviews();
  loadBlockRequests();
  bindBlockForm();
}());
