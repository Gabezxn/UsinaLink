const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
toast.setAttribute("aria-live", "polite");
toast.setAttribute("aria-atomic", "true");
document.body.appendChild(toast);

document.querySelectorAll(".sidebar").forEach((sidebar) => {
  const nav = sidebar.querySelector(".side-nav");
  const brand = sidebar.querySelector(".brand");
  if (!nav || !brand || sidebar.querySelector(".sidebar-toggle")) return;
  const toggle = document.createElement("button");
  toggle.className = "sidebar-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir ou fechar menu");
  toggle.setAttribute("aria-expanded", "false");
  if (!nav.id) nav.id = "menu-lateral";
  toggle.setAttribute("aria-controls", nav.id);
  toggle.textContent = "Menu";
  brand.insertAdjacentElement("afterend", toggle);
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("sidebar-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 7000);
}

const signupConfig = {
  empresa: {
    labels: ["Nome da empresa", "CNPJ", "E-mail corporativo", "Nome do responsavel", "Cargo", "CEP", "Cidade", "Estado (UF)", "Senha", "Confirmar senha"],
    placeholders: ["Metal Forte Ltda.", "00.000.000/0001-00", "compras@empresa.com", "Nome e sobrenome", "Gerente de compras", "00000-000", "Sao Paulo", "SP", "Crie uma senha", "Digite a senha novamente"],
    icons: ["N", "#", "@", "R", "C", "#", "L", "UF", "*", "*"],
    types: ["text", "text", "email", "text", "text", "text", "text", "text", "password", "password"],
    keys: ["nome", "cnpj", "email", "responsavel", "cargo", "cep", "cidade", "estado", "senha", "confirmarSenha"],
    button: "Cadastrar empresa",
    redirect: "login-empresa.html",
    orange: false
  },
  pessoa: {
    labels: ["Nome completo", "CPF", "E-mail", "Telefone", "CEP", "Cidade", "Estado (UF)", "Senha", "Confirmar senha"],
    placeholders: ["Nome e sobrenome", "000.000.000-00", "voce@email.com", "(00) 00000-0000", "00000-000", "Sao Paulo", "SP", "Crie uma senha", "Digite a senha novamente"],
    icons: ["N", "#", "@", "T", "#", "L", "UF", "*", "*"],
    types: ["text", "text", "email", "tel", "text", "text", "text", "password", "password"],
    keys: ["nome", "cpf", "email", "telefone", "cep", "cidade", "estado", "senha", "confirmarSenha"],
    button: "Cadastrar pessoa fisica",
    redirect: "login-pessoa-fisica.html",
    orange: false
  },
  usina: {
    labels: ["Nome da usina", "CNPJ", "E-mail industrial", "Respons\u00e1vel t\u00e9cnico", "Especialidade principal", "CEP", "Cidade", "Estado (UF)", "Senha", "Confirmar senha"],
    placeholders: ["Atlas Metais", "00.000.000/0001-00", "contato@atlasmetais.com", "Nome do responsavel", "Usinagem de precisao", "00000-000", "Sao Paulo", "SP", "Crie uma senha", "Digite a senha novamente"],
    icons: ["N", "#", "@", "R", "E", "#", "L", "UF", "*", "*"],
    types: ["text", "text", "email", "text", "text", "text", "text", "text", "password", "password"],
    keys: ["nome", "cnpj", "email", "responsavel", "especialidade", "cep", "cidade", "estado", "senha", "confirmarSenha"],
    button: "Cadastrar usina",
    redirect: "login-usina.html",
    orange: true
  }
};

const signupStorageKey = "usinalinkAccounts";

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function maskCpf(value) {
  return onlyDigits(value).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function maskCnpj(value) {
  return onlyDigits(value).slice(0, 14).replace(/(\d{2})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

function maskPhone(value) {
  return onlyDigits(value).slice(0, 11).replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

function maskCep(value) {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");
}

function applyMaskByKey(input) {
  if (!input) return;
  const key = input.dataset.fieldKey || input.dataset.mask;
  if (key === "cpf") input.value = maskCpf(input.value);
  if (key === "cnpj") input.value = maskCnpj(input.value);
  if (key === "telefone") input.value = maskPhone(input.value);
  if (key === "cep") input.value = maskCep(input.value);
  if (key === "estado") input.value = input.value.replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 2);
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || "").trim());
}

function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let index = 0; index < 9; index += 1) sum += Number(cpf[index]) * (10 - index);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== Number(cpf[9])) return false;
  sum = 0;
  for (let index = 0; index < 10; index += 1) sum += Number(cpf[index]) * (11 - index);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  return digit === Number(cpf[10]);
}

function isValidCnpj(value) {
  const cnpj = onlyDigits(value);
  return cnpj.length === 14;
}

function getStoredAccounts() {
  try {
    const accounts = JSON.parse(localStorage.getItem(signupStorageKey) || "[]");
    return Array.isArray(accounts) ? accounts : [];
  } catch {
    return [];
  }
}

function setFieldState(input, message) {
  const field = input?.closest(".field");
  if (!field) return;
  let messageElement = field.querySelector(".field-message");
  if (!messageElement) {
    messageElement = document.createElement("small");
    messageElement.className = "field-message";
    field.appendChild(messageElement);
  }
  if (!messageElement.id) messageElement.id = "field-msg-" + (window.__fieldMsgSeq = (window.__fieldMsgSeq || 0) + 1);
  messageElement.setAttribute("role", "alert");
  if (message) input.setAttribute("aria-describedby", messageElement.id); else input.removeAttribute("aria-describedby");
  field.classList.toggle("has-error", Boolean(message));
  field.classList.toggle("has-success", !message && Boolean(input.value.trim()));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  messageElement.textContent = message || "";
}

const SIGNUP_UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

function validateSignupInput(input, accounts) {
  const key = input.dataset.fieldKey;
  const value = input.value.trim();
  if (!input.required || input.closest(".field")?.hidden) return "";
  if (!value) return "Este campo e obrigatorio.";
  if (key === "email") {
    const normalized = value.toLowerCase();
    if (!isValidEmail(value)) return "Informe um e-mail valido.";
    if (accounts.some((account) => account.email === normalized)) return "Este e-mail ja esta cadastrado.";
  }
  if (key === "cep" && onlyDigits(value).length !== 8) return "Informe o CEP com 8 numeros.";
  if (key === "cidade" && value.length < 2) return "Informe a cidade.";
  if (key === "estado" && !SIGNUP_UFS.includes(value.toUpperCase())) return "Informe a sigla do estado (ex.: SP).";
  if (key === "senha" && value.length < 6) return "A senha deve ter no minimo 6 caracteres.";
  if (key === "confirmarSenha") {
    const password = input.form?.querySelector('[data-field-key="senha"]')?.value || "";
    if (value !== password) return "Senha e confirmar senha precisam ser iguais.";
  }
  if (key === "cpf") {
    const cpf = onlyDigits(value);
    if (!isValidCpf(value)) return "Informe um CPF valido no formato 000.000.000-00.";
    if (accounts.some((account) => account.cpf === cpf)) return "Este CPF ja esta cadastrado.";
  }
  if (key === "cnpj") {
    const cnpj = onlyDigits(value);
    if (!isValidCnpj(value)) return "Informe um CNPJ valido no formato 00.000.000/0000-00.";
    if (accounts.some((account) => account.cnpj === cnpj)) return "Este CNPJ ja esta cadastrado.";
  }
  return "";
}

function collectSignupPayload(form, type) {
  const payload = {};
  form.querySelectorAll("input[data-field-key]").forEach((input) => {
    if (input.closest(".field")?.hidden) return;
    const key = input.dataset.fieldKey;
    if (key === "confirmarSenha") return;
    payload[key] = key === "email" ? input.value.trim().toLowerCase() : input.value.trim();
    if (key === "cpf" || key === "cnpj" || key === "telefone" || key === "cep") payload[key] = onlyDigits(input.value);
    if (key === "estado") payload[key] = input.value.trim().toUpperCase();
  });
  payload.tipo = type === "pessoa" ? "pessoa_fisica" : type;
  return payload;
}

function updateSignupForm(type) {
  const config = signupConfig[type];
  const form = document.querySelector(".signup-dynamic-form");
  const button = document.querySelector("#signup-submit");
  if (!config || !form || !button) return;

  for (let index = 0; index < 10; index += 1) {
    const label = document.querySelector(`#field-label-${index + 1}`);
    const input = document.querySelector(`#signup-field-${index + 1}`);
    const symbol = input?.closest(".input-wrap")?.querySelector(".input-symbol");
    const field = input?.closest(".field");
    const visible = index < config.labels.length;

    if (field) field.hidden = !visible;
    if (!visible) {
      if (input) input.required = false;
      continue;
    }

    label.textContent = config.labels[index];
    input.type = config.types[index];
    input.placeholder = config.placeholders[index];
    input.value = "";
    input.required = true;
    input.dataset.fieldKey = config.keys[index];
    input.autocomplete = { senha: "new-password", confirmarSenha: "new-password", cep: "postal-code", cidade: "address-level2", estado: "address-level1" }[config.keys[index]] || "on";
    setFieldState(input, "");
    if (symbol) symbol.textContent = config.icons[index];
  }

  // O cadastro reaproveita os mesmos campos para cada tipo de conta: o botao "Mostrar" acompanha quem virou senha.
  for (let index = 0; index < 10; index += 1) {
    const input = document.querySelector(`#signup-field-${index + 1}`);
    if (!input) continue;
    if (index < config.labels.length && config.types[index] === "password") { input.dataset.toggleReady = "1"; addPasswordToggle(input); }
    else { delete input.dataset.toggleReady; removePasswordToggle(input); }
  }
  document.body.classList.toggle("pf-mode", type === "pessoa");
  document.body.classList.toggle("signup-usina", type === "usina");
  document.querySelector(".brand .brand-icon")?.classList.toggle("orange-icon", type === "usina");

  button.textContent = config.button;
  button.classList.toggle("btn-orange", config.orange);
  button.classList.toggle("btn-primary", !config.orange);
  form.dataset.redirect = config.redirect;
  form.dataset.accountType = type;
  const loginLink = document.querySelector("#signup-login-link");
  if (loginLink) {
    loginLink.href = type === "usina" ? "login-usina.html" : type === "empresa" ? "login-empresa.html" : "login-pessoa-fisica.html";
  }
}

