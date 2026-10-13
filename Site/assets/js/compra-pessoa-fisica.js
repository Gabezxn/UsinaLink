(function () {
  const { api, esc, money, date, dateTime, toast, statusBadge, emptyState, parametro, modal, fecharModal, confirmar, avaliar } = window.PF;
  const conteudo = document.querySelector("[data-compra-conteudo]");
  const botoes = document.querySelector("[data-compra-botoes]");
  const id = Number(parametro("id"));

  const ETAPAS = [
    ["registrada", "Solicitação enviada"],
    ["aceita", "Aceita pela usina"],
    ["paga", "Pagamento confirmado"],
    ["em_separacao", "Em separação"],
    ["enviada", "Enviada"],
    ["entregue", "Entregue"],
  ];

  function comprador() {
    try { return JSON.parse(sessionStorage.getItem("usinalinkSession") || "null")?.nome || ""; } catch { return ""; }
  }

  function proximoPasso(c) {
    const usina = c.usina?.nome || c.fornecedor || "a usina";
    switch (c.status) {
      case "registrada": return `Aguardando ${usina} aceitar a sua solicitação. Você pode cancelar enquanto isso.`;
      case "aceita": return `${usina} aceitou! Pague ${c.total != null ? money(c.total) : "o valor combinado"} para ela começar a separar a peça.`;
      case "paga": return "Pagamento confirmado. A usina vai iniciar a separação em breve.";
      case "em_separacao": return "A usina está separando a sua peça.";
      case "enviada": return "Sua peça foi enviada. Quando ela chegar, clique em \"Confirmar entrega\".";
      case "entregue": return c.avaliacao ? "Compra concluída. Obrigado pela sua avaliação!" : "Entregue! Conte como foi: avalie a usina.";
      case "recusada": return `A usina recusou esta solicitação${c.observacaoUsina ? `: ${c.observacaoUsina}` : "."}`;
      case "cancelada": return "Esta compra foi cancelada.";
      default: return "";
    }
  }

  function linhaDoTempo(c) {
    const historico = c.historico || [];
    const quando = (status) => historico.find((h) => h.status === status)?.em;
    const itens = ETAPAS.map(([status, rotulo], i) => {
      const feito = !!quando(status);
      return `<li class="${feito ? "done" : ""}"><span>${i + 1}</span><strong>${rotulo}${feito ? `<small>${esc(dateTime(quando(status)))}</small>` : ""}</strong></li>`;
    });
    if (c.status === "recusada" || c.status === "cancelada") {
      itens.push(`<li class="cancelled"><span>X</span><strong>${c.status === "recusada" ? "Recusada pela usina" : "Compra cancelada"}<small>${esc(dateTime(quando(c.status)))}</small></strong></li>`);
    }
    return itens.join("");
  }

  function comprovante(c) {
    return `<section class="card" data-comprovante hidden>
      <div class="receipt-box">
        <span class="eyebrow">Comprovante de pagamento</span>
        <h2>${esc(c.protocoloPagamento || "-")}</h2>
        <div class="action-modal-grid">
          <div><span>Comprador</span><strong>${esc(comprador() || "-")}</strong></div>
          <div><span>Usina</span><strong>${esc(c.usina?.nome || c.fornecedor || "-")}</strong></div>
          <div><span>Peça</span><strong>${esc(c.quantidade)}x ${esc(c.peca)}</strong></div>
          <div><span>Valor pago</span><strong>${esc(money(c.total))}</strong></div>
          <div><span>Método</span><strong>${esc(c.metodoPagamento || "-")}</strong></div>
          <div><span>Data</span><strong>${esc(dateTime(c.dataPagamento))}</strong></div>
        </div>
        <small>Pagamento simulado para demonstração do UsinaLink.</small>
        <div class="card-actions"><button class="btn btn-primary" type="button" data-imprimir>Imprimir comprovante</button></div>
      </div>
    </section>`;
  }

  function desenharBotoes(c) {
    const lista = [];
    if (c.status === "aceita") lista.push('<button class="btn btn-primary" type="button" data-acao="pagar">Pagar agora</button>');
    if (c.status === "enviada") lista.push('<button class="btn btn-primary" type="button" data-acao="entrega">Confirmar entrega</button>');
    if (c.status === "entregue" && !c.avaliacao) lista.push('<button class="btn btn-primary" type="button" data-acao="avaliar">Avaliar usina</button>');
    if (c.pago) lista.push('<button class="btn btn-ghost" type="button" data-acao="comprovante">Comprovante</button>');
    if (["registrada", "aceita"].includes(c.status)) lista.push('<button class="btn btn-ghost" type="button" data-acao="cancelar">Cancelar compra</button>');
    botoes.innerHTML = lista.join(" ");
  }

  function render(c) {
    document.querySelector("[data-compra-titulo]").textContent = `${c.quantidade ?? 1}x ${c.peca}`;
    document.querySelector("[data-compra-subtitulo]").innerHTML = `Compra #${esc(c.idSolicitacaoComercial)} · ${statusBadge(c.status)}`;
    desenharBotoes(c);

    const usina = c.usina;
    conteudo.innerHTML = `
      <article class="card next-step-banner"><strong>Próximo passo</strong><p>${esc(proximoPasso(c))}</p></article>
      <section class="detail-layout">
        <article class="card detail-card">
          <h2>Dados da compra</h2>
          <div class="action-modal-grid">
            <div><span>Peça</span><strong>${esc(c.peca)}</strong></div>
            <div><span>Quantidade</span><strong>${esc(c.quantidade ?? 1)}</strong></div>
            <div><span>Valor unitário</span><strong>${esc(money(c.valorUnitario))}</strong></div>
            <div><span>Total</span><strong>${esc(c.total != null ? money(c.total) : "Sob consulta")}</strong></div>
            <div><span>Usina</span><strong>${usina ? `<a class="text-link" href="usina-pessoa-fisica.html?id=${esc(usina.idUsina)}">${esc(usina.nome)}</a>` : esc(c.fornecedor || "-")}</strong></div>
            <div><span>Contato da usina</span><strong>${esc([usina?.email, usina?.telefone].filter(Boolean).join(" / ") || "-")}</strong></div>
            <div><span>Solicitada em</span><strong>${esc(dateTime(c.criadoEm))}</strong></div>
            <div><span>Pagamento</span><strong>${c.pago ? esc(`${c.metodoPagamento} · ${date(c.dataPagamento)}`) : "Pendente"}</strong></div>
          </div>
          ${c.avaliacao ? `<p class="modal-copy">Sua avaliação: ${window.PF.stars(c.avaliacao.nota)} ${esc(c.avaliacao.comentario || "")}</p>` : ""}
        </article>
        <article class="card detail-card">
          <h2>Linha do tempo</h2>
          <ol class="timeline">${linhaDoTempo(c)}</ol>
        </article>
      </section>
      ${c.pago ? comprovante(c) : ""}`;
  }

  async function recarregar() {
    const c = await api().get(`/solicitacoes-comerciais/${id}`);
    render(c);
    atual = c;
  }

  let atual = null;

  async function executar(acao, extra = {}) {
    const c = await api().patch(`/solicitacoes-comerciais/${id}/acao`, { acao, ...extra });
    atual = c;
    render(c);
  }

  function abrirPagamento(c) {
    const el = modal({
      kicker: "Pagamento",
      title: "Pagar compra",
      body: `<form class="form" data-form-pagamento>
        <div class="action-modal-grid">
          <div><span>Peça</span><strong>${esc(c.quantidade)}x ${esc(c.peca)}</strong></div>
          <div><span>Total</span><strong>${esc(money(c.total))}</strong></div>
        </div>
        <label class="field"><span>Forma de pagamento</span><div class="input-wrap select-field"><span class="input-symbol">$</span><select name="metodo"><option value="PIX">PIX</option><option value="Cartao">Cartão de crédito</option><option value="Boleto">Boleto</option></select></div></label>
        <p class="modal-copy">Pagamento simulado: nenhum valor real é cobrado.</p>
        <div class="form-actions"><button class="btn btn-ghost" type="button" data-m-close>Cancelar</button><button class="btn btn-primary" type="submit">Confirmar pagamento</button></div>
      </form>`,
    });
    const form = el.querySelector("[data-form-pagamento]");
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const botao = form.querySelector('button[type="submit"]');
      botao.disabled = true;
      botao.textContent = "Processando...";
      try {
        await executar("pagar", { metodo: form.elements.metodo.value });
        fecharModal();
        toast("Pagamento confirmado.");
      } catch (error) {
        toast(error.message);
        botao.disabled = false;
        botao.textContent = "Confirmar pagamento";
      }
    });
  }

  botoes.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-acao]");
    if (!botao || !atual) return;
    switch (botao.dataset.acao) {
      case "pagar": abrirPagamento(atual); break;
      case "entrega":
        confirmar({
          title: "Confirmar entrega",
          message: `Você recebeu ${atual.quantidade}x ${atual.peca}? Depois de confirmar, a compra é concluída.`,
          confirmText: "Sim, recebi",
          onConfirm: async () => { await executar("confirmar_entrega"); toast("Entrega confirmada."); },
        });
        break;
      case "cancelar":
        confirmar({
          title: "Cancelar compra",
          message: `Tem certeza que deseja cancelar a compra de ${atual.peca}?`,
          confirmText: "Cancelar compra",
          cancelText: "Voltar",
          onConfirm: async () => { await executar("cancelar"); toast("Compra cancelada."); },
        });
        break;
      case "avaliar":
        avaliar({ alvo: { solicitacaoComercialId: String(id) }, titulo: `Avaliar ${atual.usina?.nome || "a usina"}`, aoConcluir: () => recarregar().catch(() => {}) });
        break;
      case "comprovante": {
        const secao = conteudo.querySelector("[data-comprovante]");
        if (secao) { secao.hidden = !secao.hidden; if (!secao.hidden) secao.scrollIntoView({ behavior: "smooth" }); }
        break;
      }
      default: break;
    }
  });

  conteudo.addEventListener("click", (event) => {
    if (!event.target.closest("[data-imprimir]")) return;
    document.body.classList.add("printing-comprovante");
    window.print();
    document.body.classList.remove("printing-comprovante");
  });

  (async function () {
    if (!id) { conteudo.innerHTML = emptyState("Compra não informada", "Volte para Minhas compras."); return; }
    try { await recarregar(); } catch (error) { conteudo.innerHTML = emptyState("Compra não encontrada", error.message); }
  }());
}());
