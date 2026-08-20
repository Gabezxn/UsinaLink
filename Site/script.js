const toast = document.createElement("div");
toast.className = "toast";
document.body.appendChild(toast);

document.querySelectorAll(".sidebar").forEach((sidebar) => {
  const nav = sidebar.querySelector(".side-nav");
  const brand = sidebar.querySelector(".brand");
  if (!nav || !brand || sidebar.querySelector(".sidebar-toggle")) return;
  const toggle = document.createElement("button");
  toggle.className = "sidebar-toggle";
  toggle.type = "button";
  toggle.setAttribute("aria-label", "Abrir ou fechar menu");
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
  window.setTimeout(() => toast.classList.remove("show"), 2600);
}

const signupConfig = {
  empresa: {
    labels: ["Nome da empresa", "CNPJ", "E-mail corporativo", "Nome do responsavel", "Cargo", "Senha", "Confirmar senha"],
    placeholders: ["Metal Forte Ltda.", "00.000.000/0001-00", "compras@empresa.com", "Nome e sobrenome", "Gerente de compras", "Crie uma senha", "Digite a senha novamente"],
    icons: ["N", "#", "@", "R", "C", "*", "*"],
    types: ["text", "text", "email", "text", "text", "password", "password"],
    keys: ["nome", "cnpj", "email", "responsavel", "cargo", "senha", "confirmarSenha"],
    button: "Cadastrar empresa",
    redirect: "login-empresa.html",
    orange: false
  },
  pessoa: {
    labels: ["Nome completo", "CPF", "E-mail", "Telefone", "Senha", "Confirmar senha"],
    placeholders: ["Nome e sobrenome", "000.000.000-00", "voce@email.com", "(00) 00000-0000", "Crie uma senha", "Digite a senha novamente"],
    icons: ["N", "#", "@", "T", "*", "*"],
    types: ["text", "text", "email", "tel", "password", "password"],
    keys: ["nome", "cpf", "email", "telefone", "senha", "confirmarSenha"],
    button: "Cadastrar pessoa fisica",
    redirect: "login-pessoa-fisica.html",
    orange: false
  },
  usina: {
    labels: ["Nome da usina", "CNPJ", "E-mail industrial", "Respons\u00e1vel t\u00e9cnico", "Especialidade principal", "Senha", "Confirmar senha"],
    placeholders: ["Atlas Metais", "00.000.000/0001-00", "contato@atlasmetais.com", "Nome do responsavel", "Usinagem de precisao", "Crie uma senha", "Digite a senha novamente"],
    icons: ["N", "#", "@", "R", "E", "*", "*"],
    types: ["text", "text", "email", "text", "text", "password", "password"],
    keys: ["nome", "cnpj", "email", "responsavel", "especialidade", "senha", "confirmarSenha"],
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
  field.classList.toggle("has-error", Boolean(message));
  field.classList.toggle("has-success", !message && Boolean(input.value.trim()));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  messageElement.textContent = message || "";
}

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
    if (key === "cpf" || key === "cnpj" || key === "telefone") payload[key] = onlyDigits(input.value);
  });
  payload.tipo = type === "pessoa" ? "pessoa_fisica" : type;
  return payload;
}

