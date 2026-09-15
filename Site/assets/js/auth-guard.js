(function () {
  const protectedRole = document.body?.dataset.userRole;
  if (!protectedRole) return;

  const allowedRoles = protectedRole.split(",").map((role) => role.trim());
  const session = JSON.parse(sessionStorage.getItem("usinalinkSession") || localStorage.getItem("usinalinkSession") || "null");
  if (allowedRoles.includes(session?.tipo)) return;

  const loginByRole = {
    empresa: "login-empresa.html",
    usina: "login-usina.html",
    "pessoa-fisica": "login-pessoa-fisica.html",
    pessoa_fisica: "login-pessoa-fisica.html"
  };

  window.location.href = loginByRole[allowedRoles[0]] || "login.html";
}());
