// Visualizar e baixar o arquivo técnico de um pedido (usina). Usado em Pedidos disponíveis, Enviar proposta e Propostas enviadas.
// Se o arquivo ainda não foi carregado (a tela só mostra o botão), busca o pedido na API na hora.
(function () {
  // Conteudo dos arquivos tecnicos por pedido; fica fora do HTML porque o data URL e grande.
  const arquivosPorPedido = window.UsinaLinkArquivosPedido = window.UsinaLinkArquivosPedido || {};

  function dataUrlParaBlob(dataUrl) {
    const [cabecalho, corpo = ""] = String(dataUrl).split(",");
    const tipo = (cabecalho.match(/^data:([^;,]+)/) || [])[1] || "application/octet-stream";
    const bytes = /;base64/.test(cabecalho) ? atob(corpo) : decodeURIComponent(corpo);
    const dados = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i += 1) dados[i] = bytes.charCodeAt(i);
    return new Blob([dados], { type: tipo });
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

  function aviso(texto) {
    if (typeof window.showToast === "function") window.showToast(texto);
  }

  // Busca o pedido (a usina pode ver o pedido aberto ou aquele em que enviou proposta) e guarda o primeiro arquivo.
  async function buscarArquivo(pedidoId) {
    if (!window.UsinaLinkApi) return null;
    try {
      const pedido = await window.UsinaLinkApi.get(`/pedidos/${encodeURIComponent(pedidoId)}`);
      const achado = (pedido.arquivos || []).find((a) => a.urlArquivo);
      if (achado) arquivosPorPedido[pedidoId] = { nome: achado.nomeArquivo || "arquivo-tecnico", url: achado.urlArquivo };
    } catch (erro) {
      aviso(erro.message || "Não foi possível carregar o arquivo.");
    }
    return arquivosPorPedido[pedidoId] || null;
  }

  document.addEventListener("click", async (event) => {
    const botao = event.target.closest("[data-arquivo-acao]");
    if (!botao) return;
    event.preventDefault();
    let arquivo = arquivosPorPedido[botao.dataset.pedidoId];
    if (!arquivo) {
      botao.disabled = true;
      arquivo = await buscarArquivo(botao.dataset.pedidoId);
      botao.disabled = false;
      if (!arquivo) { aviso("Este pedido não tem arquivo técnico anexado."); return; }
    }
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
})();
