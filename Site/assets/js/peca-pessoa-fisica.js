(function () {
  const { api, esc, money, toast, coracao, favoritos, emptyState, parametro } = Object.assign({}, window.PF, { coracao: window.PF.favoritos.coracao });
  const conteudo = document.querySelector("[data-peca-conteudo]");
  const id = Number(parametro("id"));

  function render(peca) {
    const fornecedor = peca.usina?.nomeFantasia || peca.usina?.razaoSocial || "Usina";
    const estoque = peca.estoque != null ? `${peca.estoque} ${peca.unidadeEstoque || "unidades"}` : "Sob consulta";
    const temValor = peca.valorUnitario != null;
    document.querySelector("[data-peca-titulo]").textContent = peca.nome;
    document.querySelector("[data-peca-subtitulo]").textContent = [peca.categoria, peca.material].filter(Boolean).join(" · ") || "Peça comercial";
    document.querySelector("[data-peca-fav]").innerHTML = coracao("peca", peca.idPecaComercial);

    conteudo.innerHTML = `
      <section class="detail-layout">
        <article class="card detail-card">
          <h2>Sobre a peça</h2>
          <p>${esc(peca.descricao || "O fornecedor não informou uma descrição detalhada.")}</p>
          <div class="action-modal-grid">
            <div><span>Material</span><strong>${esc(peca.material || "-")}</strong></div>
            <div><span>Categoria</span><strong>${esc(peca.categoria || "-")}</strong></div>
            <div><span>Estoque</span><strong>${esc(estoque)}</strong></div>
            <div><span>Prazo de entrega</span><strong>${esc(peca.prazoEntregaDias ? peca.prazoEntregaDias + " dias" : "A combinar")}</strong></div>
            <div><span>Valor unitário</span><strong>${esc(money(peca.valorUnitario))}</strong></div>
            <div><span>Fornecedor</span><strong><a class="text-link" href="usina-pessoa-fisica.html?id=${esc(peca.idUsina)}">${esc(fornecedor)}</a></strong></div>
          </div>
        </article>
        <article class="card detail-card">
          <h2>Solicitar compra</h2>
          <form class="form" data-form-compra novalidate>
            <label class="field"><span>Quantidade</span><div class="input-wrap"><span class="input-symbol">#</span><input name="quantidade" type="number" min="1" ${peca.estoque != null ? `max="${esc(peca.estoque)}"` : ""} value="1" required></div></label>
            <div class="action-modal-grid">
              <div><span>Total estimado</span><strong data-total>${esc(temValor ? money(peca.valorUnitario) : "Sob consulta")}</strong></div>
              <div><span>Pagamento</span><strong>Depois que a usina aceitar</strong></div>
            </div>
            <p class="modal-copy">A usina analisa o seu pedido e, ao aceitar, você faz o pagamento e acompanha tudo em <strong>Minhas compras</strong>.</p>
            <button class="btn btn-primary full" type="submit">Solicitar compra</button>
          </form>
        </article>
      </section>`;
    favoritos.pintar(document);

    const form = conteudo.querySelector("[data-form-compra]");
    const entrada = form.elements.quantidade;
    entrada.addEventListener("input", () => {
      const q = Number(entrada.value) || 0;
      conteudo.querySelector("[data-total]").textContent = temValor ? money(q * Number(peca.valorUnitario)) : "Sob consulta";
    });
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const quantidade = Number(entrada.value);
      if (!Number.isInteger(quantidade) || quantidade < 1) { toast("Informe uma quantidade inteira maior que zero."); return; }
      if (peca.estoque != null && quantidade > Number(peca.estoque)) { toast(`Só há ${peca.estoque} em estoque.`); return; }
      const botao = form.querySelector('button[type="submit"]');
      botao.disabled = true;
      botao.textContent = "Enviando...";
      try {
        const compra = await api().post("/solicitacoes-comerciais", { pecaId: String(peca.idPecaComercial), peca: peca.nome, quantidade: String(quantidade) });
        toast("Solicitação enviada à usina.");
        window.setTimeout(() => { window.location.href = `compra-pessoa-fisica.html?id=${compra.idSolicitacaoComercial}`; }, 600);
      } catch (error) {
        toast(error.message);
        botao.disabled = false;
        botao.textContent = "Solicitar compra";
      }
    });
  }

  (async function () {
    if (!id) { conteudo.innerHTML = emptyState("Peça não informada", "Volte ao catálogo e escolha uma peça."); return; }
    try {
      const pecas = await api().get("/pecas-comerciais");
      const peca = pecas.find((p) => p.idPecaComercial === id);
      if (!peca) { conteudo.innerHTML = emptyState("Peça não encontrada", "Ela pode ter sido removida do catálogo."); return; }
      render(peca);
    } catch (error) {
      conteudo.innerHTML = emptyState("Falha ao carregar", error.message);
    }
  }());
}());
