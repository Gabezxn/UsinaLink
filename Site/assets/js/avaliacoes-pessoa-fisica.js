(function () {
  const { api, esc, date, stars, emptyState, avaliar } = window.PF;
  const pendentesEl = document.querySelector("[data-pendentes]");
  const minhasEl = document.querySelector("[data-minhas-avaliacoes]");
  const valor = (r) => (r.status === "fulfilled" ? r.value : []);

  function cardAvaliacao(a, descricao) {
    return `<article class="card review-card">
      <div class="review-head"><div><strong>${esc(descricao)}</strong><span>${esc(date(a.criadoEm))}</span></div>${stars(a.nota)}</div>
      <div class="review-metrics"><span>Qualidade ${stars(a.qualidade)}</span><span>Prazo ${stars(a.prazo)}</span><span>Comunicação ${stars(a.comunicacao)}</span></div>
      <p>${esc(a.comentario || "Sem comentário.")}</p>
      ${a.respostaDaUsina ? `<div class="review-reply"><strong>Resposta da usina</strong><span>${esc(a.respostaDaUsina)}</span></div>` : ""}
    </article>`;
  }

  async function carregar() {
    const [compras, pedidos, avaliacoes, propostas] = (await Promise.allSettled([
      api().get("/solicitacoes-comerciais/minhas"),
      api().get("/pedidos/meus"),
      api().get("/avaliacoes/minhas"),
      api().get("/propostas/recebidas"),
    ])).map(valor);

    const pedidoAvaliado = new Set(avaliacoes.filter((a) => a.idPedido).map((a) => a.idPedido));
    const pendentes = [
      ...compras.filter((c) => c.status === "entregue" && !c.avaliacao).map((c) => ({
        titulo: `${c.quantidade}x ${c.peca}`, usina: c.usina?.nome || c.fornecedor, alvo: { solicitacaoComercialId: String(c.idSolicitacaoComercial) },
      })),
      ...pedidos.filter((p) => p.status === "concluido" && !pedidoAvaliado.has(p.idPedido)).map((p) => {
        const aceita = propostas.find((x) => x.idPedido === p.idPedido && x.status === "aceita");
        return { titulo: p.itens?.[0]?.nome || p.numeroPedido || `Pedido #${p.idPedido}`, usina: aceita?.usina?.nomeFantasia || aceita?.usina?.razaoSocial, alvo: { pedidoId: String(p.idPedido) } };
      }),
    ];

    pendentesEl.innerHTML = pendentes.length
      ? pendentes.map((p, i) => `<div class="pf-action-item"><span><strong>${esc(p.titulo)}</strong>${p.usina ? ` · ${esc(p.usina)}` : ""}</span><button class="btn btn-small btn-primary" type="button" data-avaliar="${i}">Avaliar</button></div>`).join("")
      : emptyState("Nada para avaliar", "Quando uma compra ou pedido for entregue, ele aparece aqui.");
    pendentesEl.querySelectorAll("[data-avaliar]").forEach((botao) => botao.addEventListener("click", () => {
      const p = pendentes[Number(botao.dataset.avaliar)];
      avaliar({ alvo: p.alvo, titulo: `Avaliar ${p.usina || "a usina"}`, aoConcluir: () => carregar().catch(() => {}) });
    }));

    const descricao = (a) => {
      if (a.idSolicitacaoComercial) {
        const c = compras.find((x) => x.idSolicitacaoComercial === a.idSolicitacaoComercial);
        return c ? `Compra: ${c.quantidade}x ${c.peca}` : "Compra de peça";
      }
      const p = pedidos.find((x) => x.idPedido === a.idPedido);
      return `Pedido: ${p?.itens?.[0]?.nome || "#" + a.idPedido}`;
    };
    minhasEl.innerHTML = avaliacoes.length
      ? avaliacoes.map((a) => cardAvaliacao(a, descricao(a))).join("")
      : emptyState("Você ainda não avaliou ninguém", "Suas avaliações aparecem aqui.");
  }

  carregar().catch((error) => { pendentesEl.innerHTML = emptyState("Falha ao carregar", error.message); });
}());
