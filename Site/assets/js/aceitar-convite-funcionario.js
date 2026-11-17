// Convite de funcionário (movido do HTML para respeitar o CSP sem scripts inline).
const esc = (v) => window.SafeHtml.escape(v);
const inviteId = new URLSearchParams(window.location.search).get("id");
const statusElement = document.querySelector("#invite-status");
const detailsElement = document.querySelector("#invite-details");
const button = document.querySelector("#accept-invite-button");
let funcionario = null;

function renderInvite(item) {
  funcionario = item;
  const owner = item.contexto === "usina" ? "Usina vinculada" : "Empresa vinculada";
  statusElement.textContent = "Revise os dados abaixo antes de aceitar o convite.";
  detailsElement.innerHTML = `
    <div><span>${owner}</span><strong>${"Conta UsinaLink"}</strong></div>
    <div><span>Nome</span><strong>${esc(item.nome || "")}</strong></div>
    <div><span>E-mail</span><strong>${esc(item.email || "")}</strong></div>
    <div><span>Cargo</span><strong>${esc(item.cargo || "")}</strong></div>
    <div><span>Status atual</span><strong>${esc(item.status || "Pendente")}</strong></div>`;
}

async function loadInvite() {
  if (!inviteId) {
    statusElement.textContent = "Convite não informado. Abra o link recebido no convite.";
    button.disabled = true;
    return;
  }
  let logado = false;
  try { logado = !!(sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken")); } catch { /* sem armazenamento */ }
  if (!logado) {
    statusElement.innerHTML = 'Para aceitar o convite, entre na sua conta e abra este link de novo. <a class="text-link" href="login.html">Entrar</a>';
    button.disabled = true;
    return;
  }
  try {
    renderInvite(await window.UsinaLinkApi.get(`/funcionarios/${encodeURIComponent(inviteId)}`));
  } catch (error) {
    statusElement.textContent = error.message;
    button.disabled = true;
  }
}

button.addEventListener("click", async () => {
  if (!funcionario) return;
  try {
    await window.UsinaLinkApi.put(`/funcionarios/${encodeURIComponent(inviteId)}/aceitar-convite`, {});
    statusElement.textContent = "Convite aceito com sucesso. Seu status agora é Ativo.";
    button.disabled = true;
  } catch (error) {
    statusElement.textContent = error.message;
  }
});

loadInvite();
