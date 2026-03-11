// Mobile nav toggle
const navBtn = document.getElementById("navBtn");
const navLinks = document.getElementById("navLinks");
navBtn?.addEventListener("click", () => navLinks.classList.toggle("show"));

const form = document.getElementById("apptForm");
const formMsg = document.getElementById("formMsg");
const apptList = document.getElementById("apptList");
const clearBtn = document.getElementById("clearAppts");

function getAppts() {
  try {
    return JSON.parse(localStorage.getItem("doggy_vet_appointments")) || [];
  } catch {
    return [];
  }
}

function setAppts(list) {
  localStorage.setItem("doggy_vet_appointments", JSON.stringify(list));
}

function renderAppts() {
  const items = getAppts();
  apptList.innerHTML = "";

  if (items.length === 0) {
    apptList.innerHTML = `<div class="appt-item"><div class="left">
      <div class="title">No appointments saved</div>
      <div class="sub">Submit the form above to add one.</div>
    </div></div>`;
    return;
  }

  items.forEach((a, idx) => {
    const el = document.createElement("div");
    el.className = "appt-item";
    el.innerHTML = `
      <div class="left">
        <div class="title">${a.owner} • ${a.pet} (${a.petType})</div>
        <div class="sub">📞 ${a.phone} • 🩺 ${a.service} • 📅 ${a.date}</div>
        ${a.message ? `<div class="sub">💬 ${a.message}</div>` : ""}
      </div>
      <div class="right">
        <button class="small-btn" data-del="${idx}">Delete</button>
      </div>
    `;
    apptList.appendChild(el);
  });

  // delete handlers
  apptList.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = Number(btn.getAttribute("data-del"));
      const list = getAppts();
      list.splice(index, 1);
      setAppts(list);
      renderAppts();
    });
  });
}

function isValidPhone(phone) {
  // simple India-style 10 digits check
  return /^[6-9]\d{9}$/.test(phone.trim());
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();

  const owner = document.getElementById("ownerName").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const pet = document.getElementById("petName").value.trim();
  const petType = document.getElementById("petType").value;
  const service = document.getElementById("service").value;
  const date = document.getElementById("date").value;
  const message = document.getElementById("message").value.trim();

  formMsg.textContent = "";
  formMsg.style.color = "";

  if (!isValidPhone(phone)) {
    formMsg.textContent = "❌ Enter a valid 10-digit phone number (starts with 6-9).";
    formMsg.style.color = "#ff4c4c";
    return;
  }

  if (!owner || !pet || !petType || !service || !date) {
    formMsg.textContent = "❌ Please fill all required fields.";
    formMsg.style.color = "#ff4c4c";
    return;
  }

  const appt = {
    owner, phone, pet, petType, service, date, message,
    createdAt: new Date().toISOString()
  };

  const list = getAppts();
  list.unshift(appt);
  setAppts(list);

  form.reset();
  formMsg.textContent = "✅ Appointment saved! (Demo stored in localStorage)";
  formMsg.style.color = "#2e8b57";

  renderAppts();
});

clearBtn?.addEventListener("click", () => {
  localStorage.removeItem("doggy_vet_appointments");
  renderAppts();
});

// Initial render
renderAppts();