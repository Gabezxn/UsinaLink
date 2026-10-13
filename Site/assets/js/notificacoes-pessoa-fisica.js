(function () {
  const { api, esc, dateTime, toast, emptyState } = window.PF;
  const lista = document.querySelector("[data-notificacoes]");
  let itens = [];

  function render() {
    lista.innerHTML = itens.length
      ? itens.map((n) => `<div class="notif-item ${n.lida ? "" : "unread"}" data-id="${esc(n.idNotificacao)}">
          <div><strong>${esc(n.titulo)}</strong><p>${esc(n.mensagem || "")}</p>${n.link ? `<a class="text-link" href="${esc(n.link)}" data-abrir>Abrir</a>` : ""}</div>
          <small>${esc(dateTime(n.dataCriacao))}</small>
        </div>`).join("")
      : emptyState("Nenhuma notificação", "Os avisos sobre suas compras e pedidos aparecem aqui.");
  }

  lista.addEventListener("click", async (event) => {
    const item = event.target.closest(".notif-item");
    if (!item || !item.classList.contains("unread")) return;
    const n = itens.find((x) => String(x.idNotificacao) === item.dataset.id);
    try {
      await api().patch(`/notificacoes/${n.idNotificacao}/ler`, {});
      n.lida = true;
      if (!event.target.closest("[data-abrir]")) render();
    } catch { /* abrir o link continua funcionando */ }
  });

  document.querySelector("[data-marcar-todas]").addEventListener("click", async () => {
    try {
      await api().patch("/notificacoes/ler-todas", {});
      itens.forEach((n) => { n.lida = true; });
      render();
      document.querySelectorAll(".nav-count").forEach((el) => el.remove());
      toast("Tudo marcado como lido.");
    } catch (error) { toast(error.message); }
  });

  api().get("/notificacoes")
    .then((rows) => { itens = rows; render(); })
    .catch((error) => { lista.innerHTML = emptyState("Falha ao carregar", error.message); });
}());
