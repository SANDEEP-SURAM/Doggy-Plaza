// store.js (shared helpers only)
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

// Optional: update counts in header (only if those spans exist)
function updateHeaderCounts() {
  const cart = getLS("cart");
  const wishlist = getLS("wishlist");

  const cartCountEl = document.getElementById("cartCount");
  const wishCountEl = document.getElementById("wishCount");

  const cartQty = cart.reduce((sum, p) => sum + (Number(p.qty) || 1), 0);

  if (cartCountEl) cartCountEl.textContent = cartQty;
  if (wishCountEl) wishCountEl.textContent = wishlist.length;
}

