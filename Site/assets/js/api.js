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

  async function apiRequest(endpoint, options = {}) {
    const response = await fetch(buildUrl(endpoint), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(localStorage.getItem('accessToken') ? { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } : {}),
        ...(options.headers || {}),
      },
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json') ? await response.json() : null;

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
