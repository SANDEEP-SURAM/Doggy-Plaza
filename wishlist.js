// wishlist.js (depends on store.js)

function addToCart(product) {
  const cart = getLS("cart");
  const id = String(product.id);

  const existing = cart.find(p => String(p.id) === id);
  if (existing) existing.qty = (existing.qty || 1) + 1;
  else cart.push({ ...product, qty: 1 });

  setLS("cart", cart);
}

function renderWishlist() {
  const wishListEl = document.getElementById("wishList");
  const wishItemsEl = document.getElementById("wishItems");
  const wishTotalEl = document.getElementById("wishTotal");
  if (!wishListEl) return;

  const wishlist = getLS("wishlist");
  wishListEl.innerHTML = "";

  if (wishlist.length === 0) {
    wishListEl.innerHTML = `
      <div class="empty">
        <i class="fa-solid fa-heart"></i>
        <p><b>Your wishlist is empty.</b></p>
        <p>Tap the heart icon on products to add items.</p>
      </div>
    `;
    if (wishItemsEl) wishItemsEl.textContent = "0";
    if (wishTotalEl) wishTotalEl.textContent = "0";
    updateHeaderCounts();
    return;
  }

  let total = 0;

  wishlist.forEach((p) => {
    const id = String(p.id);
    const title = p.title || "Product";
    const img = p.img || "";
    const price = Number(p.price) || 0;

    total += price;

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `
      <img src="${img}" alt="${title}">
      <div class="info">
        <div class="title">${title}</div>
        <div class="meta">
          <span>₹${price}</span>
        </div>

        <div class="actions">
          <button class="btn btn-primary" data-action="moveToCart" data-id="${id}" type="button">
            <i class="fa-solid fa-cart-shopping"></i> Move to Cart
          </button>

          <button class="btn btn-danger" data-action="removeWish" data-id="${id}" type="button">
            <i class="fa-regular fa-trash-can"></i> Remove
          </button>
        </div>
      </div>
    `;
    wishListEl.appendChild(div);
  });

  if (wishItemsEl) wishItemsEl.textContent = wishlist.length;
  if (wishTotalEl) wishTotalEl.textContent = total;

  updateHeaderCounts();
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = String(btn.dataset.id);

  if (action === "removeWish") {
    const wishlist = getLS("wishlist").filter(p => String(p.id) !== id);
    setLS("wishlist", wishlist);
    renderWishlist();
  }

  if (action === "moveToCart") {
    const wishlist = getLS("wishlist");
    const item = wishlist.find(p => String(p.id) === id);
    if (!item) return;

    // remove from wishlist
    setLS("wishlist", wishlist.filter(p => String(p.id) !== id));

    // add to cart
    addToCart(item);

    renderWishlist();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const clearWishBtn = document.getElementById("clearWishBtn");
  const moveAllBtn = document.getElementById("moveAllBtn");

  if (clearWishBtn) {
    clearWishBtn.addEventListener("click", () => {
      localStorage.removeItem("wishlist");
      renderWishlist();
    });
  }

  if (moveAllBtn) {
    moveAllBtn.addEventListener("click", () => {
      const wishlist = getLS("wishlist");
      if (wishlist.length === 0) return;

      wishlist.forEach(item => addToCart(item));
      localStorage.removeItem("wishlist");
      renderWishlist();
    });
  }

  renderWishlist();
});