function updateSignupForm(type) {
  const config = signupConfig[type];
  const form = document.querySelector(".signup-dynamic-form");
  const button = document.querySelector("#signup-submit");
  if (!config || !form || !button) return;

  for (let index = 0; index < 7; index += 1) {
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
    input.autocomplete = config.keys[index] === "senha" ? "new-password" : "on";
    setFieldState(input, "");
    if (symbol) symbol.textContent = config.icons[index];
  }

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

document.querySelectorAll(".choice-card").forEach((card) => {
  card.addEventListener("click", () => {
    const radio = card.querySelector('input[type="radio"]');
    if (!radio) return;
    document.querySelectorAll(".choice-card").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll('.choice-card input[type="radio"]').forEach((item) => {
      item.checked = false;
    });
    radio.checked = true;
    card.classList.add("active");
    updateSignupForm(radio.value);
  });
});

document.querySelectorAll('a[href="index.html"]').forEach((link) => {
  if (link.textContent.trim().toLowerCase() === "sair") {
    link.addEventListener("click", () => {
      sessionStorage.removeItem("usinalinkSession");
      localStorage.removeItem("usinalinkSession");
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
      showToast(type === "usina" ? "Usina nao encontrada. Preencha os dados manualmente." : "Empresa nao encontrada. Preencha os dados manualmente.");
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
      showToast("Nao foi possivel carregar o cliente da API.");
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
      window.setTimeout(() => { window.location.href = signupForm.dataset.redirect; }, 800);
    } catch (error) {
      if (error instanceof TypeError) {
        showToast("Nao foi possivel conectar ao servidor.");
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

document.querySelectorAll(".js-login-form").forEach((form) => {
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
      if (!window.UsinaLinkApi) throw new Error("Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.");
      const result = await window.UsinaLinkApi.post(`/auth/login/${tipo}`, {
        email: emailInput.value.trim().toLowerCase(),
        senha: passwordInput.value
      });
      localStorage.setItem("accessToken", result.accessToken || result.access_token);
      localStorage.setItem("tipoUsuario", result.tipoUsuario);
      localStorage.setItem("nome", result.nome || "");
      localStorage.setItem("usinalinkSession", JSON.stringify({
        tipo: result.tipoUsuario,
        nome: result.nome || "",
        empresaId: result.empresa?.idEmpresa,
        usinaId: result.usina?.idUsina
      }));
      sessionStorage.removeItem("usinalinkSession");
      showToast("Login realizado com sucesso");
      window.setTimeout(() => { window.location.href = redirect; }, 500);
    } catch (error) {
      if (error instanceof TypeError) {
        setFieldState(emailInput, "Nao foi possivel conectar ao servidor.");
        showToast("Nao foi possivel conectar ao servidor.");
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
          ["Raz\u00e3o Social", "text", "Metal Forte Componentes Industriais Ltda.", null, "razaoSocial"],
          ["Nome Fantasia", "text", "Metal Forte", null, "nomeFantasia"],
          ["Setor de Atua\u00e7\u00e3o", "select", "Ind\u00fastria metalmec\u00e2nica", ["Ind\u00fastria metalmec\u00e2nica", "Minera\u00e7\u00e3o", "Energia", "Automotivo"], "setorAtuacao"],
          ["Porte da Empresa", "select", "M\u00e9dio porte", ["Pequeno porte", "M\u00e9dio porte", "Grande porte"], "porte"],
          ["Descri\u00e7\u00e3o / Apresenta\u00e7\u00e3o", "textarea", "Empresa especializada em aquisi\u00e7\u00e3o e manuten\u00e7\u00e3o de componentes industriais para linhas de produ\u00e7\u00e3o.", null, "descricao"]
        ]
      },
      contato: { title: "Contato", subtitle: "Canais comerciais e respons\u00e1veis por comunica\u00e7\u00e3o.", fields: [["E-mail comercial", "email", "comercial@metalforte.com", null, "email"], ["Telefone", "tel", "(11) 3333-4400", null, "telefone"], ["WhatsApp", "tel", "(11) 98888-4400"], ["Site", "url", "https://www.metalforte.com"], ["Respons\u00e1vel principal", "text", "Ana Martins", null, "responsavel"]] },
      endereco: { title: "Endere\u00e7o", subtitle: "Localiza\u00e7\u00e3o fiscal e operacional da organiza\u00e7\u00e3o.", fields: [["CEP", "text", "04000-000", null, "cep"], ["Rua", "text", "Avenida Industrial", null, "rua"], ["N\u00famero", "text", "1200", null, "numero"], ["Bairro", "text", "Distrito Empresarial", null, "bairro"], ["Cidade", "text", "Sao Paulo", null, "cidade"], ["Estado", "select", "SP", ["SP", "MG", "RJ", "PR", "SC", "RS"], "estado"], ["Complemento", "text", "Galpao 4", null, "complemento"]] },
      documentos: { title: "Documentos", subtitle: "Registros e comprovantes usados na valida\u00e7\u00e3o comercial.", fields: [["CNPJ", "text", "12.345.678/0001-90"], ["Inscri\u00e7\u00e3o Estadual", "text", "123.456.789.110"], ["Contrato Social", "text", "Contrato_social_metalforte.pdf"], ["Alvar\u00e1", "text", "Alvara_2026.pdf"], ["Certifica\u00e7\u00f5es", "text", "ISO 9001, ISO 14001"]] },
      seguranca: { title: "Seguran\u00e7a", subtitle: "Proteja o acesso dos usu\u00e1rios vinculados \u00e0 organiza\u00e7\u00e3o.", fields: [["Senha atual", "password", "", null, "senhaAtual"], ["Nova senha", "password", "", null, "novaSenha"], ["Confirmar nova senha", "password", "", null, "confirmarSenha"], ["Autentica\u00e7\u00e3o em duas etapas", "checkbox", "Ativar autentica\u00e7\u00e3o em duas etapas"]] },
      notificacoes: { title: "Notifica\u00e7\u00f5es", subtitle: "Configure quais avisos devem chegar para a equipe.", fields: [["Receber propostas por e-mail", "checkbox", "Receber propostas por e-mail"], ["Receber alertas de prazo", "checkbox", "Receber alertas de prazo"], ["Receber mensagens de fornecedores", "checkbox", "Receber mensagens de fornecedores"], ["Receber resumo semanal", "checkbox", "Receber resumo semanal"]] }
    }
  },
  usina: {
    cancel: "dashboard-usina.html",
    button: "btn-orange",
    sections: {
      gerais: { title: "Informa\u00e7\u00f5es gerais", subtitle: "Dados industriais exibidos para empresas compradoras.", fields: [["Nome da usina", "text", "Usina Atlas Metais"], ["Nome fantasia", "text", "Atlas Metais"], ["Especialidade principal", "text", "Usinagem de precis\u00e3o"], ["Capacidade produtiva", "text", "12.000 pe\u00e7as/m\u00eas"], ["Descri\u00e7\u00e3o industrial", "textarea", "Usina especializada em usinagem CNC, corte, dobra e componentes industriais sob demanda."]] },
      contato: { title: "Contato", subtitle: "Canais da equipe comercial da usina.", fields: [["E-mail industrial", "email", "comercial@atlasmetais.com"], ["Telefone", "tel", "(31) 3333-4400"], ["WhatsApp", "tel", "(31) 98888-4400"], ["Respons\u00e1vel comercial", "text", "Carlos Mendes"]] },
      endereco: { title: "Endere\u00e7o", subtitle: "Localiza\u00e7\u00e3o operacional e regi\u00e3o de atendimento.", fields: [["CEP", "text", "32000-000"], ["Rua", "text", "Rodovia Industrial"], ["Cidade", "text", "Contagem"], ["Estado", "select", "MG", ["MG", "SP", "RJ", "PR", "SC", "RS"]], ["Regi\u00e3o de atendimento", "text", "Sudeste, Sul e Nordeste"]] },
      producao: { title: "Produ\u00e7\u00e3o", subtitle: "Capacidade operacional para avaliar pedidos.", fields: [["M\u00e1quinas dispon\u00edveis", "textarea", "Tornos CNC, centros de usinagem, corte laser, dobra CNC"], ["Capacidade mensal", "text", "12.000 pe\u00e7as"], ["Turnos", "select", "2 turnos", ["1 turno", "2 turnos", "3 turnos"]], ["Prazo m\u00e9dio", "text", "18 dias"]] },
      certificacoes: { title: "Certifica\u00e7\u00f5es", subtitle: "Compet\u00eancias e certificados produtivos.", fields: [["ISO 9001", "checkbox", "ISO 9001"], ["CNC", "checkbox", "CNC"], ["Corte laser", "checkbox", "Corte laser"], ["Fundi\u00e7\u00e3o", "checkbox", "Fundi\u00e7\u00e3o"], ["Soldagem", "checkbox", "Soldagem"]] },
      seguranca: { title: "Seguran\u00e7a", subtitle: "Proteja o acesso da equipe da usina.", fields: [["Senha atual", "password", ""], ["Nova senha", "password", ""], ["Confirmar senha", "password", ""]] },
      notificacoes: { title: "Notifica\u00e7\u00f5es", subtitle: "Configure os avisos comerciais da usina.", fields: [["Novos pedidos", "checkbox", "Novos pedidos"], ["Propostas aceitas", "checkbox", "Propostas aceitas"], ["Alertas de prazo", "checkbox", "Alertas de prazo"], ["Mensagens", "checkbox", "Mensagens"]] }
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
  if (type === "select") return `<label class="field"><span>${label}</span><div class="input-wrap select-field"><span class="input-symbol">v</span><select${nameAttr}>${options.map((option) => `<option${option === value ? " selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div></label>`;
  if (type === "checkbox") return `<label class="toggle-field span-2"><input type="checkbox" checked${nameAttr}><span></span><strong>${label || value}</strong></label>`;
  const maskKey = inferMaskKey(label, type);
  return `<label class="field"><span>${label}</span><div class="input-wrap"><span class="input-symbol">${type === "password" ? "*" : "T"}</span><input type="${type}" value="${escapeHtml(value)}"${nameAttr}${maskKey ? ` data-mask="${maskKey}"` : ""}></div></label>`;
}

function viewFieldMarkup(field) {
  const [label, type] = field;
  if (type === "password") return `<div class="field"><span>${label}</span><div class="view-value">N&atilde;o exibido</div></div>`;
  if (type === "checkbox") return "";
  const value = field[2];
  const span = type === "textarea" ? " span-2" : "";
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

function parseCurrency(value) {
  return Number(String(value || "0").replace(/\D/g, "")) / 100;
}

function formatCurrency(value) {
  return "R$ " + Number(value || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function updateProposalTotal() {
  const valueInput = document.querySelector("#proposal-value");
  const freightInput = document.querySelector("#proposal-freight");
  const totalPreview = document.querySelector("#preview-total");
  const valuePreview = document.querySelector("#preview-value");
  const freightPreview = document.querySelector("#preview-freight");
  
  if (!valueInput || !freightInput || !totalPreview) return;
  
  const valorProposta = parseCurrency(valueInput.value);
  const valorFrete = parseCurrency(freightInput.value);
  const valorTotal = valorProposta + valorFrete;
  
  totalPreview.textContent = formatCurrency(valorTotal);
  if (valuePreview) valuePreview.textContent = formatCurrency(valorProposta);
  if (freightPreview) freightPreview.textContent = formatCurrency(valorFrete);
}

document.querySelectorAll(".js-proposal-form").forEach((form) => {
  const valueInput = form.querySelector("#proposal-value");
  const freightInput = form.querySelector("#proposal-freight");
  const deadlineInput = form.querySelector("#proposal-deadline");
  const noteInput = form.querySelector("#proposal-note");
  
  if (valueInput) valueInput.addEventListener("input", updateProposalTotal);
  if (freightInput) freightInput.addEventListener("input", updateProposalTotal);
  if (deadlineInput) {
    deadlineInput.addEventListener("input", () => {
      const preview = document.querySelector("#preview-deadline");
      if (preview) preview.textContent = deadlineInput.value || "18 dias";
    });
  }
  if (noteInput) {
    noteInput.addEventListener("input", () => {
      const preview = document.querySelector("#preview-note");
      if (preview) preview.textContent = noteInput.value || "Sem observa&ccedil;&otilde;es.";
    });
  }
  
  updateProposalTotal();
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
      <button class="icon-action" type="button" aria-label="Abrir acoes">...</button>
      <div class="actions-menu-list" role="menu">
        ${actions.map(action => `<button class="table-action js-alert" type="button" role="menuitem">${action}</button>`).join("")}
      </div>
    </div>`;
}

function employeeRowMarkup(item) {
  const status = item.status || "Pendente";
  return `<tr data-search-row data-employee-id="${escapeHtml(item.id || "")}"><td>${escapeHtml(item.nome || "")}</td><td>${escapeHtml(item.email || "")}</td><td>${escapeHtml(item.cargo || "")}</td><td>${escapeHtml(item.tipo || "")}</td><td><span class="badge ${statusClass(status)}">${escapeHtml(status)}</span></td><td></td></tr>`;
}

async function loadEmployeesFromApi() {
  if (!window.UsinaLinkApi) return;
  document.querySelectorAll("[data-employee-table]").forEach(async (table) => {
    try {
      const context = table.dataset.employeeTable;
      const employees = await window.UsinaLinkApi.get(`/funcionarios?contexto=${encodeURIComponent(context)}`);
      table.innerHTML = employees.map(employeeRowMarkup).join("") || '<tr><td colspan="6" style="text-align:center; padding: 24px;">Nenhum funcionario cadastrado.</td></tr>';
      table.querySelectorAll("tr[data-employee-id]").forEach(renderEmployeeRowActions);
    } catch (error) {
      table.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 24px;">Falha ao carregar funcionarios: ${escapeHtml(error.message)}</td></tr>`;
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
      <div><span>Prazo de fabricacao</span><strong>${escapeHtml(data.prazo || data[3] || "18 dias")}</strong></div>
      <div><span>Frete</span><strong>${escapeHtml(data.frete || "R$ 950,00")}</strong></div>
      <div><span>Avaliacao</span><strong>${escapeHtml(data.avaliacao || "4,8/5")}</strong></div>
      <div><span>Regiao</span><strong>${escapeHtml(data.regiao || "Sudeste")}</strong></div>
      <div><span>Peca/Pedido</span><strong>${escapeHtml(data.peca || data[0] || "Peca industrial")}</strong></div>
      <div><span>Material</span><strong>${escapeHtml(data.material || "Aco carbono")}</strong></div>
      <div><span>Quantidade</span><strong>${escapeHtml(data.quantidade || "60 unidades")}</strong></div>
      <div><span>Arquivo tecnico</span><strong>${escapeHtml(data.arquivo || "arquivo-tecnico.pdf")}</strong></div>
    </div>
    <div class="detail-list"><div><span>Observacoes</span><strong>${escapeHtml(data.observacao || "Proposta com condicoes comerciais completas.")}</strong></div></div>
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

  const displayName = session.nome || (role === "usina" ? "Minha usina" : "Minha empresa");
  const headerTitle = document.querySelector(".app-header h1");
  if (headerTitle) headerTitle.textContent = displayName;

  const userName = document.querySelector(".user-strip strong");
  if (userName) userName.textContent = displayName;

  const userRole = document.querySelector(".user-strip span");
  if (userRole) userRole.textContent = role === "usina" ? "Conta da usina" : "Conta da empresa";

  const profileTitle = document.querySelector(".profile-head h1");
  if (profileTitle) profileTitle.textContent = displayName;

  const profileSubtitle = document.querySelector(".profile-head p");
  if (profileSubtitle) profileSubtitle.textContent = role === "usina" ? "Perfil industrial da usina logada." : "Perfil comercial da empresa logada.";
}

function proposalActionsMarkup(status) {
  const locked = ["Aceita", "Cancelada"].includes(status);
  const actions = locked ? ["Ver detalhes"] : ["Ver detalhes", "Editar proposta", "Cancelar proposta"];
  return `
    <div class="actions-menu">
      <button class="icon-action" type="button" aria-label="Abrir acoes da proposta">...</button>
      <div class="actions-menu-list" role="menu">
        ${actions.map(action => `<button class="table-action js-alert" type="button" role="menuitem">${action}</button>`).join("")}
      </div>
    </div>`;
}

function renderProposalRowActions(row) {
  if (!row || row.children.length < 7) return;
  const status = row.querySelector(".badge")?.textContent.trim() || "Enviada";
  row.children[row.children.length - 1].innerHTML = proposalActionsMarkup(status);
}

function proposalRowMarkup(item) {
  const status = item.status || "Enviada";
  return `<tr data-search-row data-proposal-id="${escapeHtml(item.id)}"><td>${escapeHtml(item.peca || "")}</td><td>${escapeHtml(item.cliente || "")}</td><td>${escapeHtml(item.valor || "")}</td><td>${escapeHtml(item.prazo || "")}</td><td><span class="badge ${badgeClass(status)}">${escapeHtml(status)}</span></td><td>${escapeHtml(item.dataEnvio || "")}</td><td>${proposalActionsMarkup(status)}</td></tr>`;
}

let ultimasPropostasRecebidas = [];

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
  const decisaoBtn = aceita
    ? '<button class="btn" type="button" disabled>Proposta aceita</button>'
    : travada
      ? `<button class="btn btn-ghost" type="button" disabled>${escapeHtml(statusPropostaLabel(status))}</button>`
      : '<button class="btn js-alert" type="button">Aceitar proposta</button>';
  return `<article class="card proposal-card ${best && !travada ? "best" : ""} ${aceita ? "accepted" : ""}" data-search-row data-proposal-id="${escapeHtml(item.idProposta)}">
    ${best && !travada ? '<span class="best-label">Melhor proposta</span>' : ""}
    <h2>${escapeHtml(nomeUsinaProposta(item.usina))}</h2>
    <strong class="price">${escapeHtml(formatMoneyBR(item.valor))}</strong>
    <dl><div><dt>Prazo de fabricacao</dt><dd>${escapeHtml(item.prazo || "A combinar")}</dd></div><div><dt>Frete</dt><dd>${escapeHtml(item.frete ? formatMoneyBR(item.frete) : "A combinar")}</dd></div><div><dt>Status</dt><dd>${escapeHtml(statusPropostaLabel(status))}</dd></div></dl>
    <p>${escapeHtml(item.observacao || "Sem observacoes adicionais.")}</p>
    <div class="card-actions"><button class="btn btn-ghost js-alert" type="button">Ver detalhes</button>${decisaoBtn}</div>
  </article>`;
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
      <div><span>Prazo de fabricacao</span><strong>${escapeHtml(item.prazo || "A combinar")}</strong></div>
      <div><span>Frete</span><strong>${escapeHtml(item.frete ? formatMoneyBR(item.frete) : "A combinar")}</strong></div>
      <div><span>Status</span><strong>${escapeHtml(statusPropostaLabel(status))}</strong></div>
      <div><span>Pedido</span><strong>${escapeHtml(item.pedido?.numeroPedido || "-")}</strong></div>
    </div>
    <div class="detail-list"><div><span>Observacoes</span><strong>${escapeHtml(item.observacao || "Sem observacoes adicionais.")}</strong></div></div>
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
        : '<article class="card proposal-card"><h2>Nenhuma proposta recebida</h2><p>As propostas enviadas pelas usinas aparecerao aqui.</p></article>';
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
        <label class="field"><span>Nome</span><div class="input-wrap"><span class="input-symbol">N</span><input name="name" value="${escapeHtml(cells[0])}"></div></label>
        <label class="field"><span>E-mail</span><div class="input-wrap"><span class="input-symbol">@</span><input name="email" type="email" value="${escapeHtml(cells[1])}"></div></label>
        <label class="field"><span>Cargo</span><div class="input-wrap"><span class="input-symbol">C</span><input name="role" value="${escapeHtml(cells[2])}"></div></label>
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
        <label class="field"><span>Valor</span><div class="input-wrap"><span class="input-symbol">R$</span><input name="valor" value="${escapeHtml(cells[2])}"></div></label>
        <label class="field"><span>Prazo</span><div class="input-wrap"><span class="input-symbol">P</span><input name="prazo" value="${escapeHtml(cells[3])}"></div></label>
        <label class="field"><span>Frete</span><div class="input-wrap"><span class="input-symbol">F</span><input name="frete" value="R$ 950,00"></div></label>
        <label class="field"><span>Observacao</span><div class="input-wrap"><span class="input-symbol">O</span><input name="observacao" value="Proposta com inspecao dimensional."></div></label>
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

function openSimpleConfirm({ title, message, confirmText, onConfirm, orange = false }) {
  openActionModal({
    title,
    kicker: "Confirmacao",
    body: `<p class="modal-copy">${escapeHtml(message)}</p><div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Voltar</button><button class="btn ${orange ? "btn-orange" : "btn-primary"} js-modal-confirm" type="button">${escapeHtml(confirmText)}</button></div>`
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
    await window.UsinaLinkApi.patch(`/propostas/${idProposta}/${aceitar ? "aceitar" : "recusar"}`, {});
    ensureActionModal().hidden = true;
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
    const title = commercialCard.querySelector("h2")?.textContent.trim() || "Peca comercial";
    const description = commercialCard.querySelector("p")?.textContent.trim() || "";
    const facts = [...commercialCard.querySelectorAll(".quote-facts div")].map((item) => `<div><span>${escapeHtml(item.querySelector("span")?.textContent || "")}</span><strong>${escapeHtml(item.querySelector("strong")?.textContent || "")}</strong></div>`).join("");
    openActionModal({
      title,
      kicker: "Peca comercial",
      body: `<div class="detail-list"><div><span>Material</span><strong>${escapeHtml(description)}</strong></div></div><div class="action-modal-grid">${facts}</div><div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button><button class="btn btn-primary js-action-modal-close" type="button">Solicitar compra</button></div>`
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
    openSimpleConfirm({
      title: "Aceitar proposta",
      message: "Deseja aceitar esta proposta? As demais propostas deste pedido ficarao recusadas.",
      confirmText: "Aceitar proposta",
      onConfirm: () => decidirProposta(card.dataset.proposalId, true)
    });
    return;
  }
  if (row && action === "Ver detalhes") {
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
  if (row && action === "Ver") {
    const cells = rowCells(row);
    openActionModal({
      title: cells[0] || "Detalhes do pedido",
      kicker: "Solicitacao",
      body: `<div class="action-modal-grid"><div><span>Categoria</span><strong>${escapeHtml(cells[1])}</strong></div><div><span>Quantidade</span><strong>${escapeHtml(cells[2])}</strong></div><div><span>Status</span><strong>${escapeHtml(cells[3])}</strong></div><div><span>Propostas</span><strong>${escapeHtml(cells[4])}</strong></div><div><span>Prazo</span><strong>${escapeHtml(cells[5])}</strong></div><div><span>Arquivo tecnico</span><strong>arquivo-tecnico.pdf</strong></div></div><div class="form-actions"><button class="btn btn-ghost js-action-modal-close" type="button">Fechar</button></div>`
    });
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
    if (filter === "sudeste") visible = row.dataset.region === "sudeste";
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

document.querySelectorAll(".js-open-order-detail").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("[data-search-row]");
    const cells = row.querySelectorAll("td");
    const facts = {};
    row.querySelectorAll(".quote-facts div").forEach((item) => {
      const key = item.querySelector("span")?.textContent.trim().toLowerCase();
      const value = item.querySelector("strong")?.textContent.trim();
      if (key) facts[key] = value;
    });
    const title = row.querySelector("h2")?.textContent || cells[0]?.textContent || "Pedido";
    const material = cells[1]?.textContent || facts.material || "";
    const quantity = cells[2]?.textContent || facts.quantidade || "";
    const deadline = cells[3]?.textContent || facts.prazo || "";
    const region = cells[4]?.textContent || facts["regi\u00e3o"] || "";
    document.querySelector("#order-modal-title").textContent = title;
    document.querySelector("#order-modal-content").innerHTML = `
      <div><span>Detalhes da pe\u00e7a</span><strong>${escapeHtml(title)}</strong></div>
      <div><span>Material</span><strong>${escapeHtml(material)}</strong></div>
      <div><span>Quantidade</span><strong>${escapeHtml(quantity)}</strong></div>
      <div><span>Descri\u00e7\u00e3o t\u00e9cnica</span><strong>${escapeHtml(row.dataset.description || "Solicita\u00e7\u00e3o com especifica\u00e7\u00f5es t\u00e9cnicas anexas.")}</strong></div>
      <div><span>Arquivo t\u00e9cnico fict\u00edcio</span><strong>${escapeHtml(row.dataset.file || "arquivo-tecnico.pdf")}</strong></div>
      <div><span>Prazo desejado</span><strong>${escapeHtml(deadline)}</strong></div>
      <div><span>Regi\u00e3o</span><strong>${escapeHtml(region)}</strong></div>`;
    if (orderModal) orderModal.hidden = false;
  });
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

function formatCurrencyLike(value, fallback) {
  const clean = value.trim();
  if (!clean) return fallback;
  return clean.startsWith("R$") ? clean : `R$ ${clean}`;
}

function parseCurrencyLike(value) {
  const clean = String(value || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const number = Number(clean);
  return Number.isFinite(number) ? number : 0;
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value) || 0);
}

function updateProposalPreview() {
  const value = document.querySelector("#proposal-value");
  const deadline = document.querySelector("#proposal-deadline");
  const freight = document.querySelector("#proposal-freight");
  const note = document.querySelector("#proposal-note");
  if (!value) return;
  document.querySelector("#preview-value").textContent = formatBRL(parseCurrencyLike(value.value) + parseCurrencyLike(freight.value));
  document.querySelector("#preview-deadline").textContent = deadline.value || "18 dias";
  document.querySelector("#preview-freight").textContent = formatCurrencyLike(freight.value, "R$ 950,00");
  document.querySelector("#preview-note").textContent = note.value || "Proposta com inspe\u00e7\u00e3o dimensional e embalagem refor\u00e7ada.";
}

document.querySelectorAll("#proposal-value, #proposal-deadline, #proposal-freight, #proposal-note").forEach((input) => {
  input.addEventListener("input", updateProposalPreview);
});

document.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-mask]");
  if (input) applyMaskByKey(input);
});

document.querySelectorAll(".js-send-proposal").forEach((button) => {
  button.addEventListener("click", async () => {
    if (button.disabled) return;
    updateProposalPreview();
    const session = currentSession();
    const params = new URLSearchParams(window.location.search);
    const pedidoId = params.get("pedidoId") || "pedido-1";
    const value = document.querySelector("#proposal-value");
    const deadline = document.querySelector("#proposal-deadline");
    const freight = document.querySelector("#proposal-freight");
    const note = document.querySelector("#proposal-note");
    if (!value.value.trim() || !deadline.value.trim()) {
      showToast("Informe valor e prazo para enviar a proposta");
      return;
    }
    try {
      button.disabled = true;
      button.textContent = "Enviando...";
      if (!window.UsinaLinkApi) throw new Error("Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.");
      await window.UsinaLinkApi.post("/propostas", {
        idPedido: pedidoId,
        valor: formatCurrencyLike(value.value, "R$ 0,00"),
        prazo: deadline.value.trim(),
        frete: formatCurrencyLike(freight.value, "R$ 0,00"),
        observacao: note.value.trim()
      });
      showToast("Proposta enviada com sucesso");
      window.setTimeout(() => { window.location.href = "propostas-usina.html"; }, 800);
    } catch (error) {
      showToast(error.message);
      button.disabled = false;
      button.textContent = "Enviar proposta";
    }
  });
});

loadProposalsFromApi();
applySessionContext();

if (window.location.pathname.includes("propostas-usina") || window.location.pathname.includes("propostas-enviadas")) {
  document.querySelectorAll("tbody tr[data-search-row]").forEach(renderProposalRowActions);
}
