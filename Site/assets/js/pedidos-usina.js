(function () {
  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  function guardarArquivos(pedidos) {
    pedidos.forEach((pedido) => {
      const arquivo = (pedido.arquivos || []).find((a) => a.urlArquivo);
      if (arquivo) window.UsinaLinkArquivosPedido[pedido.idPedido] = { nome: arquivo.nomeArquivo || "arquivo-tecnico", url: arquivo.urlArquivo };
    });
  }

  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  function ufDe(local) {
    const achados = (String(local || "").toUpperCase().match(/\b[A-Z]{2}\b/g) || []).filter((uf) => UFS.includes(uf));
    return achados.length ? achados[achados.length - 1] : "";
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
    return `<article class="card order-opportunity" data-search-row data-pedido-id="${esc(pedido.idPedido)}" data-region="${esc(ufDe(pedido.localEntrega))}" data-local="${esc(pedido.localEntrega || "")}" data-urgency="${esc((pedido.urgencia || "normal").toLowerCase())}" data-days="${esc(pedido.prazoEntregaDias ?? 999)}" data-description="${esc(pedido.observacoes || "Sem descricao adicional.")}" data-file="${esc(arquivo || "Sem arquivo anexado")}" data-material="${esc(item.material || "")}" data-quantidade="${esc(item.quantidade ? item.quantidade + " unidades" : "")}">
      <h2>${esc(item.nome || "Peça industrial")}</h2><p>${esc(nomeEmpresa(pedido.empresaCompradora))}</p>
      <div class="card-actions"><button class="btn btn-ghost js-open-order-detail" type="button">Ver detalhes</button><a class="btn btn-orange" href="enviar-proposta.html?pedidoId=${esc(pedido.idPedido)}">Enviar proposta</a></div>
    </article>`;
  }

  function orderRowMarkup(pedido) {
    const item = itemDe(pedido);
    const arquivo = (pedido.arquivos && pedido.arquivos[0]?.nomeArquivo) || "";
    const urgenciaBadge = /alta|critica/i.test(pedido.urgencia || "") ? "warning" : "muted";
    return `<tr data-search-row data-pedido-id="${esc(pedido.idPedido)}" data-region="${esc(ufDe(pedido.localEntrega))}" data-local="${esc(pedido.localEntrega || "")}" data-urgency="${esc((pedido.urgencia || "normal").toLowerCase())}" data-days="${esc(pedido.prazoEntregaDias ?? 999)}" data-description="${esc(pedido.observacoes || "Sem descricao adicional.")}" data-file="${esc(arquivo || "Sem arquivo anexado")}">
      <td>${esc(item.nome || "Peça industrial")}</td>
      <td>${esc(item.material || "-")}</td>
      <td>${esc(item.quantidade ? item.quantidade + " unidades" : "-")}</td>
      <td>${esc(formatPrazo(pedido.prazoEntregaDias))}</td>
      <td>${esc(ufDe(pedido.localEntrega) || "-")}</td>
      <td><span class="badge ${urgenciaBadge}">${esc(formatUrgencia(pedido.urgencia))}</span></td>
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
      guardarArquivos(pedidos);
      if (grid) {
        grid.innerHTML = pedidos.length
          ? pedidos.map(orderCardMarkup).join("")
          : '<div class="empty-state"><strong>Nenhum pedido disponível</strong><span>Novas solicitações de empresas aparecem aqui assim que forem publicadas.</span><a class="btn btn-small" href="dashboard-usina.html">Voltar ao início</a></div>';
      }
      if (tbody) {
        tbody.innerHTML = pedidos.length
          ? pedidos.slice(0, 4).map(orderRowMarkup).join("")
          : '<tr><td colspan="7" class="td-empty">Nenhum pedido disponível no momento.</td></tr>';
      }
      document.dispatchEvent(new CustomEvent("usinalink:pedidos-carregados"));
    } catch (error) {
      const target = grid || tbody;
      if (target) target.innerHTML = `<p style="padding: 16px;">Falha ao carregar pedidos: ${esc(error.message)}</p>`;
    }
  }

  loadPedidosDisponiveis();
}());
