(function () {
  function esc(value) {
    return typeof escapeHtml === "function" ? escapeHtml(value ?? "") : String(value ?? "");
  }

  // Conteudo dos arquivos tecnicos por pedido; fica fora do HTML porque o data URL e grande.
  const arquivosPorPedido = {};
  window.UsinaLinkArquivosPedido = arquivosPorPedido;

  function dataUrlParaBlob(dataUrl) {
    const [cabecalho, corpo = ""] = String(dataUrl).split(",");
    const tipo = (cabecalho.match(/^data:([^;,]+)/) || [])[1] || "application/octet-stream";
    const bytes = /;base64/.test(cabecalho) ? atob(corpo) : decodeURIComponent(corpo);
    const dados = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) dados[i] = bytes.charCodeAt(i);
    return new Blob([dados], { type: tipo });
  }

  function guardarArquivos(pedidos) {
    pedidos.forEach((pedido) => {
      const arquivo = (pedido.arquivos || []).find((a) => a.urlArquivo);
      if (arquivo) arquivosPorPedido[pedido.idPedido] = { nome: arquivo.nomeArquivo || "arquivo-tecnico", url: arquivo.urlArquivo };
    });
  }

  // Janela por cima da pagina para ver a foto do projeto (fecha com X, Esc ou clique fora).
  function abrirFoto(src, nome, aoFechar, origem) {
    const fundo = document.createElement("div");
    fundo.className = "photo-lightbox";
    fundo.setAttribute("role", "dialog");
    fundo.setAttribute("aria-modal", "true");
    fundo.setAttribute("aria-label", "Foto do projeto");
    const caixa = document.createElement("div");
    caixa.className = "photo-lightbox-box";
    const imagem = document.createElement("img");
    imagem.src = src;
    imagem.alt = nome || "Foto do projeto";
    const legenda = document.createElement("p");
    legenda.textContent = nome || "";
    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "photo-lightbox-close";
    fechar.setAttribute("aria-label", "Fechar foto");
    fechar.textContent = "×";
    caixa.append(fechar, imagem, legenda);
    fundo.append(caixa);
    document.body.append(fundo);
    const sair = () => {
      document.removeEventListener("keydown", tecla);
      fundo.remove();
      aoFechar();
      origem?.focus?.();
    };
    const tecla = (e) => { if (e.key === "Escape") sair(); };
    document.addEventListener("keydown", tecla);
    fundo.addEventListener("click", (e) => { if (e.target === fundo) sair(); });
    fechar.addEventListener("click", sair);
    fechar.focus();
  }

  document.addEventListener("click", (event) => {
    const botao = event.target.closest("[data-arquivo-acao]");
    if (!botao) return;
    const arquivo = arquivosPorPedido[botao.dataset.pedidoId];
    if (!arquivo) return;
    event.preventDefault();
    let blob;
    try { blob = arquivo.url.startsWith("data:") ? dataUrlParaBlob(arquivo.url) : null; } catch (e) { blob = null; }
    // Só abre no navegador PDF ou imagem; qualquer outro tipo é baixado (nunca executado). URLs externas só https.
    const tipoSeguro = !!blob && /^(application\/pdf|image\/(png|jpe?g|webp|gif))$/.test(blob.type);
    if (!blob && !/^https:\/\//.test(String(arquivo.url))) return;
    const href = blob ? URL.createObjectURL(blob) : arquivo.url;
    if (botao.dataset.arquivoAcao === "baixar" || (blob && !tipoSeguro)) {
      const link = document.createElement("a");
      link.href = href;
      link.download = arquivo.nome;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else if (blob && /^image\//.test(blob.type)) {
      // Foto do projeto: abre numa janela por cima da propria pagina, sem trocar de aba.
      abrirFoto(href, arquivo.nome, () => URL.revokeObjectURL(href), botao);
      return;
    } else {
      window.open(href, "_blank", "noopener");
    }
    if (blob) setTimeout(() => URL.revokeObjectURL(href), 60000);
  });

  const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];
  function ufDe(local) {
    const achados = (String(local || "").toUpperCase().match(/[A-Z]{2}/g) || []).filter((uf) => UFS.includes(uf));
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