function getSignupTypeFromUrl() {
  const raw = new URLSearchParams(window.location.search).get("tipo") || window.location.pathname.split("/").pop().replace("cadastro-", "").replace(".html", "");
  if (!raw || raw === "cadastro") return "";
  if (raw === "pessoa_fisica" || raw === "pessoa-fisica") return "pessoa";
  if (raw === "empresa" || raw === "usina") return raw;
  return "";
}

// Campos do cadastro entram escalonados quando o tipo de conta muda.
function refreshSignupFields() {
  const form = document.querySelector(".signup-dynamic-form");
  if (!form || (window.UsinaMotion && window.UsinaMotion.reduzido())) return;
  form.querySelectorAll(".field:not([hidden])").forEach((field, i) => field.style.setProperty("--i", String(i)));
  form.classList.remove("refresh");
  void form.offsetWidth;
  form.classList.add("refresh");
}

document.querySelectorAll(".choice-card").forEach((card) => {
  card.addEventListener("click", () => {
    const radio = card.querySelector('input[type="radio"]');
    if (!radio) return;
    // O clique no rotulo dispara um segundo clique no campo: ignora se este tipo ja esta selecionado.
    if (document.querySelector(".signup-dynamic-form")?.dataset.accountType === radio.value) return;
    document.querySelectorAll(".choice-card").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll('.choice-card input[type="radio"]').forEach((item) => {
      item.checked = false;
    });
    radio.checked = true;
    card.classList.add("active");
    const trocar = () => updateSignupForm(radio.value);
    if (window.UsinaMotion) {
      window.UsinaMotion.pintar(card, trocar);
      refreshSignupFields();
    } else trocar();
  });
});

document.querySelectorAll('a[href="index.html"]').forEach((link) => {
  if (link.textContent.trim().toLowerCase() === "sair") {
    link.addEventListener("click", () => {
      ["usinalinkSession", "accessToken", "tipoUsuario", "nome"].forEach((key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
      });
    });
  }
});

const checkedSignupType = document.querySelector('.choice-card input[type="radio"]:checked');
const urlSignupType = getSignupTypeFromUrl();
if (urlSignupType) {
  const targetRadio = document.querySelector(`.choice-card input[value="${urlSignupType}"]`);
  const targetCard = targetRadio?.closest(".choice-card");
  if (targetRadio && targetCard) {
    document.querySelectorAll(".choice-card").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll('.choice-card input[type="radio"]').forEach((item) => { item.checked = false; });
    targetRadio.checked = true;
    targetCard.classList.add("active");
    updateSignupForm(urlSignupType);
  }
} else if (checkedSignupType) updateSignupForm(checkedSignupType.value);

document.querySelectorAll(".signup-dynamic-form input").forEach((input) => {
  input.addEventListener("input", () => {
    applyMaskByKey(input);
    setFieldState(input, validateSignupInput(input, getStoredAccounts()));
  });
  input.addEventListener("blur", () => setFieldState(input, validateSignupInput(input, getStoredAccounts())));
});

const signupForm = document.querySelector(".signup-dynamic-form");
if (signupForm) {
  let signupLookupTimer;
  const lookupSignupOrganization = async () => {
    // Desativado por privacidade: o cadastro não consulta mais dados de outras empresas/usinas (SEC-13).
    return;
    // eslint-disable-next-line no-unreachable
    const type = signupForm.dataset.accountType;
    if (!["empresa", "usina"].includes(type) || !window.UsinaLinkApi) return;
    const nameInput = signupForm.querySelector('[data-field-key="nome"]');
    const name = nameInput?.value.trim();
    if (!name || name.length < 3) return;
    const path = type === "usina" ? `/usinas/buscar?nome=${encodeURIComponent(name)}` : `/empresas/buscar?nome=${encodeURIComponent(name)}`;
    try {
      const data = await window.UsinaLinkApi.get(path);
      const fieldMap = {
        cnpj: data.cnpj,
        email: data.email,
        responsavel: data.responsavel,
        cargo: type === "empresa" ? data.cargo : data.especialidade,
        especialidade: data.especialidade,
        telefone: data.telefone
      };
      Object.entries(fieldMap).forEach(([key, value]) => {
        const input = signupForm.querySelector(`[data-field-key="${key}"]`);
        if (input && value) {
          input.value = value;
          applyMaskByKey(input);
          setFieldState(input, "");
        }
      });
      showToast(`${type === "usina" ? "Usina" : "Empresa"} encontrada. Dados preenchidos automaticamente.`);
    } catch (error) {
      showToast(type === "usina" ? "Usina não encontrada. Preencha os dados manualmente." : "Empresa não encontrada. Preencha os dados manualmente.");
    }
  };

  signupForm.addEventListener("input", (event) => {
    const input = event.target.closest('[data-field-key="nome"]');
    if (!input) return;
    window.clearTimeout(signupLookupTimer);
    signupLookupTimer = window.setTimeout(lookupSignupOrganization, 600);
  });

  signupForm.addEventListener("blur", (event) => {
    if (event.target.matches('[data-field-key="nome"]')) lookupSignupOrganization();
  }, true);

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = signupForm.querySelector('[type="submit"]');
    const originalButtonText = submitButton?.textContent || "Cadastrar";
    const accounts = getStoredAccounts();
    const inputs = [...signupForm.querySelectorAll("input[data-field-key]")].filter((input) => !input.closest(".field")?.hidden);
    const errors = inputs.map((input) => {
      applyMaskByKey(input);
      const error = validateSignupInput(input, accounts);
      setFieldState(input, error);
      return error;
    }).filter(Boolean);

    if (errors.length) {
      showToast("Revise os campos destacados antes de continuar");
      inputs.find((input) => input.getAttribute("aria-invalid") === "true")?.focus();
      return;
    }

    const type = signupForm.dataset.accountType || document.querySelector('.choice-card input[type="radio"]:checked')?.value || "empresa";
    if (!window.UsinaLinkApi?.post) {
      showToast("Não foi possível carregar o cliente da API.");
      return;
    }

    const payload = collectSignupPayload(signupForm, type);

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Cadastrando...";
      }
      await window.UsinaLinkApi.post(`/cadastro/${type === "pessoa" ? "pessoa_fisica" : type}`, payload);
      showToast("Cadastro realizado com sucesso");
      // Entra direto na conta recem-criada; se o login automatico falhar, cai na tela de entrar.
      let destino = signupForm.dataset.redirect;
      try {
        const login = await window.UsinaLinkApi.post("/auth/login/" + payload.tipo, { email: payload.email, senha: payload.senha });
        ["usinalinkSession", "accessToken", "tipoUsuario", "nome"].forEach((key) => localStorage.removeItem(key));
        sessionStorage.setItem("accessToken", login.accessToken || login.access_token);
        sessionStorage.setItem("tipoUsuario", login.tipoUsuario);
        sessionStorage.setItem("nome", login.nome || "");
        sessionStorage.setItem("usinalinkSession", JSON.stringify({ tipo: login.tipoUsuario, nome: login.nome || "", empresaId: login.empresa?.idEmpresa, usinaId: login.usina?.idUsina }));
        destino = { usina: "dashboard-usina.html", empresa: "dashboard-empresa.html", pessoa_fisica: "dashboard-pessoa-fisica.html" }[payload.tipo] || destino;
      } catch { /* mantem o redirecionamento para o login */ }
      window.setTimeout(() => { window.location.href = destino; }, 800);
    } catch (error) {
      if (error instanceof TypeError) {
        showToast("Não foi possível conectar ao servidor.");
      } else {
        showToast(error.message);
      }
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }
    }
  });
}

// Segunda etapa do login (verificação em duas etapas por e-mail): o servidor mandou um código de 6 dígitos.
function showTwoFactorStep(loginForm, desafioInfo, onSuccess) {
  let desafio = desafioInfo.desafio;
  const panel = document.createElement("form");
  panel.className = "form two-factor";
  panel.setAttribute("novalidate", "");
  panel.innerHTML = `
    <div class="two-factor-intro" role="status">
      <strong>Confirme seu acesso</strong>
      <p>Enviamos um código de 6 dígitos para <b data-tf-email></b>. Ele vale por alguns minutos. Confira também a caixa de spam.</p>
    </div>
    <label class="field">
      <span>Código de verificação</span>
      <div class="input-icon"><span aria-hidden="true">#</span><input name="codigo" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" placeholder="000000" aria-label="Código de 6 dígitos" required></div>
    </label>
    <button class="btn full" type="submit">Confirmar e entrar</button>
    <div class="two-factor-actions">
      <button class="text-link" type="button" data-tf-reenviar>Reenviar código</button>
      <button class="text-link" type="button" data-tf-voltar>Voltar</button>
    </div>`;
  panel.querySelector("[data-tf-email]").textContent = desafioInfo.email || "seu e-mail";
  loginForm.hidden = true;
  loginForm.after(panel);
  const input = panel.querySelector('input[name="codigo"]');
  const reenviar = panel.querySelector("[data-tf-reenviar]");
  const enviar = panel.querySelector('button[type="submit"]');
  input.focus();
  input.addEventListener("input", () => { input.value = input.value.replace(/\D/g, "").slice(0, 6); });

  let relogio = null;
  const contagem = (segundos) => {
    window.clearInterval(relogio);
    let restante = Math.max(0, Math.round(segundos));
    const atualizar = () => {
      reenviar.disabled = restante > 0;
      reenviar.textContent = restante > 0 ? `Reenviar código em ${restante}s` : "Reenviar código";
      if (restante <= 0) window.clearInterval(relogio);
      restante -= 1;
    };
    atualizar();
    if (restante >= 0) relogio = window.setInterval(atualizar, 1000);
  };
  contagem(desafioInfo.reenvioEmSegundos || 60);

  const erroNoCampo = (mensagem) => { setFieldState(input, mensagem); if (mensagem) showToast(mensagem); };

  panel.querySelector("[data-tf-voltar]").addEventListener("click", () => {
    window.clearInterval(relogio);
    panel.remove();
    loginForm.hidden = false;
    loginForm.querySelector('input[name="senha"], input[id$="-senha"]')?.focus();
  });

  reenviar.addEventListener("click", async () => {
    erroNoCampo("");
    reenviar.disabled = true;
    try {
      const novo = await window.UsinaLinkApi.post("/auth/2fa/reenviar", { desafio });
      desafio = novo.desafio || desafio;
      showToast("Enviamos um novo código para o seu e-mail.");
      input.value = "";
      input.focus();
      contagem(novo.reenvioEmSegundos || 60);
    } catch (error) {
      erroNoCampo(error.message);
      contagem(15);
    }
  });

  panel.addEventListener("submit", async (event) => {
    event.preventDefault();
    erroNoCampo("");
    if (!/^\d{6}$/.test(input.value)) { erroNoCampo("Digite os 6 números do código."); input.focus(); return; }
    enviar.disabled = true;
    try {
      const resultado = await window.UsinaLinkApi.post("/auth/2fa/verificar", { desafio, codigo: input.value });
      window.clearInterval(relogio);
      // O servidor devolve a mesma resposta do login normal; reaproveita o fluxo de sessão.
      desafioInfo.accessToken = resultado.accessToken;
      Object.assign(desafioInfo, resultado);
      onSuccess();
    } catch (error) {
      enviar.disabled = false;
      erroNoCampo(error instanceof TypeError ? "Não foi possível conectar ao servidor." : error.message);
      input.select();
    }
  });
}

