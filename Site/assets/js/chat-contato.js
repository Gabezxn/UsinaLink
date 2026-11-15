// Chat de contato da pagina inicial: perguntas rapidas com resposta imediata e envio de mensagem por e-mail.
(function () {
  const EMAIL = "atendimento@usinalink.test";
  const respostas = {
    "Como funciona?": "Empresas e pessoas físicas pedem peças, as usinas enviam propostas e você escolhe a melhor. O pagamento e o acompanhamento ficam na plataforma.",
    "Como cadastrar minha usina?": "Clique em Cadastrar, escolha Usina e preencha os dados. Depois do cadastro você já entra direto na sua conta.",
    "Quanto custa?": "O cadastro é gratuito. O valor pago é o da proposta aceita, sem taxa extra.",
    "Falar com atendimento": null,
  };
  const raiz = document.createElement("div");
  raiz.className = "chat-contato";
  raiz.innerHTML = `
    <section class="chat-painel" hidden role="dialog" aria-label="Chat de contato">
      <header><strong>Fale com a Usinalink</strong><button type="button" data-chat-fechar aria-label="Fechar chat">x</button></header>
      <div class="chat-mensagens" data-chat-msgs aria-live="polite"><p class="chat-bot">Olá! Como podemos ajudar?</p></div>
      <div class="chat-atalhos" data-chat-atalhos></div>
      <form class="chat-form" data-chat-form hidden>
        <input name="nome" type="text" placeholder="Seu nome" required>
        <input name="email" type="email" placeholder="Seu e-mail" required>
        <textarea name="mensagem" rows="3" placeholder="Escreva sua mensagem" required></textarea>
        <button class="btn btn-primary btn-small" type="submit">Enviar mensagem</button>
      </form>
    </section>
    <button class="chat-abrir" type="button" aria-expanded="false">Fale conosco</button>`;
  document.body.appendChild(raiz);

  const painel = raiz.querySelector(".chat-painel");
  const msgs = raiz.querySelector("[data-chat-msgs]");
  const form = raiz.querySelector("[data-chat-form]");
  const abrir = raiz.querySelector(".chat-abrir");
  const add = (texto, classe) => {
    const p = document.createElement("p");
    p.className = classe;
    p.textContent = texto;
    msgs.appendChild(p);
    msgs.scrollTop = msgs.scrollHeight;
  };
  const atalhos = raiz.querySelector("[data-chat-atalhos]");
  Object.keys(respostas).forEach((pergunta) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "filter-pill";
    b.textContent = pergunta;
    b.addEventListener("click", () => {
      add(pergunta, "chat-user");
      if (respostas[pergunta]) add(respostas[pergunta], "chat-bot");
      else { add("Deixe seu contato e a mensagem que respondemos por e-mail.", "chat-bot"); form.hidden = false; }
    });
    atalhos.appendChild(b);
  });
  const alternar = (aberto) => { painel.hidden = !aberto; abrir.setAttribute("aria-expanded", String(aberto)); };
  abrir.addEventListener("click", () => alternar(painel.hidden));
  raiz.addEventListener("keydown", (event) => { if (event.key === "Escape" && !painel.hidden) { alternar(false); abrir.focus(); } });
  raiz.querySelector("[data-chat-fechar]").addEventListener("click", () => alternar(false));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const d = new FormData(form);
    const corpo = `${d.get("mensagem")}\n\n${d.get("nome")} - ${d.get("email")}`;
    window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent("Contato pelo site")}&body=${encodeURIComponent(corpo)}`;
    add("Mensagem preparada no seu e-mail. Obrigado!", "chat-bot");
    form.reset();
    form.hidden = true;
  });
}());
