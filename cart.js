// cart.js

function getLS(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function setLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const cartListEl = document.getElementById("cartList");
const subTotalEl = document.getElementById("subTotal");
const totalEl = document.getElementById("cartTotal");
const clearBtn = document.getElementById("clearCartBtn");

// Render cart items
function renderCart() {
  const cart = getLS("cart");

  if (!cartListEl) return;

  if (cart.length === 0) {
    cartListEl.innerHTML = `<p style="padding:12px;">Your cart is empty.</p>`;
    if (subTotalEl) subTotalEl.textContent = "0";
    if (totalEl) totalEl.textContent = "0";
    return;
  }

  let subtotal = 0;

  cartListEl.innerHTML = cart
    .map((p) => {
      const qty = p.qty || 1;
      const price = Number(p.price) || 0;
      const itemTotal = price * qty;
      subtotal += itemTotal;

      const img = p.img || "https://via.placeholder.com/80?text=No+Image";

    return `
  <div class="cart-item" data-id="${p.id}">
    <img src="${img}" alt="${p.title}"
      onerror="this.src='https://via.placeholder.com/80?text=No+Image'">

    <div class="item-info">
      <div class="item-title">${p.title}</div>
      <div class="item-meta">
        <span>₹${price}</span>
        <span>Item Total: ₹${itemTotal}</span>
      </div>

      <div class="item-actions">
        <div class="qty">
          <button data-action="dec">-</button>
          <span class="qty-val">${qty}</span>
          <button data-action="inc">+</button>
        </div>

        <button class="btn btn-danger" data-action="remove">Remove</button>
      </div>
    </div>
  </div>
`;

 
    })
    .join("");

  if (subTotalEl) subTotalEl.textContent = subtotal;
  if (totalEl) totalEl.textContent = subtotal; // shipping is free
}

// Handle + / - / Remove
document.addEventListener("click", (e) => {
  const item = e.target.closest(".cart-item");
  if (!item) return;

  const action = e.target.dataset.action;
  if (!action) return;

  const id = item.dataset.id;
  let cart = getLS("cart");
  const idx = cart.findIndex((p) => String(p.id) === String(id));
  if (idx === -1) return;

  if (action === "inc") {
    cart[idx].qty = (cart[idx].qty || 1) + 1;
  } else if (action === "dec") {
    cart[idx].qty = Math.max(1, (cart[idx].qty || 1) - 1);
  } else if (action === "remove") {
    cart.splice(idx, 1);
  }

  setLS("cart", cart);
  renderCart();
});

// Clear cart
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    setLS("cart", []);
    renderCart();
  });
}

// Run on page load
renderCart();

// ----------------------------
// Place Order -> Backend
// ----------------------------

function getCartItems() {
  return getLS("cart");
}

function getCartTotal() {
  return Number(totalEl?.textContent || 0);
}

async function placeOrder() {
  const name = document.getElementById("custName")?.value.trim();
  const phone = document.getElementById("custPhone")?.value.trim();
  const address = document.getElementById("custAddress")?.value.trim();

  const items = getCartItems();
  const total = getCartTotal();

  if (!name || !phone || !address) {
    alert("Please fill all checkout details.");
    return;
  }

  if (!items.length) {
    alert("Your cart is empty.");
    return;
  }

  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, address, items, total })
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      alert(data.error || "Order failed.");
      return;
    }

    // ✅ SAVE ORDER DETAILS FOR SUCCESS PAGE
localStorage.setItem("lastOrder", JSON.stringify({
  orderId: data.order_id,
  name,
  phone,
  address,
  items,
  total
}));

// clear cart
localStorage.removeItem("cart");

// redirect
window.location.href = "success.html";
  } catch (err) {
    console.error(err);
    alert("Server error. Make sure backend is running.");
  }
}

// Connect button
document.getElementById("placeOrderBtn")?.addEventListener("click", placeOrder);