document.querySelectorAll(".js-login-form").forEach((form) => {
  const concluirLogin = (result) => {
    const redirect = form.dataset.redirect || "index.html";
    // Sessao por aba (sessionStorage): logar como usina em uma aba nao derruba a empresa logada em outra.
    ["usinalinkSession", "accessToken", "tipoUsuario", "nome"].forEach((key) => localStorage.removeItem(key));
    sessionStorage.setItem("accessToken", result.accessToken || result.access_token);
    sessionStorage.setItem("tipoUsuario", result.tipoUsuario);
    sessionStorage.setItem("nome", result.nome || "");
    sessionStorage.setItem("usinalinkSession", JSON.stringify({
      tipo: result.tipoUsuario,
      nome: result.nome || "",
      empresaId: result.empresa?.idEmpresa,
      usinaId: result.usina?.idUsina
    }));
    showToast("Login realizado com sucesso");
    window.setTimeout(() => { window.location.href = redirect; }, 500);
  };
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailInput = form.querySelector('input[name="email"], input[id$="-email"]');
    const passwordInput = form.querySelector('input[name="senha"], input[id$="-senha"]');
    const tipo = form.dataset.loginType || "empresa";
    const redirect = form.dataset.redirect || "index.html";
    const fields = [emailInput, passwordInput];
    let hasError = false;

    fields.forEach((input) => setFieldState(input, ""));
    if (!emailInput.value.trim()) {
      setFieldState(emailInput, "Informe o e-mail.");
      hasError = true;
    } else if (!isValidEmail(emailInput.value)) {
      setFieldState(emailInput, "Informe um e-mail valido.");
      hasError = true;
    }
    if (!passwordInput.value.trim()) {
      setFieldState(passwordInput, "Informe a senha.");
      hasError = true;
    } else if (passwordInput.value.length < 6) {
      setFieldState(passwordInput, "A senha deve ter no minimo 6 caracteres.");
      hasError = true;
    }
    if (hasError) return;

    try {
      if (!window.UsinaLinkApi) throw new Error("Não foi possível conectar ao servidor. Verifique se o backend esta rodando.");
      const result = await window.UsinaLinkApi.post(`/auth/login/${tipo}`, {
        email: emailInput.value.trim().toLowerCase(),
        senha: passwordInput.value
      });
      if (result.requires2fa) { showTwoFactorStep(form, result, () => concluirLogin(result)); return; }
      concluirLogin(result);
    } catch (error) {
      if (error instanceof TypeError) {
        setFieldState(emailInput, "Não foi possível conectar ao servidor.");
        showToast("Não foi possível conectar ao servidor.");
      } else {
        setFieldState(emailInput, error.message);
        showToast(error.message);
      }
    }
  });
});

const profileData = {
  empresa: {
    cancel: "dashboard-empresa.html",
    button: "btn-primary",
    sections: {
      gerais: {
        title: "Informa\u00e7\u00f5es gerais",
        subtitle: "Dados principais exibidos no perfil comercial da organiza\u00e7\u00e3o.",
        fields: [
          ["Raz\u00e3o Social", "text", "", null, "razaoSocial"],
          ["Nome Fantasia", "text", "", null, "nomeFantasia"],
          ["Setor de Atua\u00e7\u00e3o", "select", "", ["Ind\u00fastria metalmec\u00e2nica", "Minera\u00e7\u00e3o", "Energia", "Automotivo"], "setorAtuacao"],
          ["Porte da Empresa", "select", "", ["Pequeno porte", "M\u00e9dio porte", "Grande porte"], "porte"],
          ["Descri\u00e7\u00e3o / Apresenta\u00e7\u00e3o", "textarea", "", null, "descricao"]
        ]
      },
      contato: { title: "Contato", subtitle: "Canais comerciais e respons\u00e1veis por comunica\u00e7\u00e3o.", fields: [["E-mail comercial", "email", "", null, "email"], ["Telefone", "tel", "", null, "telefone"], ["WhatsApp", "tel", "", null, "whatsapp"], ["Site", "url", "", null, "site"], ["Respons\u00e1vel principal", "text", "", null, "responsavel"]] },
      endereco: { title: "Endere\u00e7o", subtitle: "Localiza\u00e7\u00e3o fiscal e operacional da organiza\u00e7\u00e3o.", fields: [["CEP", "text", "", null, "cep"], ["Rua", "text", "", null, "rua"], ["N\u00famero", "text", "", null, "numero"], ["Bairro", "text", "", null, "bairro"], ["Cidade", "text", "", null, "cidade"], ["Estado", "select", "", ["SP", "MG", "RJ", "PR", "SC", "RS"], "estado"], ["Complemento", "text", "", null, "complemento"]] },
      documentos: { title: "Documentos", subtitle: "Registros e comprovantes usados na valida\u00e7\u00e3o comercial.", fields: [["CNPJ", "text", "", null, "cnpj"], ["Inscri\u00e7\u00e3o Estadual", "text", "", null, "inscricaoEstadual"], ["Contrato Social", "file", "", null, "contratoSocial"], ["Alvar\u00e1", "file", "", null, "alvara"], ["Certifica\u00e7\u00f5es", "text", "", null, "certificacoes"]] },
      seguranca: { title: "Seguran\u00e7a", subtitle: "Proteja o acesso dos usu\u00e1rios vinculados \u00e0 organiza\u00e7\u00e3o.", fields: [["Senha atual", "password", "", null, "senhaAtual"], ["Nova senha", "password", "", null, "novaSenha"], ["Confirmar nova senha", "password", "", null, "confirmarSenha"]] },
      notificacoes: { title: "Notifica\u00e7\u00f5es", subtitle: "Configure quais avisos devem chegar para a equipe.", fields: [["Receber propostas por e-mail", "checkbox", false, null, "propostasEmail"], ["Receber alertas de prazo", "checkbox", false, null, "alertasPrazo"], ["Receber mensagens de fornecedores", "checkbox", false, null, "mensagensFornecedores"], ["Receber resumo semanal", "checkbox", false, null, "resumoSemanal"]] }
    }
  },
  pessoa_fisica: {
    cancel: "dashboard-pessoa-fisica.html",
    button: "btn-primary",
    sections: {
      gerais: { title: "Informações gerais", subtitle: "Seus dados pessoais. O CPF não pode ser alterado.", fields: [["Nome completo", "text", "", null, "nome"]] },
      contato: { title: "Contato", subtitle: "E-mail de acesso e telefone para contato.", fields: [["E-mail", "email", "", null, "email"], ["Telefone", "tel", "", null, "telefone"]] },
      endereco: { title: "Endereço de entrega", subtitle: "Usado para calcular o frete e para as usinas saberem onde entregar seus pedidos.", fields: [["CEP", "text", "", null, "cep"], ["Rua", "text", "", null, "rua"], ["Número", "text", "", null, "numero"], ["Bairro", "text", "", null, "bairro"], ["Cidade", "text", "", null, "cidade"], ["Estado", "select", "", SIGNUP_UFS, "estado"], ["Complemento", "text", "", null, "complemento"]] },
      seguranca: { title: "Segurança", subtitle: "Proteja o acesso à sua conta.", fields: [["Senha atual", "password", "", null, "senhaAtual"], ["Nova senha", "password", "", null, "novaSenha"], ["Confirmar nova senha", "password", "", null, "confirmarSenha"]] }
    }
  },
  usina: {
    cancel: "dashboard-usina.html",
    button: "btn-orange",
    sections: {
      gerais: { title: "Informa\u00e7\u00f5es gerais", subtitle: "Dados industriais exibidos para empresas compradoras.", fields: [["Nome da usina", "text", "", null, "nomeFantasia"], ["Especialidade principal", "text", "", null, "especialidade"], ["Capacidade produtiva", "text", "", null, "capacidadeProducao"], ["Descri\u00e7\u00e3o industrial", "textarea", "", null, "descricao"]] },
      contato: { title: "Contato", subtitle: "Canais da equipe comercial da usina.", fields: [["E-mail industrial", "email", "", null, "email"], ["Telefone", "tel", "", null, "telefone"], ["Respons\u00e1vel comercial", "text", "", null, "responsavel"]] },
      endereco: { title: "Endere\u00e7o", subtitle: "Localiza\u00e7\u00e3o operacional da usina.", fields: [["CEP", "text", "", null, "cep"], ["Rua", "text", "", null, "rua"], ["N\u00famero", "text", "", null, "numero"], ["Bairro", "text", "", null, "bairro"], ["Cidade", "text", "", null, "cidade"], ["Estado", "select", "", ["MG", "SP", "RJ", "PR", "SC", "RS"], "estado"], ["Complemento", "text", "", null, "complemento"]] },
      producao: { title: "Produ\u00e7\u00e3o", subtitle: "Capacidade operacional para avaliar pedidos.", fields: [["M\u00e1quinas dispon\u00edveis", "textarea", "", null, "maquinasDisponiveis"], ["Capacidade mensal", "text", "", null, "capacidadeMensal"], ["Turnos", "select", "", ["1 turno", "2 turnos", "3 turnos"], "turnos"], ["Prazo m\u00e9dio", "text", "", null, "prazoMedio"]] },
      certificacoes: { title: "Certifica\u00e7\u00f5es", subtitle: "Compet\u00eancias e certificados produtivos.", fields: [["ISO 9001", "checkbox", false, null, "iso9001"], ["CNC", "checkbox", false, null, "cnc"], ["Corte laser", "checkbox", false, null, "corteLaser"], ["Fundi\u00e7\u00e3o", "checkbox", false, null, "fundicao"], ["Soldagem", "checkbox", false, null, "soldagem"]] },
      seguranca: { title: "Seguran\u00e7a", subtitle: "Proteja o acesso da equipe da usina.", fields: [["Senha atual", "password", "", null, "senhaAtual"], ["Nova senha", "password", "", null, "novaSenha"], ["Confirmar senha", "password", "", null, "confirmarSenha"]] },
      notificacoes: { title: "Notifica\u00e7\u00f5es", subtitle: "Configure os avisos comerciais da usina.", fields: [["Novos pedidos", "checkbox", false, null, "novosPedidos"], ["Propostas aceitas", "checkbox", false, null, "propostasAceitas"], ["Alertas de prazo", "checkbox", false, null, "alertasPrazo"], ["Mensagens", "checkbox", false, null, "mensagens"]] }
    }
  }
};

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}

