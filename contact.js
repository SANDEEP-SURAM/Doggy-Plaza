document.getElementById("contactForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("cName").value.trim();
  const email = document.getElementById("cEmail").value.trim();
  const message = document.getElementById("cMsg").value.trim();

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      alert("✅ Message sent successfully!");
      e.target.reset();
    } else {
      alert(data.error || "Failed to send message.");
    }
  } catch (err) {
    alert("Server error. Is backend running?");
    console.error(err);
  }
});