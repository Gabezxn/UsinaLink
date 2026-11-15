(function () {
  // Troque pela URL do backend publicado (Render/Railway) quando for para producao.
  const PROD_API_BASE_URL = 'https://usinalink-orbz.onrender.com/api';
  const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const API_BASE_URL = isLocalHost ? 'http://localhost:3000/api' : PROD_API_BASE_URL;

  function buildUrl(endpoint) {
    const cleanEndpoint = String(endpoint || '').replace(/^\/api(?=\/|$)/, '').replace(/^\/?/, '/');
    return `${API_BASE_URL}${cleanEndpoint}`;
  }

  function extractErrorMessage(data) {
    if (Array.isArray(data?.message)) return data.message.join(' ');
    if (Array.isArray(data?.errors)) return data.errors.join(' ');
    return data?.message || data?.error || 'Nao foi possivel concluir a requisicao.';
  }

  function getAccessToken() {
    try {
      return sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
    } catch {
      return null;
    }
  }

  const LOGIN_BY_ROLE = { empresa: 'login-empresa.html', usina: 'login-usina.html', pessoa_fisica: 'login-pessoa-fisica.html', 'pessoa-fisica': 'login-pessoa-fisica.html' };
  const SESSION_MESSAGE = 'Sua sessão expirou. Entre novamente para continuar.';

  // Token expirado/inválido: limpa a sessão e leva ao login do perfil, com aviso (sem laço de redirecionamento).
  let encerrando = false;
  function sessionExpired() {
    if (encerrando) return; // várias chamadas em paralelo recebem 401: só a primeira redireciona
    encerrando = true;
    let tipo = null;
    try { tipo = (JSON.parse(sessionStorage.getItem('usinalinkSession') || localStorage.getItem('usinalinkSession') || 'null') || {}).tipo; } catch { /* sem sessão legível */ }
    ['usinalinkSession', 'accessToken', 'tipoUsuario', 'nome'].forEach((k) => { try { sessionStorage.removeItem(k); localStorage.removeItem(k); } catch { /* sem armazenamento */ } });
    try { sessionStorage.setItem('usinalinkNotice', SESSION_MESSAGE); } catch { /* sem armazenamento */ }
    if (!/\/login[^/]*\.html$|\/index\.html$|\/$/.test(window.location.pathname)) window.location.href = LOGIN_BY_ROLE[tipo] || 'login.html';
  }

  // Mostra o aviso guardado (ex.: sessão expirada) na tela de login.
  document.addEventListener('DOMContentLoaded', () => {
    let msg = null;
    try { msg = sessionStorage.getItem('usinalinkNotice'); sessionStorage.removeItem('usinalinkNotice'); } catch { /* sem armazenamento */ }
    const alvo = msg && document.querySelector('form.js-login-form');
    if (!alvo) return;
    const p = document.createElement('p');
    p.className = 'form-notice';
    p.setAttribute('role', 'alert');
    p.style.cssText = 'margin:0 0 16px;padding:12px 14px;border:2px solid #92400e;border-radius:10px;background:#fffbeb;color:#451a03;font-weight:600';
    p.textContent = msg;
    alvo.insertBefore(p, alvo.firstChild);
  });

  // ---- Servidor dormindo (Render gratuito): aviso após 4 s e novas tentativas com espera crescente ----
  const WAKE_AFTER_MS = 4000;
  const RETRY_DELAYS = [1500, 3000, 6000];
  const WAKE_MESSAGE = 'Acordando o servidor, isso pode levar até 1 minuto…';
  const NETWORK_MESSAGE = 'Não foi possível conectar ao servidor. Verifique sua internet e tente de novo.';
  let wakeUsers = 0;

  function wakeNotice() {
    let el = document.getElementById('api-wake-notice');
    if (!el && document.body) {
      el = document.createElement('div');
      el.id = 'api-wake-notice';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.style.cssText = 'position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100001;max-width:calc(100vw - 32px);padding:12px 18px;border-radius:12px;background:#123273;color:#fff;font:600 15px/1.4 system-ui,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.3);text-align:center';
      el.textContent = WAKE_MESSAGE;
      document.body.appendChild(el);
    }
    return el;
  }
  function wakeShow() { wakeUsers++; wakeNotice(); }
  function wakeHide() { wakeUsers = Math.max(0, wakeUsers - 1); if (!wakeUsers) { const el = document.getElementById('api-wake-notice'); if (el) el.remove(); } }
  const dormir = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

  // Repete em 502/503/504 (servidor acordando) e, só para leituras (GET), em falha de rede.
  async function fetchResiliente(url, init) {
    const metodo = String(init.method || 'GET').toUpperCase();
    let mostrando = false;
    const timer = window.setTimeout(() => { mostrando = true; wakeShow(); }, WAKE_AFTER_MS);
    try {
      for (let tentativa = 0; ; tentativa++) {
        let resposta;
        try {
          resposta = await fetch(url, init);
        } catch (erro) {
          if (metodo === 'GET' && tentativa < RETRY_DELAYS.length) { if (!mostrando) { mostrando = true; wakeShow(); } await dormir(RETRY_DELAYS[tentativa]); continue; }
          throw new TypeError(NETWORK_MESSAGE);
        }
        if ([502, 503, 504].includes(resposta.status) && tentativa < RETRY_DELAYS.length) {
          if (!mostrando) { mostrando = true; wakeShow(); }
          await dormir(RETRY_DELAYS[tentativa]);
          continue;
        }
        return resposta;
      }
    } finally {
      window.clearTimeout(timer);
      if (mostrando) wakeHide();
    }
  }

  async function apiRequest(endpoint, options = {}) {
    const token = getAccessToken();
    const response = await fetchResiliente(buildUrl(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await response.json() : null;

    if (response.status === 401 && !/\/?(auth\/login|cadastro)/.test(String(endpoint))) {
      sessionExpired();
      throw new Error(SESSION_MESSAGE);
    }

    if (!response.ok) {
      throw new Error(extractErrorMessage(data));
    }

    return data;
  }

  window.API_BASE_URL = API_BASE_URL;
  window.apiRequest = apiRequest;
  window.UsinaLinkApi = {
    API_BASE_URL,
    BASE_URL: API_BASE_URL,
    buildUrl,
    request: apiRequest,
    get: (endpoint) => apiRequest(endpoint),
    post: (endpoint, body) => apiRequest(endpoint, { method: 'POST', body: JSON.stringify(body) }),
    patch: (endpoint, body) => apiRequest(endpoint, { method: 'PATCH', body: JSON.stringify(body) }),
    put: (endpoint, body) => apiRequest(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  };
}());
