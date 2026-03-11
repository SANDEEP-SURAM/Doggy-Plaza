function getUser() {
  try { return JSON.parse(localStorage.getItem("dp_user") || "null"); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem("dp_user");
  window.location.href = "index.html";
}

document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.getElementById("loginLink");
  const loginText = document.getElementById("loginText"); // may be null
  if (!loginLink) return;

  const user = getUser();

  if (user) {
    if (loginText) loginText.textContent = user.name;
    else loginLink.textContent = user.name; // fallback for simple headers

    loginLink.href = "#";
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      if (confirm("Logout from Doggy Plaza?")) logout();
    });
  } else {
    if (loginText) loginText.textContent = "Login";
    else loginLink.textContent = "Login";
    loginLink.href = "login.html";
  }
});