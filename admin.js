const token = localStorage.getItem("admin_token");
if (!token) {
  location.href = "/admin-login.html";
}
let allOrders = [];

function badgeClass(status) {
  const s = (status || "Pending").toLowerCase();
  if (s === "pending") return "badge pending";
  if (s === "confirmed") return "badge confirmed";
  if (s === "delivered") return "badge delivered";
  if (s === "cancelled") return "badge cancelled";
  return "badge pending";
}

function renderStats(list) {
  const totalOrders = list.length;
  const revenue = list.reduce((a, o) => a + (Number(o.total) || 0), 0);
  const pending = list.filter(o => (o.status || "Pending") === "Pending").length;
  const delivered = list.filter(o => (o.status || "") === "Delivered").length;

  document.getElementById("stOrders").textContent = totalOrders;
  document.getElementById("stRevenue").textContent = "₹" + revenue.toFixed(2);
  document.getElementById("stPending").textContent = pending;
  document.getElementById("stDelivered").textContent = delivered;
}

function itemsHtml(items) {
  return `
    <div class="items">
      ${(items || []).map(it => {
        const img = it.img || "https://via.placeholder.com/46?text=No";
        const qty = it.qty || 1;
        const price = it.price || 0;
        const title = it.title || "Item";
        return `
          <div class="item">
            <img src="${img}" onerror="this.src='https://via.placeholder.com/46?text=No'">
            <div>
              <div style="font-weight:800">${title}</div>
              <div class="small">Qty: ${qty} • ₹${price}</div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function rowHtml(o) {
  return `
    <tr>
      <td>#${o.id}</td>
      <td>${(o.created_at || "").replace(" ", "<br>")}</td>
      <td>
        <div style="font-weight:800">${o.name || "-"}</div>
        <div class="small">${o.phone || "-"}</div>
      </td>
      <td style="font-weight:800">₹${Number(o.total ?? 0).toFixed(2)}</td>
      <td>
        <div class="${badgeClass(o.status)}" style="margin-bottom:8px">${o.status || "Pending"}</div>
        <select data-action="status" data-id="${o.id}">
          ${["Pending","Confirmed","Delivered","Cancelled"].map(s => `
            <option value="${s}" ${s === (o.status || "Pending") ? "selected" : ""}>${s}</option>
          `).join("")}
        </select>
      </td>
      <td style="max-width:260px">${o.address || "-"}</td>
      <td style="min-width:320px">${itemsHtml(o.items)}</td>
      <td>
        <button class="btn danger" data-action="delete" data-id="${o.id}">Delete</button>
      </td>
    </tr>
  `;
}

function render(list) {
  renderStats(list);
  document.getElementById("rows").innerHTML = list.map(rowHtml).join("");
}

async function load() {
  const res = await fetch("/api/orders", {
    headers: { "X-Admin-Token": token }
  });

  if (res.status === 401) {
    localStorage.removeItem("admin_token");
    location.href = "/admin-login.html";
    return;
  }

  allOrders = await res.json();
  render(allOrders);
}

document.getElementById("refreshBtn").addEventListener("click", load);

document.getElementById("q").addEventListener("input", (e) => {
  const v = e.target.value.toLowerCase();
  const filtered = allOrders.filter(o =>
    String(o.name || "").toLowerCase().includes(v) ||
    String(o.phone || "").toLowerCase().includes(v) ||
    String(o.address || "").toLowerCase().includes(v)
  );
  render(filtered);
});

document.addEventListener("change", async (e) => {
  const el = e.target;
  if (el.dataset.action !== "status") return;

  const id = el.dataset.id;
  const status = el.value;

  const res = await fetch(`/api/orders/${id}/status`, {
    method: "PATCH",
    headers: {
  "Content-Type": "application/json",
  "X-Admin-Token": token
},
    body: JSON.stringify({ status })
  });

  const data = await res.json();
  if (!res.ok || !data.ok) {
    alert(data.error || "Failed to update status");
    return;
  }
  load();
});

document.addEventListener("click", async (e) => {
  const el = e.target;
  if (el.dataset.action !== "delete") return;

  const id = el.dataset.id;
  if (!confirm("Delete this order?")) return;

  const res = await fetch(`/api/orders/${id}`, {
  method: "DELETE",
  headers: { "X-Admin-Token": token }
});
  const data = await res.json();

  if (!res.ok || !data.ok) {
    alert(data.error || "Failed to delete");
    return;
  }
  load();
});

load();