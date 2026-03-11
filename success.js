function getOrderIdFromUrl() {
  const p = new URLSearchParams(location.search);
  const id = p.get("order_id");
  return id ? Number(id) : null;
}

function render(order) {
  document.getElementById("orderId").textContent = "#" + order.id;
  document.getElementById("total").textContent = "₹" + order.total;
  document.getElementById("name").textContent = order.name || "-";
  document.getElementById("phone").textContent = order.phone || "-";
  document.getElementById("address").textContent = order.address || "-";

  const badge = document.getElementById("statusBadge");
  badge.textContent = order.status || "Pending";

  const itemsEl = document.getElementById("itemsList");
  itemsEl.innerHTML = (order.items || []).map(it => {
    const img = it.img || "https://via.placeholder.com/60?text=No+Image";
    const qty = it.qty || 1;
    const price = it.price || 0;
    return `
      <div class="item">
        <img src="${img}" onerror="this.src='https://via.placeholder.com/60?text=No+Image'">
        <div>
          <h4>${it.title || "Item"}</h4>
          <div class="muted">Qty: ${qty} • Price: ₹${price}</div>
        </div>
      </div>
    `;
  }).join("");
}

async function load() {
  // ✅ STEP 1: READ ORDER FROM localStorage
  const lastOrder = JSON.parse(localStorage.getItem("lastOrder"));

  if (lastOrder) {
    render({
      id: lastOrder.orderId,   // VERY IMPORTANT
      name: lastOrder.name,
      phone: lastOrder.phone,
      address: lastOrder.address,
      total: lastOrder.total,
      items: lastOrder.items,
      status: "Pending"
    });
    return;
  }

  // STEP 2 (optional): backend fallback
  const orderId = getOrderIdFromUrl();
  if (orderId) {
    const res = await fetch(`/api/orders/${orderId}`);
    if (res.ok) return render(await res.json());
  }

  alert("No order details found");
}

load().catch(() => alert("Could not load order details"));