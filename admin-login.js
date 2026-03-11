document.getElementById("loginBtn").addEventListener("click", async () => {
  const username = document.getElementById("u").value.trim();
  const password = document.getElementById("p").value.trim();
  const err = document.getElementById("err");
  err.textContent = "";

  if (!username || !password) {
    err.textContent = "Enter username and password";
    return;
  }

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ username, password })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    err.textContent = data.error || "Login failed";
    return;
  }

  localStorage.setItem("admin_token", data.token);
  location.href = "/admin.html";
});