function inferMaskKey(label, type) {
  const normalized = String(label || "").toLowerCase();
  if (normalized.includes("cpf")) return "cpf";
  if (normalized.includes("cnpj")) return "cnpj";
  if (normalized.includes("cep")) return "cep";
  if (type === "tel" || normalized.includes("telefone") || normalized.includes("whatsapp")) return "telefone";
  return "";
}

function fieldMarkup(field) {
  const [label, type, value, options, key] = field;
  const nameAttr = key ? ` name="${key}"` : "";
  if (type === "textarea") return `<label class="field span-2"><span>${label}</span><textarea rows="6"${nameAttr}>${escapeHtml(value)}</textarea></label>`;
  if (type === "select") return `<label class="field"><span>${label}</span><div class="input-wrap select-field"><span class="input-symbol" aria-hidden="true">v</span><select${nameAttr}>${options.map((option) => `<option${option === value ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div></label>`;
  if (type === "checkbox") return `<label class="toggle-field span-2"><input type="checkbox"${value ? " checked" : ""}${nameAttr}><span></span><strong>${label}</strong></label>`;
  if (type === "file") return `<label class="field span-2"><span>${label}</span><div class="input-wrap file-field"><input type="file" data-file-key="${key}" accept=".pdf,.jpg,.jpeg,.png"></div><small>${value ? `Arquivo atual: ${escapeHtml(value)}` : "Nenhum arquivo enviado ainda."}</small></label>`;
  const maskKey = inferMaskKey(label, type);
  return `<label class="field"><span>${label}</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">${type === "password" ? "*" : "T"}</span><input type="${type}" value="${escapeHtml(value)}"${nameAttr}${maskKey ? ` data-mask="${maskKey}"` : ""}></div></label>`;
}

function viewFieldMarkup(field) {
  const [label, type] = field;
  if (type === "password") return `<div class="field"><span>${label}</span><div class="view-value">N&atilde;o exibido</div></div>`;
  if (type === "checkbox") return `<div class="field"><span>${label}</span><div class="view-value">${field[2] ? "Ativado" : "Desativado"}</div></div>`;
  const value = field[2];
  const span = type === "textarea" || type === "file" ? " span-2" : "";
  return `<div class="field${span}"><span>${label}</span><div class="view-value">${escapeHtml(value || "-")}</div></div>`;
}

function currentProfileSectionKey() {
  return document.querySelector("[data-profile-section].active")?.dataset.profileSection || "gerais";
}

function renderProfileView(sectionKey) {
  const kind = document.body.dataset.profileKind || "empresa";
  const profile = profileData[kind];
  const section = profile?.sections[sectionKey];
  const view = document.querySelector("#profile-view-mode");
  if (!section || !view) return;
  document.querySelector("#profile-section-title").textContent = section.title;
  document.querySelector("#profile-section-subtitle").textContent = section.subtitle;
  view.innerHTML = `<div class="form-grid">${section.fields.map(viewFieldMarkup).join("")}</div>`;
}

function renderProfileSection(sectionKey) {
  const kind = document.body.dataset.profileKind || "empresa";
  const profile = profileData[kind];
  const section = profile?.sections[sectionKey];
  const form = document.querySelector("#profile-dynamic-form");
  if (!section || !form) return;
  document.querySelector("#profile-section-title").textContent = section.title;
  document.querySelector("#profile-section-subtitle").textContent = section.subtitle;
  form.innerHTML = `${section.fields.map(fieldMarkup).join("")}
    <div class="form-actions span-2">
      <button class="btn btn-ghost js-cancel-profile-edit" type="button">Cancelar</button>
      <button class="btn ${profile.button}" type="submit">Salvar altera\u00e7\u00f5es</button>
    </div>`;
}

if (document.querySelector("#profile-dynamic-form")) {
  renderProfileView("gerais");
  renderProfileSection("gerais");
}

document.querySelectorAll("[data-profile-section]").forEach((item) => {
  item.addEventListener("click", (event) => {
    event.preventDefault();
    item.closest(".sidebar-card").querySelectorAll("a").forEach((link) => link.classList.remove("active"));
    item.classList.add("active");
    renderProfileView(item.dataset.profileSection);
    renderProfileSection(item.dataset.profileSection);
    // Segurança só tem campos de edição: abre direto o formulário.
    if (item.dataset.profileSection === "seguranca" && !document.querySelector("#profile-view-mode")?.classList.contains("is-hidden")) toggleProfileEdit(false);
  });
});

function toggleProfileEdit(forceView) {
  const viewMode = document.querySelector("#profile-view-mode");
  const formMode = document.querySelector("#profile-dynamic-form");
  const editButton = document.querySelector(".js-toggle-profile-edit");
  if (!viewMode || !formMode) return;
  const currentlyViewing = !viewMode.classList.contains("is-hidden");
  const goToViewing = forceView || !currentlyViewing;
  viewMode.classList.toggle("is-hidden", !goToViewing);
  formMode.classList.toggle("is-hidden", goToViewing);
  if (editButton) editButton.textContent = goToViewing ? "Editar perfil" : "Cancelar edi\u00e7\u00e3o";
  if (goToViewing) renderProfileView(currentProfileSectionKey());
  else renderProfileSection(currentProfileSectionKey());
}

document.querySelectorAll(".js-toggle-profile-edit").forEach((button) => {
  button.addEventListener("click", () => toggleProfileEdit(false));
});

document.addEventListener("click", (event) => {
  if (event.target.closest(".js-cancel-profile-edit")) toggleProfileEdit(true);
});

function ensureHistoryEmptyState() {
  const emptyState = document.querySelector("[data-history-empty]");
  const tableBody = document.querySelector("[data-history-body]");
  const historyCards = document.querySelector("[data-history-cards]");
  
  if (!emptyState || !tableBody) return;
  
  const hasRecords = tableBody.children.length > 0 || (historyCards && historyCards.children.length > 0);
  emptyState.hidden = hasRecords;
}

document.querySelectorAll("[data-history-body]").forEach(() => {
  ensureHistoryEmptyState();
});

const historyObserver = new MutationObserver(() => ensureHistoryEmptyState());
document.querySelectorAll("[data-history-body]").forEach((body) => {
  historyObserver.observe(body, { childList: true });
});

document.querySelectorAll(".js-demo-form").forEach((form) => {
  if (form.classList.contains("signup-dynamic-form")) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const submitter = event.submitter;
    const label = submitter ? submitter.textContent.trim() : "A\u00e7\u00e3o";
    const redirect = form.dataset.redirect;
    showToast(`${label} realizado com sucesso`);
    if (redirect) window.setTimeout(() => { window.location.href = redirect; }, 700);
  });
});

function ensureActionModal() {
  let modal = document.querySelector("#action-modal");
  if (modal) return modal;
  modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.id = "action-modal";
  modal.hidden = true;
  modal.innerHTML = `
    <section class="card modal-card action-modal-card" role="dialog" aria-modal="true" aria-labelledby="action-modal-title">
      <div class="modal-header">
        <div><span class="eyebrow" id="action-modal-kicker">Detalhes</span><h2 id="action-modal-title">Detalhes</h2></div>
        <button class="modal-close js-action-modal-close" type="button" aria-label="Fechar">x</button>
      </div>
      <div id="action-modal-body"></div>
    </section>`;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal || event.target.closest(".js-action-modal-close")) modal.hidden = true;
  });
  return modal;
}

function openActionModal({ title, kicker = "Detalhes", body }) {
  const modal = ensureActionModal();
  modal.querySelector("#action-modal-kicker").textContent = kicker;
  modal.querySelector("#action-modal-title").textContent = title;
  modal.querySelector("#action-modal-body").innerHTML = body;
  modal.hidden = false;
}

