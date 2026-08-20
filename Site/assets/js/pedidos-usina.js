(function () {
  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function itemDe(pedido) {
    return (pedido.itens && pedido.itens[0]) || {};
  }

  function nomeEmpresa(empresa) {
    return empresa?.nomeFantasia || empresa?.razaoSocial || "Empresa";
  }

  function orderCardMarkup(pedido) {
    const item = itemDe(pedido);
    const arquivo = (pedido.arquivos && pedido.arquivos[0]?.nomeArquivo) || "";
    return `<article class="card order-opportunity" data-search-row data-pedido-id="${esc(pedido.idPedido)}" data-region="" data-urgency="${esc((pedido.urgencia || "normal").toLowerCase())}" data-days="${esc(pedido.prazoEntregaDias ?? 999)}" data-description="${esc(pedido.observacoes || "Sem descricao adicional.")}" data-file="${esc(arquivo || "Sem arquivo anexado")}" data-material="${esc(item.material || "")}" data-quantidade="${esc(item.quantidade ? item.quantidade + " unidades" : "")}">
      <h2>${esc(item.nome || "Peça industrial")}</h2><p>${esc(nomeEmpresa(pedido.empresaCompradora))}</p>
      <div class="card-actions"><button class="btn btn-ghost js-open-order-detail" type="button">Ver detalhes</button><a class="btn btn-orange" href="enviar-proposta.html?pedidoId=${esc(pedido.idPedido)}">Enviar proposta</a></div>
    </article>`;
  }

  function orderRowMarkup(pedido) {
    const item = itemDe(pedido);
    const arquivo = (pedido.arquivos && pedido.arquivos[0]?.nomeArquivo) || "";
    const urgenciaBadge = /alta|critica/i.test(pedido.urgencia || "") ? "warning" : "muted";
    return `<tr data-search-row data-pedido-id="${esc(pedido.idPedido)}" data-region="" data-urgency="${esc((pedido.urgencia || "normal").toLowerCase())}" data-days="${esc(pedido.prazoEntregaDias ?? 999)}" data-description="${esc(pedido.observacoes || "Sem descricao adicional.")}" data-file="${esc(arquivo || "Sem arquivo anexado")}">
      <td>${esc(item.nome || "Peça industrial")}</td>
      <td>${esc(item.material || "-")}</td>
      <td>${esc(item.quantidade ? item.quantidade + " unidades" : "-")}</td>
      <td>${esc(pedido.prazoEntregaDias ? pedido.prazoEntregaDias + " dias" : "A combinar")}</td>
      <td>-</td>
      <td><span class="badge ${urgenciaBadge}">${esc(pedido.urgencia || "Normal")}</span></td>
      <td><button class="table-action js-open-order-detail" type="button">Ver detalhes</button><a class="btn btn-orange btn-small" href="enviar-proposta.html?pedidoId=${esc(pedido.idPedido)}">Enviar proposta</a></td>
    </tr>`;
  }

  async function loadPedidosDisponiveis() {
    const grid = document.querySelector(".order-card-grid");
    const tbody = document.querySelector("[data-usina-pedidos-body]");
    if (!grid && !tbody) return;
    if (!window.UsinaLinkApi) return;
    try {
      const pedidos = await window.UsinaLinkApi.get("/pedidos/disponiveis");
      if (grid) {
        grid.innerHTML = pedidos.length
          ? pedidos.map(orderCardMarkup).join("")
          : '<article class="card order-opportunity"><h2>Nenhum pedido disponível</h2><p>Novas solicitações de empresas aparecerão aqui.</p></article>';
      }
      if (tbody) {
        tbody.innerHTML = pedidos.length
          ? pedidos.slice(0, 4).map(orderRowMarkup).join("")
          : '<tr><td colspan="7" style="text-align:center; padding: 24px;">Nenhum pedido disponível no momento.</td></tr>';
      }
      document.dispatchEvent(new CustomEvent("usinalink:pedidos-carregados"));
    } catch (error) {
      const target = grid || tbody;
      if (target) target.innerHTML = `<p style="padding: 16px;">Falha ao carregar pedidos: ${esc(error.message)}</p>`;
    }
  }

  loadPedidosDisponiveis();
}());
