(function () {
  const { api, esc, date, stars, pecaCard, emptyState, favoritos, parametro } = window.PF;
  const conteudo = document.querySelector("[data-usina-conteudo]");
  const id = Number(parametro("id"));

  function avaliacaoCard(a) {
    return `<article class="card review-card">
      <div class="review-head"><div><strong>Compra verificada</strong><span>${esc(date(a.criadoEm))}</span></div>${stars(a.nota)}</div>
      <div class="review-metrics"><span>Qualidade ${stars(a.qualidade)}</span><span>Prazo ${stars(a.prazo)}</span><span>Comunicação ${stars(a.comunicacao)}</span></div>
      <p>${esc(a.comentario || "Sem comentário.")}</p>
      ${a.respostaDaUsina ? `<div class="review-reply"><strong>Resposta da usina</strong><span>${esc(a.respostaDaUsina)}</span></div>` : ""}
    </article>`;
  }

  function render(u) {
    const local = [u.cidade, u.estado].filter(Boolean).join(" / ");
    document.querySelector("[data-usina-titulo]").textContent = u.nome;
    document.querySelector("[data-usina-subtitulo]").textContent = [u.especialidade, local].filter(Boolean).join(" · ") || "Usina parceira";
    document.querySelector("[data-usina-fav]").innerHTML = favoritos.coracao("usina", u.idUsina);
    const certificacoes = (u.certificacoes || []).length ? u.certificacoes.map((c) => `<span class="badge info">${esc(c)}</span>`).join(" ") : "-";

    conteudo.innerHTML = `
      <section class="detail-layout">
        <article class="card detail-card">
          <h2>Sobre a usina</h2>
          <p>${esc(u.descricao || "A usina ainda não preencheu a apresentação.")}</p>
          <div class="action-modal-grid">
            <div><span>Especialidade</span><strong>${esc(u.especialidade || "-")}</strong></div>
            <div><span>Localização</span><strong>${esc(local || "-")}</strong></div>
            <div><span>Capacidade mensal</span><strong>${esc(u.capacidadeMensal || "-")}</strong></div>
            <div><span>Prazo médio</span><strong>${esc(u.prazoMedio || "-")}</strong></div>
            <div><span>Turnos</span><strong>${esc(u.turnos || "-")}</strong></div>
            <div><span>Máquinas</span><strong>${esc(u.maquinasDisponiveis || "-")}</strong></div>
            <div><span>Certificações</span><strong>${certificacoes}</strong></div>
            <div><span>Contato</span><strong>${esc([u.email, u.telefone].filter(Boolean).join(" / ") || "-")}</strong></div>
          </div>
        </article>
        <article class="card detail-card">
          <h2>Avaliação geral</h2>
          ${u.quantidadeAvaliacoes
            ? `<p class="rating-score">${esc(u.mediaAvaliacoes)}</p>${stars(u.mediaAvaliacoes)}<p>${esc(u.quantidadeAvaliacoes)} avaliação(ões) de compradores</p>`
            : "<p>Esta usina ainda não recebeu avaliações.</p>"}
        </article>
      </section>

      <section class="card table-card" data-search-scope>
        <div class="table-toolbar"><div><h2>Peças desta usina</h2><p>${esc(u.pecas.length)} peça(s) no catálogo.</p></div></div>
        <div class="order-card-grid">${u.pecas.length ? u.pecas.map((p) => pecaCard({ ...p, usina: { nomeFantasia: u.nome } })).join("") : emptyState("Sem peças no catálogo", "Esta usina ainda não cadastrou peças comerciais.")}</div>
      </section>

      <section class="card table-card">
        <div class="table-toolbar"><div><h2>Avaliações de compradores</h2></div></div>
        <div class="review-list" style="padding: 0 22px 22px;">${u.avaliacoes.length ? u.avaliacoes.map(avaliacaoCard).join("") : emptyState("Sem avaliações", "Seja o primeiro a comprar e avaliar.")}</div>
      </section>`;
    favoritos.pintar(document);
  }

  (async function () {
    if (!id) { conteudo.innerHTML = emptyState("Usina não informada", "Volte à lista de usinas."); return; }
    try {
      render(await api().get(`/usinas/diretorio/${id}`));
    } catch (error) {
      conteudo.innerHTML = emptyState("Usina não encontrada", error.message);
    }
  }());
}());