function rowCells(row) {
  return [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim());
}

function badgeClass(status) {
  if (/aceita|ativo/i.test(status)) return "success";
  if (/analise|pendente|alta/i.test(status)) return "warning";
  if (/cancelada|recusada|inativo/i.test(status)) return "muted";
  return "info";
}

function setRowStatus(row, status) {
  const badge = row.querySelector(".badge");
  if (!badge) return;
  badge.className = `badge ${badgeClass(status)}`;
  badge.textContent = status;
  renderEmployeeRowActions(row);
}

function employeeStatus(row) {
  return row?.querySelector(".badge")?.textContent.trim() || "";
}

function renderEmployeeRowActions(row) {
  if (!row?.closest("[data-employee-table]")) return;
  const actionsCell = row.children[row.children.length - 1];
  const status = employeeStatus(row);
  const actionsByStatus = {
    Pendente: ["Editar", "Reenviar convite", "Cancelar convite"],
    Ativo: ["Editar", "Excluir"],
    Inativo: ["Ativar", "Excluir definitivamente"]
  };
  const actions = actionsByStatus[status] || ["Editar"];
  actionsCell.innerHTML = `
    <div class="actions-menu">
      <button class="icon-action" type="button" aria-label="${escapeHtml(`Abrir ações de ${row.children[0]?.textContent.trim() || "funcionário"}`)}">...</button>
      <div class="actions-menu-list" role="menu">
        ${actions.map(action => `<button class="table-action js-alert" type="button" role="menuitem">${action}</button>`).join("")}
      </div>
    </div>`;
}

function employeeRowMarkup(item) {
  const status = item.status || "Pendente";
  return `<tr data-search-row data-employee-id="${escapeHtml(item.id || "")}"><td>${escapeHtml(item.nome || "")}</td><td>${escapeHtml(item.email || "")}</td><td>${escapeHtml(item.cargo || "-")}</td><td>${escapeHtml(item.tipo || "-")}</td><td><span class="badge ${statusClass(status)}">${escapeHtml(status)}</span></td><td></td></tr>`;
}

async function loadEmployeesFromApi() {
  if (!window.UsinaLinkApi) return;
  document.querySelectorAll("[data-employee-table]").forEach(async (table) => {
    try {
      const context = table.dataset.employeeTable;
      const employees = await window.UsinaLinkApi.get(`/funcionarios?contexto=${encodeURIComponent(context)}`);
      table.innerHTML = employees.map(employeeRowMarkup).join("") || '<tr><td colspan="6" class="td-empty">Nenhum funcionário cadastrado ainda. Use "Adicionar funcionário" no topo da página.</td></tr>';
      table.querySelectorAll("tr[data-employee-id]").forEach(renderEmployeeRowActions);
    } catch (error) {
      table.innerHTML = `<tr><td colspan="6" class="td-empty">Falha ao carregar funcionários: ${escapeHtml(error.message)}</td></tr>`;
    }
  });
}

function renderProposalDetails(data, includeDecision = false) {
  return `
    <div class="proposal-detail-head">
      <div><span>Usina</span><strong>${escapeHtml(data.usina || data[1] || "Usina")}</strong></div>
      <strong class="modal-price">${escapeHtml(data.valor || data[2] || "R$ 0,00")}</strong>
    </div>
    <div class="action-modal-grid">
      <div><span>Prazo de fabricação</span><strong>${escapeHtml(formatPrazo(data.prazo || data[3], "18 dias"))}</strong></div>
      <div><span>Frete</span><strong>${escapeHtml(data.frete || "R$ 950,00")}</strong></div>
      <div><span>Avaliacao</span><strong>${escapeHtml(data.avaliacao || "4,8/5")}</strong></div>
      <div><span>Regiao</span><strong>${escapeHtml(data.regiao || "Sudeste")}</strong></div>
      <div><span>Peça/Pedido</span><strong>${escapeHtml(data.peca || data[0] || "Peça industrial")}</strong></div>
      <div><span>Material</span><strong>${escapeHtml(data.material || "Aco carbono")}</strong></div>
      <div><span>Quantidade</span><strong>${escapeHtml(data.quantidade || "60 unidades")}</strong></div>
      <div><span>Arquivo tecnico</span><strong>${escapeHtml(data.arquivo || "arquivo-tecnico.pdf")}</strong></div>
    </div>
    <div class="detail-list"><div><span>Observações</span><strong>${escapeHtml(data.observacao || "Proposta com condicoes comerciais completas.")}</strong></div></div>
    <div class="form-actions">
      <button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button>
      ${includeDecision ? '<button class="btn js-modal-accept-proposal" type="button">Aceitar proposta</button><button class="btn btn-ghost js-modal-reject-proposal" type="button">Recusar proposta</button>' : ""}
    </div>`;
}

function currentSession() {
  try {
    return JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null") || {};
  } catch {
    return {};
  }
}

function applySessionContext() {
  const session = currentSession();
  if (!session?.tipo) return;
  const role = document.body?.dataset.userRole || document.body?.dataset.profileKind;
  if (!role || session.tipo !== role) return;

  const displayName = session.nome || (role === "usina" ? "Minha usina" : role === "pessoa_fisica" ? "Minha conta" : "Minha empresa");
  const headerTitle = document.querySelector(".app-header h1");
  if (headerTitle) headerTitle.textContent = displayName;

  const userName = document.querySelector(".user-strip strong");
  if (userName) userName.textContent = displayName;

  const userRole = document.querySelector(".user-strip span");
  if (userRole) userRole.textContent = role === "usina" ? "Conta da usina" : role === "pessoa_fisica" ? "Conta de pessoa fisica" : "Conta da empresa";

  const profileTitle = document.querySelector(".profile-head h1");
  if (profileTitle) profileTitle.textContent = displayName;

  const profileSubtitle = document.querySelector(".profile-head p");
  if (profileSubtitle) profileSubtitle.textContent = role === "usina" ? "Perfil industrial da usina logada." : role === "pessoa_fisica" ? "Atualize seus dados pessoais e de acesso." : "Perfil comercial da empresa logada.";
}

function proposalActionsMarkup(status, nome = "") {
  const locked = ["Aceita", "Cancelada", "Recusada"].includes(status);
  const extras = locked ? [] : ["Cancelar proposta"];
  return `
    <div class="row-actions">
      <button class="table-action js-alert" type="button">Ver detalhes</button>
      ${extras.length ? `<div class="actions-menu">
        <button class="icon-action" type="button" aria-label="Mais ações da proposta${nome ? " de " + escapeHtml(nome) : ""}">...</button>
        <div class="actions-menu-list" role="menu">
          ${extras.map(action => `<button class="table-action js-alert" type="button" role="menuitem">${action}</button>`).join("")}
        </div>
      </div>` : ""}
    </div>`;
}

function renderProposalRowActions(row) {
  if (!row || row.children.length < 7) return;
  const status = row.querySelector(".badge")?.textContent.trim() || "Enviada";
  row.children[row.children.length - 1].innerHTML = proposalActionsMarkup(status, row.children[0]?.textContent.trim());
}

function proposalRowMarkup(item) {
  const status = statusPropostaLabel(item.status);
  const peca = item.pedido?.itens?.[0]?.nome || "Peça industrial";
  const cliente = item.pedido?.empresaCompradora?.nomeFantasia || item.pedido?.empresaCompradora?.razaoSocial || "-";
  const dataEnvio = item.dataEnvio ? new Date(item.dataEnvio).toLocaleDateString("pt-BR") : "";
  return `<tr data-search-row data-proposal-id="${escapeHtml(item.idProposta)}"><td>${escapeHtml(peca)}</td><td>${escapeHtml(cliente)}</td><td>${escapeHtml(formatMoneyBR(item.valor))}</td><td>${escapeHtml(formatPrazo(item.prazo))}</td><td><span class="badge ${badgeClass(status)}">${escapeHtml(status)}</span></td><td>${escapeHtml(dataEnvio)}</td><td>${proposalActionsMarkup(status, peca)}</td></tr>`;
}

let ultimasPropostasRecebidas = [];
let ultimasPropostasEnviadas = [];

function formatMoneyBR(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "A combinar";
}

function nomeUsinaProposta(usina) {
  return usina?.nomeFantasia || usina?.razaoSocial || "Usina";
}

function statusPropostaLabel(status) {
  const labels = { enviada: "Enviada", em_analise: "Em analise", aceita: "Aceita", recusada: "Recusada", cancelada: "Cancelada" };
  return labels[status] || status || "Enviada";
}

function propostaEstaTravada(status) {
  return !["enviada", "em_analise"].includes(status || "enviada");
}

function proposalCardMarkup(item, best) {
  const status = item.status || "enviada";
  const aceita = status === "aceita";
  const travada = propostaEstaTravada(status);
  const statusPedido = item.pedido?.status;
  const rotuloAceita = statusPedido === "em_producao" ? "Acompanhar pedido" : "Pagar pedido";
  const decisaoBtn = aceita && statusPedido === "concluido"
    ? `<a class="btn btn-ghost" href="detalhes-pedido.html?pedidoId=${encodeURIComponent(item.idPedido)}">Pedido concluído</a>`
    : aceita
    ? `<a class="btn" href="${statusPedido === "em_producao" ? "detalhes-pedido.html" : "pagamento-pedido.html"}?pedidoId=${encodeURIComponent(item.idPedido)}">${rotuloAceita}</a>`
    : travada
      ? `<button class="btn btn-ghost" type="button" disabled>${escapeHtml(statusPropostaLabel(status))}</button>`
      : '<button class="btn js-alert" type="button">Aceitar proposta</button><button class="btn btn-ghost js-alert" type="button">Recusar proposta</button>';
  return `<article class="card proposal-card ${best && !travada ? "best" : ""} ${aceita ? "accepted" : ""}" data-search-row data-proposal-id="${escapeHtml(item.idProposta)}">
    ${best && !travada ? '<span class="best-label">Melhor proposta</span>' : ""}
    <h2>${escapeHtml(nomeUsinaProposta(item.usina))}</h2>
    <strong class="price">${escapeHtml(formatMoneyBR(item.valor))}</strong>
    <dl><div><dt>Prazo de fabricação</dt><dd>${escapeHtml(formatPrazo(item.prazo))}</dd></div><div><dt>Frete</dt><dd>${escapeHtml(item.frete ? formatMoneyBR(item.frete) : "A combinar")}</dd></div><div><dt>Entrega em</dt><dd>${escapeHtml(item.pedido?.localEntrega || "Não informado")}</dd></div><div><dt>Status</dt><dd>${escapeHtml(statusPropostaLabel(status))}</dd></div></dl>
    <p>${escapeHtml(item.observacao || "Sem observações adicionais.")}</p>
    <div class="card-actions"><button class="btn btn-ghost js-alert" type="button">Ver detalhes</button>${decisaoBtn}</div>
  </article>`;
}

