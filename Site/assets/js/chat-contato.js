// Chat de contato da pagina inicial: perguntas rapidas com resposta imediata.
(function () {
  const respostas = {
    "Como funciona?": "Empresas e pessoas físicas pedem peças, as usinas enviam propostas e você escolhe a melhor. O pagamento e o acompanhamento ficam na plataforma.",
    "Como cadastrar minha usina?": "Clique em Cadastrar, escolha Usina e preencha os dados. Depois do cadastro você já entra direto na sua conta.",
    "Quanto custa?": "O cadastro é gratuito. O valor pago é o da proposta aceita, sem taxa extra.",
  };
  const raiz = document.createElement("div");
  raiz.className = "chat-contato";
  raiz.innerHTML = `
    <section class="chat-painel" hidden role="dialog" aria-label="Dúvidas rápidas">
      <header><strong>Dúvidas rápidas</strong><button type="button" data-chat-fechar aria-label="Fechar chat">x</button></header>
      <div class="chat-mensagens" data-chat-msgs aria-live="polite"><p class="chat-bot">Olá! Como podemos ajudar?</p></div>
      <div class="chat-atalhos" data-chat-atalhos></div>
    </section>
    <button class="chat-abrir" type="button" aria-expanded="false">Dúvidas</button>`;
  document.body.appendChild(raiz);

  const painel = raiz.querySelector(".chat-painel");
  const msgs = raiz.querySelector("[data-chat-msgs]");
  const abrir = raiz.querySelector(".chat-abrir");
  const add = (texto, classe) => {
    const p = document.createElement("p");
    p.className = classe;
    p.textContent = texto;
    msgs.appendChild(p);
    msgs.scrollTop = msgs.scrollHeight;
    return p;
  };
  const atalhos = raiz.querySelector("[data-chat-atalhos]");
  const botoes = [];
  let ocupado = false;
  const reduzido = () => !!(window.UsinaMotion && window.UsinaMotion.reduzido());
  // Resposta "digitada": mostra a bolinha de digitando por um tempo proporcional ao tamanho do texto e so entao envia a mensagem.
  const responder = (texto, depois, fixo) => {
    ocupado = true;
    botoes.forEach((b) => { b.disabled = true; });
    const ind = document.createElement("p");
    ind.className = "chat-bot chat-digitando";
    ind.innerHTML = '<span class="a11y-sr-only">Digitando…</span><i aria-hidden="true"></i><i aria-hidden="true"></i><i aria-hidden="true"></i>';
    msgs.appendChild(ind);
    msgs.scrollTop = msgs.scrollHeight;
    const ms = reduzido() ? 250 : (fixo || Math.min(3200, Math.max(900, 600 + texto.length * 20)));
    window.setTimeout(() => {
      ind.remove();
      add(texto, "chat-bot");
      ocupado = false;
      botoes.forEach((b) => { b.disabled = false; });
      if (depois) depois();
    }, ms);
  };
  Object.keys(respostas).forEach((pergunta) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filter-pill";
    b.textContent = pergunta;
    b.addEventListener("click", () => {
      if (ocupado) return;
      add(pergunta, "chat-user");
      responder(respostas[pergunta]);
    });
    botoes.push(b);
    atalhos.appendChild(b);
  });
  const alternar = (aberto) => { painel.hidden = !aberto; abrir.setAttribute("aria-expanded", String(aberto)); };
  abrir.addEventListener("click", () => alternar(painel.hidden));
  raiz.addEventListener("keydown", (event) => { if (event.key === "Escape" && !painel.hidden) { alternar(false); abrir.focus(); } });
  raiz.querySelector("[data-chat-fechar]").addEventListener("click", () => alternar(false));
}());
