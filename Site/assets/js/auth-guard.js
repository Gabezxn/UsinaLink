(function () {
  const protectedRole = document.body?.dataset.userRole;
  if (!protectedRole) return;

  const allowedRoles = protectedRole.split(",").map((role) => role.trim());
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null"); } catch { session = null; }
  // Token ausente, malformado ou vencido conta como sessão expirada (a API também confere no servidor).
  function tokenVencido() {
    try {
      const token = sessionStorage.getItem("accessToken") || localStorage.getItem("accessToken");
      if (!token) return true;
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
    } catch { return true; }
  }
  const sessaoValida = allowedRoles.includes(session?.tipo);
  if (sessaoValida && !tokenVencido()) return;
  if (sessaoValida) {
    ["usinalinkSession", "accessToken", "tipoUsuario", "nome"].forEach((k) => { sessionStorage.removeItem(k); localStorage.removeItem(k); });
    try { sessionStorage.setItem("usinalinkNotice", "Sua sessão expirou. Entre novamente para continuar."); } catch { /* sem armazenamento */ }
  }

  const loginByRole = {
    empresa: "login-empresa.html",
    usina: "login-usina.html",
    "pessoa-fisica": "login-pessoa-fisica.html",
    pessoa_fisica: "login-pessoa-fisica.html"
  };

  window.location.href = loginByRole[allowedRoles[0]] || "login.html";
}());