function renderSentProposalDetails(item) {
  const status = item.status || "enviada";
  const pedido = item.pedido || {};
  const itemPedido = pedido.itens?.[0] || {};
  const cliente = pedido.empresaCompradora?.nomeFantasia || pedido.empresaCompradora?.razaoSocial || "-";
  const dataEnvio = item.dataEnvio ? new Date(item.dataEnvio).toLocaleDateString("pt-BR") : "-";
  const quantidade = itemPedido.quantidade ? String(itemPedido.quantidade) : "-";
  return `
    <div class="proposal-detail-head">
      <div><span>Cliente</span><strong>${escapeHtml(cliente)}</strong></div>
      <strong class="modal-price">${escapeHtml(formatMoneyBR(item.valor))}</strong>
    </div>
    <div class="action-modal-grid">
      <div><span>Prazo de fabricação</span><strong>${escapeHtml(formatPrazo(item.prazo))}</strong></div>
      <div><span>Frete</span><strong>${escapeHtml(item.frete ? formatMoneyBR(item.frete) : "A combinar")}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(statusPropostaLabel(status))}</strong></div>
      <div><span>Enviada em</span><strong>${escapeHtml(dataEnvio)}</strong></div>
      <div><span>Peça/Pedido</span><strong>${escapeHtml(itemPedido.nome || "Peça industrial")}</strong></div>
      <div><span>Material</span><strong>${escapeHtml(itemPedido.material || "-")}</strong></div>
      <div><span>Quantidade</span><strong>${escapeHtml(quantidade)}</strong></div>
      <div><span>Pedido</span><strong>${escapeHtml(pedido.numeroPedido || "-")}</strong></div>
      <div class="span-2"><span>Local de entrega</span><strong>${escapeHtml(pedido.localEntrega || "Não informado")}</strong></div>
    </div>
    <div class="detail-list"><div><span>Observações da proposta</span><strong>${escapeHtml(item.observacao || "Sem observações adicionais.")}</strong></div></div>
    <div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button></div>`;
}

function renderReceivedProposalDetails(item) {
  const status = item.status || "enviada";
  const travada = propostaEstaTravada(status);
  return `
    <div class="proposal-detail-head">
      <div><span>Usina</span><strong>${escapeHtml(nomeUsinaProposta(item.usina))}</strong></div>
      <strong class="modal-price">${escapeHtml(formatMoneyBR(item.valor))}</strong>
    </div>
    <div class="action-modal-grid">
      <div><span>Prazo de fabricação</span><strong>${escapeHtml(formatPrazo(item.prazo))}</strong></div>
      <div><span>Frete</span><strong>${escapeHtml(item.frete ? formatMoneyBR(item.frete) : "A combinar")}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(statusPropostaLabel(status))}</strong></div>
      <div><span>Pedido</span><strong>${escapeHtml(item.pedido?.numeroPedido || "-")}</strong></div>
      <div class="span-2"><span>Local de entrega</span><strong>${escapeHtml(item.pedido?.localEntrega || "Não informado")}</strong></div>
    </div>
    <div class="detail-list"><div><span>Observações</span><strong>${escapeHtml(item.observacao || "Sem observações adicionais.")}</strong></div></div>
    <div class="form-actions">
      <button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button>
      ${travada ? "" : '<button class="btn js-modal-accept-proposal" type="button">Aceitar proposta</button><button class="btn btn-ghost js-modal-reject-proposal" type="button">Recusar proposta</button>'}
    </div>`;
}

async function loadProposalsFromApi() {
  if (!window.UsinaLinkApi) return;
  const usinaTable = document.querySelector("body[data-user-role='usina'] tbody");
  if (document.body.dataset.userRole === "usina" && usinaTable && window.location.pathname.includes("propostas-usina")) {
    try {
      const proposals = await window.UsinaLinkApi.get(`/propostas/enviadas`);
      ultimasPropostasEnviadas = proposals;
      usinaTable.innerHTML = proposals.map(proposalRowMarkup).join("") || '<tr><td colspan="7">Nenhuma proposta enviada.</td></tr>';
    } catch (error) {
      showToast(error.message);
    }
  }
  const empresaGrid = document.querySelector("[data-proposals-grid]");
  if (empresaGrid) {
    try {
      const proposals = await window.UsinaLinkApi.get(`/propostas/recebidas`);
      ultimasPropostasRecebidas = proposals;
      const melhorValor = Math.min(...proposals.filter(p => !propostaEstaTravada(p.status)).map(p => Number(p.valor) || Infinity));
      empresaGrid.innerHTML = proposals.length
        ? proposals.map((item) => proposalCardMarkup(item, Number(item.valor) === melhorValor)).join("")
        : '<div class="empty-state"><strong>Nenhuma proposta recebida</strong><span>As propostas enviadas pelas usinas aparecem aqui. Publique uma solicitação para começar a receber.</span><a class="btn btn-small" href="nova-solicitacao.html">Nova solicitação</a></div>';
    } catch (error) {
      empresaGrid.innerHTML = `<article class="card proposal-card"><h2>Falha ao carregar propostas</h2><p>${escapeHtml(error.message)}</p></article>`;
    }
  }
}

function openEmployeeEdit(row) {
  const cells = rowCells(row);
  openActionModal({
    title: "Editar funcionario",
    kicker: "Equipe",
    body: `
      <form class="form-grid js-inline-employee-edit">
        <label class="field"><span>Nome</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">N</span><input name="name" value="${escapeHtml(cells[0])}"></div></label>
        <label class="field"><span>E-mail</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">@</span><input name="email" type="email" value="${escapeHtml(cells[1])}"></div></label>
        <label class="field"><span>Cargo</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">C</span><input name="role" value="${escapeHtml(cells[2])}"></div></label>
        <div class="form-actions span-2"><button class="btn btn-ghost js-action-modal-close" type="button">Cancelar</button><button class="btn btn-primary" type="submit">Salvar</button></div>
      </form>`
  });
  const form = document.querySelector(".js-inline-employee-edit");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    row.children[0].textContent = data.get("name");
    row.children[1].textContent = data.get("email");
    row.children[2].textContent = data.get("role");
    const finish = () => {
      ensureActionModal().hidden = true;
      showToast("Funcionario atualizado com sucesso");
    };
    if (window.UsinaLinkApi && row.dataset.employeeId) {
      window.UsinaLinkApi.put(`/funcionarios/${row.dataset.employeeId}`, {
        nome: data.get("name"),
        email: data.get("email"),
        cargo: data.get("role")
      }).then(finish).catch((error) => showToast(error.message));
    } else {
      finish();
    }
  });
}

function openProposalEdit(row) {
  const cells = rowCells(row);
  openActionModal({
    title: "Editar proposta",
    kicker: "Comercial",
    body: `
      <form class="form-grid js-inline-proposal-edit">
        <label class="field"><span>Valor</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">R$</span><input name="valor" value="${escapeHtml(cells[2])}"></div></label>
        <label class="field"><span>Prazo</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">P</span><input name="prazo" value="${escapeHtml(cells[3])}"></div></label>
        <label class="field"><span>Frete</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">F</span><input name="frete" value="R$ 950,00"></div></label>
        <label class="field"><span>Observacao</span><div class="input-wrap"><span class="input-symbol" aria-hidden="true">O</span><input name="observacao" value="Proposta com inspecao dimensional."></div></label>
        <div class="form-actions span-2"><button class="btn btn-ghost js-action-modal-close" type="button">Cancelar</button><button class="btn btn-orange" type="submit">Salvar proposta</button></div>
      </form>`
  });
  document.querySelector(".js-inline-proposal-edit").addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    row.children[2].textContent = data.get("valor");
    row.children[3].textContent = data.get("prazo");
    ensureActionModal().hidden = true;
    showToast("Proposta atualizada com sucesso");
  });
}

function openSimpleConfirm({ title, message, confirmText, onConfirm, orange = false, cancelText = "Voltar" }) {
  openActionModal({
    title,
    kicker: "Confirmacao",
    body: `<p class="modal-copy">${escapeHtml(message)}</p><div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">${escapeHtml(cancelText)}</button><button class="btn ${orange ? "btn-orange" : "btn-primary"} js-modal-confirm" type="button">${escapeHtml(confirmText)}</button></div>`
  });
  document.querySelector(".js-modal-confirm").addEventListener("click", () => {
    onConfirm();
    ensureActionModal().hidden = true;
  });
}

let modalPropostaId = null;

async function decidirProposta(idProposta, aceitar) {
  if (!window.UsinaLinkApi || !idProposta) return;
  try {
    const proposta = ultimasPropostasRecebidas.find((p) => String(p.idProposta) === String(idProposta));
    await window.UsinaLinkApi.patch(`/propostas/${idProposta}/${aceitar ? "aceitar" : "recusar"}`, {});
    ensureActionModal().hidden = true;
    if (aceitar && proposta?.idPedido) {
      showToast("Proposta aceita. Vamos ao pagamento.");
      window.setTimeout(() => { window.location.href = `pagamento-pedido.html?pedidoId=${encodeURIComponent(proposta.idPedido)}`; }, 700);
      return;
    }
    showToast(aceitar ? "Proposta aceita com sucesso" : "Proposta recusada");
    await loadProposalsFromApi();
  } catch (error) {
    showToast(error.message);
  }
}

