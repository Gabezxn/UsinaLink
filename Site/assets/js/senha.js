/* Esqueci minha senha: pedido do link (esqueci-senha.html) e criação da nova senha (redefinir-senha.html).
   O código do link vem depois do "#": o navegador não o envia a ninguém e ele é apagado do endereço assim que lido. */
(function () {
  "use strict";
  var api = window.UsinaLinkApi;

  function aviso(id, texto) {
    var p = document.getElementById(id);
    p.textContent = texto;
    p.hidden = false;
  }

  var pedido = document.getElementById("form-esqueci");
  if (pedido) {
    pedido.addEventListener("submit", async function (event) {
      event.preventDefault();
      var campo = document.getElementById("esqueci-email");
      setFieldState(campo, "");
      if (!isValidEmail(campo.value)) { setFieldState(campo, "Informe um e-mail válido."); return; }
      var botao = pedido.querySelector("button[type='submit']");
      botao.disabled = true;
      try {
        var r = await api.post("/auth/senha/esqueci", { email: campo.value.trim().toLowerCase(), origem: window.location.origin });
        aviso("esqueci-resultado", r.mensagem + " Confira também a caixa de spam.");
        pedido.hidden = true;
      } catch (erro) {
        botao.disabled = false;
        setFieldState(campo, erro instanceof TypeError ? "Não foi possível conectar ao servidor." : erro.message);
      }
    });
  }

  var nova = document.getElementById("form-redefinir");
  if (nova) {
    var m = /(?:^|[#&])token=([a-f0-9]{64})/.exec(window.location.hash);
    var token = m ? m[1] : "";
    if (window.location.hash) history.replaceState(null, "", window.location.pathname);
    if (!token) {
      nova.hidden = true;
      aviso("redefinir-resultado", "Este link está incompleto ou expirou. Peça um novo em “Esqueci minha senha”.");
    }
    nova.addEventListener("submit", async function (event) {
      event.preventDefault();
      var senha = document.getElementById("redefinir-senha");
      var confirmar = document.getElementById("redefinir-confirmar");
      setFieldState(senha, ""); setFieldState(confirmar, "");
      if (senha.value.length < 6) { setFieldState(senha, "A senha deve ter no mínimo 6 caracteres."); return; }
      if (senha.value !== confirmar.value) { setFieldState(confirmar, "As senhas não são iguais."); return; }
      var botao = nova.querySelector("button[type='submit']");
      botao.disabled = true;
      try {
        var r = await api.post("/auth/senha/redefinir", { token: token, novaSenha: senha.value, confirmarSenha: confirmar.value });
        nova.hidden = true;
        aviso("redefinir-resultado", r.mensagem);
        window.setTimeout(function () { window.location.href = "login.html"; }, 2500);
      } catch (erro) {
        botao.disabled = false;
        setFieldState(senha, erro instanceof TypeError ? "Não foi possível conectar ao servidor." : erro.message);
      }
    });
  }
})();