document.addEventListener("click", (event) => {
  if (event.target.closest(".js-modal-accept-proposal")) {
    decidirProposta(modalPropostaId, true);
    return;
  }
  if (event.target.closest(".js-modal-reject-proposal")) {
    decidirProposta(modalPropostaId, false);
    return;
  }
  const button = event.target.closest(".js-alert");
  if (!button) return;
  const action = button.textContent.trim();
  const row = button.closest("tr");
  const card = button.closest(".proposal-card");
  const commercialCard = button.closest(".order-opportunity");

  if (commercialCard && action === "Ver detalhes") {
    const title = commercialCard.querySelector("h2")?.textContent.trim() || "Peça comercial";
    const description = commercialCard.querySelector("p")?.textContent.trim() || "";
    const facts = [...commercialCard.querySelectorAll(".quote-facts div")].map((item) => `<div><span>${escapeHtml(item.querySelector("span")?.textContent || "")}</span><strong>${escapeHtml(item.querySelector("strong")?.textContent || "")}</strong></div>`).join("");
    openActionModal({
      title,
      kicker: "Peça comercial",
      body: `<div class="detail-list"><div><span>Material</span><strong>${escapeHtml(description)}</strong></div></div><div class="action-modal-grid">${facts}</div><div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button></div>`
    });
    return;
  }

  if (commercialCard && action === "Solicitar compra") {
    const title = commercialCard.querySelector("h2")?.textContent.trim() || "peca comercial";
    openSimpleConfirm({
      title: "Solicitar compra",
      message: `Deseja registrar interesse de compra para ${title}?`,
      confirmText: "Confirmar interesse",
      onConfirm: () => showToast("Solicitacao comercial registrada")
    });
    return;
  }

  if (card && action === "Ver detalhes" && card.dataset.proposalId) {
    modalPropostaId = card.dataset.proposalId;
    const item = ultimasPropostasRecebidas.find((p) => String(p.idProposta) === modalPropostaId);
    openActionModal({ title: "Detalhes da proposta", kicker: "Proposta recebida", body: renderReceivedProposalDetails(item || {}) });
    return;
  }
  if (card && action === "Aceitar proposta" && card.dataset.proposalId) {
    const p = ultimasPropostasRecebidas.find((x) => String(x.idProposta) === String(card.dataset.proposalId)) || {};
    openSimpleConfirm({
      title: "Aceitar proposta",
      message: `Aceitar a proposta de ${nomeUsinaProposta(p.usina)} por ${formatMoneyBR(p.valor)}, prazo de ${formatPrazo(p.prazo).toLowerCase()}? Depois de aceitar, você segue para o pagamento.`,
      confirmText: "Aceitar proposta",
      onConfirm: () => decidirProposta(card.dataset.proposalId, true)
    });
    return;
  }
  if (card && action === "Recusar proposta" && card.dataset.proposalId) {
    const p = ultimasPropostasRecebidas.find((x) => String(x.idProposta) === String(card.dataset.proposalId)) || {};
    openSimpleConfirm({
      title: "Recusar proposta",
      message: `Recusar a proposta de ${nomeUsinaProposta(p.usina)} por ${formatMoneyBR(p.valor)}? Essa decisão não pode ser desfeita.`,
      confirmText: "Recusar proposta",
      onConfirm: () => decidirProposta(card.dataset.proposalId, false)
    });
    return;
  }
  if (row && action === "Ver detalhes") {
    const enviada = ultimasPropostasEnviadas.find((p) => String(p.idProposta) === String(row.dataset.proposalId));
    if (enviada) {
      openActionModal({ title: "Detalhes da proposta", kicker: "Proposta enviada", body: renderSentProposalDetails(enviada) });
      return;
    }
    const cells = rowCells(row);
    openActionModal({ title: "Detalhes da proposta", kicker: "Proposta enviada", body: renderProposalDetails(cells) });
    return;
  }
  if (row && action === "Editar proposta") {
    openProposalEdit(row);
    return;
  }
  if (row && action === "Cancelar proposta") {
    openSimpleConfirm({ title: "Cancelar proposta", message: "Confirma o cancelamento desta proposta? Ela sera mantida no historico, mas sumira das listagens principais.", confirmText: "Cancelar proposta", orange: true, onConfirm: () => {
      const finish = () => {
        setRowStatus(row, "Cancelada");
        row.classList.add("is-hidden");
        showToast("Proposta cancelada");
      };
      if (window.UsinaLinkApi && row.dataset.proposalId) window.UsinaLinkApi.patch(`/propostas/${row.dataset.proposalId}/cancelar`, {}).then(finish).catch((error) => showToast(error.message));
      else finish();
    } });
    return;
  }
  if (row && action === "Editar") {
    openEmployeeEdit(row);
    return;
  }
  if (row && action === "Reenviar convite") {
    openSimpleConfirm({ title: "Reenviar convite", message: "Enviar um novo convite para este funcionario?", confirmText: "Reenviar convite", onConfirm: () => {
      if (window.UsinaLinkApi && row.dataset.employeeId) {
        window.UsinaLinkApi.post(`/funcionarios/${row.dataset.employeeId}/reenviar-convite`, {}).then(() => showToast("Convite reenviado com sucesso")).catch((error) => showToast(error.message));
      } else showToast("Convite reenviado com sucesso");
    } });
    return;
  }
  if (row && action === "Cancelar convite") {
    openSimpleConfirm({ title: "Cancelar convite", message: "Deseja cancelar este convite pendente?", confirmText: "Cancelar convite", onConfirm: () => {
      const finish = () => { setRowStatus(row, "Inativo"); showToast("Convite cancelado"); };
      if (window.UsinaLinkApi && row.dataset.employeeId) window.UsinaLinkApi.put(`/funcionarios/${row.dataset.employeeId}/inativar`, {}).then(finish).catch((error) => showToast(error.message));
      else finish();
    } });
    return;
  }
  if (row && action === "Ativar") {
    openSimpleConfirm({ title: "Ativar funcionario", message: "Deseja ativar este funcionario novamente?", confirmText: "Ativar", onConfirm: () => {
      const finish = () => { setRowStatus(row, "Ativo"); showToast("Funcionario ativado com sucesso"); };
      if (window.UsinaLinkApi && row.dataset.employeeId) window.UsinaLinkApi.put(`/funcionarios/${row.dataset.employeeId}/ativar`, {}).then(finish).catch((error) => showToast(error.message));
      else finish();
    } });
    return;
  }
  if (row && action === "Excluir") {
    openSimpleConfirm({ title: "Inativar funcionario", message: "Este funcionario ficara Inativo. Para remover definitivamente, clique em Excluir definitivamente depois.", confirmText: "Inativar", onConfirm: () => {
      const finish = () => { setRowStatus(row, "Inativo"); showToast("Funcionario inativado"); };
      if (window.UsinaLinkApi && row.dataset.employeeId) window.UsinaLinkApi.put(`/funcionarios/${row.dataset.employeeId}/inativar`, {}).then(finish).catch((error) => showToast(error.message));
      else finish();
    } });
    return;
  }
  if (row && action === "Excluir definitivamente") {
    openSimpleConfirm({ title: "Excluir definitivamente", message: "Esta acao remove o funcionario da tabela e do banco.", confirmText: "Excluir definitivamente", onConfirm: () => {
      const finish = () => { row.remove(); showToast("Funcionario excluido definitivamente"); };
      if (window.UsinaLinkApi && row.dataset.employeeId) window.UsinaLinkApi.delete(`/funcionarios/${row.dataset.employeeId}`).then(finish).catch((error) => showToast(error.message));
      else finish();
    } });
    return;
  }
  showToast(`${action} acionado`);
});

document.querySelectorAll(".js-table-search").forEach((input) => {
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    const container = input.closest("[data-search-scope]") || document;
    container.querySelectorAll("[data-search-row]").forEach((row) => {
      row.classList.toggle("is-hidden", query && !row.textContent.toLowerCase().includes(query));
    });
  });
});

function applyOrderFilter(container, filter) {
  const rows = [...container.querySelectorAll("[data-search-row]")];
  rows.forEach((row) => {
    let visible = true;
    if (filter === "alta") visible = row.dataset.urgency === "alta";
    row.classList.toggle("is-hidden", !visible);
  });
  if (filter === "prazo") {
    rows.sort((a, b) => Number(a.dataset.days || 999) - Number(b.dataset.days || 999));
    const parent = rows[0]?.parentElement;
    if (parent) rows.forEach((row) => parent.appendChild(row));
  }
}

document.querySelectorAll(".js-order-filter").forEach((button) => {
  button.addEventListener("click", () => {
    const container = button.closest("[data-search-scope]");
    button.parentElement.querySelectorAll(".filter-pill").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    applyOrderFilter(container, button.dataset.filter);
  });
});

const orderModal = document.querySelector("#order-modal");
function closeOrderModal() {
  if (orderModal) orderModal.hidden = true;
}

document.addEventListener("click", (event) => {
  const button = event.target.closest(".js-open-order-detail");
  if (!button) return;
  {
    const row = button.closest("[data-search-row]");
    const cells = row.querySelectorAll("td");
    const facts = {};
    row.querySelectorAll(".quote-facts div").forEach((item) => {
      const key = item.querySelector("span")?.textContent.trim().toLowerCase();
      const value = item.querySelector("strong")?.textContent.trim();
      if (key) facts[key] = value;
    });
    const title = row.querySelector("h2")?.textContent || cells[0]?.textContent || "Pedido";
    const material = row.dataset.material || cells[1]?.textContent || facts.material || "Não informado";
    const quantity = row.dataset.quantidade || cells[2]?.textContent || facts.quantidade || "Não informado";
    const dias = Number(row.dataset.days);
    const deadline = cells[3]?.textContent || (dias && dias < 999 ? `${dias} dias` : facts.prazo || "A combinar");
    const region = cells[4]?.textContent || row.dataset.region || facts["regi\u00e3o"] || "Não informado";
    document.querySelector("#order-modal-title").textContent = title;
    document.querySelector("#order-modal-content").innerHTML = `
      <div><span>Detalhes da pe\u00e7a</span><strong>${escapeHtml(title)}</strong></div>
      <div><span>Material</span><strong>${escapeHtml(material)}</strong></div>
      <div><span>Quantidade</span><strong>${escapeHtml(quantity)}</strong></div>
      <div><span>Descri\u00e7\u00e3o t\u00e9cnica</span><strong>${escapeHtml(row.dataset.description || "Sem descri\u00e7\u00e3o adicional.")}</strong></div>
      <div><span>Arquivo t\u00e9cnico</span><strong>${escapeHtml(row.dataset.file || "Sem arquivo anexado")}</strong>${window.UsinaLinkArquivosPedido?.[row.dataset.pedidoId] ? `<div class="card-actions"><button class="btn btn-ghost btn-small" type="button" data-arquivo-acao="visualizar" data-pedido-id="${escapeHtml(row.dataset.pedidoId)}">Visualizar</button><button class="btn btn-orange btn-small" type="button" data-arquivo-acao="baixar" data-pedido-id="${escapeHtml(row.dataset.pedidoId)}">Baixar</button></div>` : ""}</div>
      <div><span>Prazo desejado</span><strong>${escapeHtml(deadline)}</strong></div>
      <div><span>Regi\u00e3o</span><strong>${escapeHtml(region)}</strong></div>`;
    const sendLink = orderModal?.querySelector(".btn-orange");
    if (sendLink) sendLink.href = row.dataset.pedidoId ? `enviar-proposta.html?pedidoId=${encodeURIComponent(row.dataset.pedidoId)}` : "enviar-proposta.html";
    if (orderModal) orderModal.hidden = false;
  }
});

document.querySelectorAll(".js-close-order-modal").forEach((button) => button.addEventListener("click", closeOrderModal));
if (orderModal) orderModal.addEventListener("click", (event) => { if (event.target === orderModal) closeOrderModal(); });

function statusClass(status) {
  if (status === "Ativo") return "success";
  if (status === "Pendente") return "warning";
  return "muted";
}

const employeeModal = document.querySelector("#employee-modal");
const employeeForm = document.querySelector("#employee-form");

function closeEmployeeModal() {
  if (!employeeModal || !employeeForm) return;
  employeeModal.hidden = true;
  employeeForm.reset();
}

document.querySelectorAll(".js-open-employee-modal").forEach((button) => {
  button.addEventListener("click", () => {
    if (!employeeModal || !employeeForm) return;
    employeeForm.dataset.context = button.dataset.employeeContext || "empresa";
    employeeModal.hidden = false;
    employeeForm.querySelector("input[name='name']").focus();
  });
});

document.querySelectorAll(".js-close-modal").forEach((button) => button.addEventListener("click", closeEmployeeModal));
if (employeeModal) employeeModal.addEventListener("click", (event) => { if (event.target === employeeModal) closeEmployeeModal(); });

if (employeeForm) {
  employeeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const context = employeeForm.dataset.context || "empresa";
    const data = new FormData(employeeForm);
    const table = document.querySelector(`[data-employee-table="${context}"]`);
    const appendEmployee = (item) => {
      if (!table) return;
      const row = document.createElement("tr");
      row.dataset.searchRow = "";
      row.dataset.employeeId = item?.id || "";
      row.innerHTML = `<td>${escapeHtml(item?.nome || data.get("name"))}</td><td>${escapeHtml(item?.email || data.get("email"))}</td><td>${escapeHtml(item?.cargo || data.get("role"))}</td><td>${escapeHtml(item?.tipo || data.get("type"))}</td><td><span class="badge warning">Pendente</span></td><td></td>`;
      renderEmployeeRowActions(row);
      table.appendChild(row);
      closeEmployeeModal();
      showToast("Funcion\u00e1rio adicionado com sucesso");
    };
    if (window.UsinaLinkApi) {
      window.UsinaLinkApi.post("/funcionarios", {
        contexto: context,
        nome: data.get("name"),
        email: data.get("email"),
        cargo: data.get("role"),
        tipo: data.get("type")
      }).then((result) => appendEmployee(result.funcionario)).catch((error) => showToast(error.message));
    } else {
      appendEmployee(null);
    }
  });
}

document.querySelectorAll("[data-employee-table] tr").forEach(renderEmployeeRowActions);
loadEmployeesFromApi();

document.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-mask]");
  if (input) applyMaskByKey(input);
});

loadProposalsFromApi();
applySessionContext();

if (window.location.pathname.includes("propostas-usina") || window.location.pathname.includes("propostas-enviadas")) {
  document.querySelectorAll("tbody tr[data-search-row]").forEach(renderProposalRowActions);
}

// Botao "mostrar senha" em todos os campos de senha e rotulo do tipo de conta abaixo da marca.
function addPasswordToggle(input) {
  const host = input.closest(".input-wrap, .input-icon") || input.parentElement;
  const existing = host.querySelector(".pass-toggle");
  if (existing) { // campo reaproveitado (cadastro troca o tipo de conta): volta ao estado oculto
    existing.textContent = "Mostrar";
    existing.setAttribute("aria-label", "Mostrar senha");
    return;
  }
  host.classList.add("has-pass-toggle");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "pass-toggle";
  button.textContent = "Mostrar";
  button.setAttribute("aria-label", "Mostrar senha");
  button.addEventListener("click", () => {
    const show = input.type === "password";
    input.type = show ? "text" : "password";
    button.textContent = show ? "Ocultar" : "Mostrar";
    button.setAttribute("aria-label", show ? "Ocultar senha" : "Mostrar senha");
  });
  input.after(button);
}

function removePasswordToggle(input) {
  const host = input.closest(".input-wrap, .input-icon") || input.parentElement;
  host.querySelector(".pass-toggle")?.remove();
  host.classList.remove("has-pass-toggle");
}

function setupPasswordToggles() {
  document.querySelectorAll('input[type="password"]').forEach((input) => {
    if (input.dataset.toggleReady) return;
    input.dataset.toggleReady = "1";
    addPasswordToggle(input);
  });
}

function setupRoleLabel() {
  const brand = document.querySelector(".sidebar .brand");
  if (!brand || document.querySelector(".brand-role")) return;
  const role = (document.body.dataset.userRole || "").split(",")[0].trim();
  const session = currentSession();
  const tipo = session.tipo && (document.body.dataset.userRole || "").includes(session.tipo) ? session.tipo : role;
  const nomes = { usina: "Conta Usina", empresa: "Conta Empresa", pessoa_fisica: "Conta Pessoa Física" };
  if (!nomes[tipo]) return;
  const tag = document.createElement("span");
  tag.className = "brand-role";
  tag.textContent = nomes[tipo];
  brand.after(tag);
}

setupPasswordToggles();
setupRoleLabel();
document.addEventListener("DOMContentLoaded", () => { setupPasswordToggles(); setupRoleLabel(); });

// Filtro por estados (caixinhas) em Pedidos disponiveis.
(function () {
  const painel = document.querySelector(".uf-filter");
  if (!painel) return;
  const aplicar = () => {
    const marcados = [...painel.querySelectorAll("[data-uf-check]:checked")].map((c) => c.value);
    painel.querySelector("[data-uf-count]").textContent = marcados.length ? "(" + marcados.length + ")" : "";
    document.querySelectorAll(".order-card-grid [data-search-row], [data-usina-pedidos-body] [data-search-row]").forEach((row) => {
      row.classList.toggle("uf-hidden", marcados.length > 0 && !marcados.includes(row.dataset.region));
    });
  };
  painel.addEventListener("change", aplicar);
  painel.querySelector("[data-uf-clear]").addEventListener("click", () => { painel.querySelectorAll("[data-uf-check]").forEach((c) => { c.checked = false; }); aplicar(); });
  document.addEventListener("usinalink:pedidos-carregados", aplicar);
}());

// Notificacoes nas atividades do menu lateral: cada notificacao nao lida marca o item do menu a que ela se refere.
async function setupNavNotifications() {
  const nav = document.querySelector(".sidebar [data-role-nav]");
  const session = currentSession();
  if (!nav || !session.tipo || session.tipo === "pessoa_fisica" || !window.UsinaLinkApi?.get) return;
  const role = document.body?.dataset.userRole || "";
  if (role && !role.split(",").map((r) => r.trim()).includes(session.tipo)) return;
  const pintar = async () => {
    let lista = [];
    try { lista = await window.UsinaLinkApi.get("/notificacoes"); } catch { return; }
    nav.querySelectorAll(".nav-count").forEach((el) => el.remove());
    const naoLidas = lista.filter((n) => !n.lida);
    const porLink = {};
    naoLidas.forEach((n) => { const chave = (n.link || "").split("?")[0]; if (chave) (porLink[chave] ||= []).push(n); });
    Object.entries(porLink).forEach(([href, itens]) => {
      const link = nav.querySelector(`a[href="${href}"]`);
      if (!link) return;
      link.insertAdjacentHTML("beforeend", ` <span class="badge info nav-count" title="${escapeHtml(itens[0].titulo)}">${itens.length}</span>`);
      link.addEventListener("click", () => { itens.forEach((n) => window.UsinaLinkApi.patch(`/notificacoes/${n.idNotificacao}/ler`, {}).catch(() => {})); }, { once: true });
    });
    const novas = naoLidas.filter((n) => !pintar.vistas.has(n.idNotificacao));
    if (pintar.vistas.size && novas.length) showToast(novas[0].titulo + (novas.length > 1 ? ` (+${novas.length - 1})` : ""));
    naoLidas.forEach((n) => pintar.vistas.add(n.idNotificacao));
  };
  pintar.vistas = new Set();
  await pintar();
  window.setInterval(pintar, 30000);
}
setupNavNotifications();
