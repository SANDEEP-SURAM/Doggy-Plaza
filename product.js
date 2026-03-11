// ---------- Helpers ----------
function getLS(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function setLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateCounts() {
  const cart = getLS("cart");
  const wishlist = getLS("wishlist");

  const cartCountEl = document.getElementById("cartCount");
  const wishCountEl = document.getElementById("wishCount");

  if (cartCountEl) cartCountEl.textContent = cart.reduce((sum, p) => sum + (p.qty || 1), 0);
  if (wishCountEl) wishCountEl.textContent = wishlist.length;
}

// ---------- Add to Cart ----------
function addToCart(product) {
  const cart = getLS("cart");
  const existing = cart.find((p) => p.id === product.id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  setLS("cart", cart);
  updateCounts();
}

// ---------- Toggle Wishlist ----------
function toggleWishlist(product) {
  let wishlist = getLS("wishlist");
  const exists = wishlist.some((p) => p.id === product.id);

  if (exists) {
    wishlist = wishlist.filter((p) => p.id !== product.id);
  } else {
    wishlist.push(product);
  }

  setLS("wishlist", wishlist);
  updateCounts();
  return !exists; // returns true if added, false if removed
}

// ---------- Read product from card ----------
function getProductFromCard(card) {
  const imgEl = card.querySelector(".food-img img"); // take image from <img src="...">

  return {
    id: String(card.dataset.id),
    title: String(card.dataset.title),
    price: Number(card.dataset.price),
    img: imgEl ? imgEl.src : "",   // ✅ real image url
  };
}


// ---------- Init ----------
document.addEventListener("click", (e) => {
  const addBtn = e.target.closest(".btn-add");
  const wishBtn = e.target.closest(".wish-btn");

 // Add to cart
if (addBtn) {
  // 🔒 FIX 1: prevent double add
  if (addBtn.dataset.locked === "1") return;
  addBtn.dataset.locked = "1";

  const card = addBtn.closest(".food-card");
  if (!card) return;

  const product = getProductFromCard(card);
  addToCart(product);

  // small UI feedback (no alert)
  addBtn.textContent = "Added ✓";
  setTimeout(() => {
    addBtn.textContent = "Add to Cart";
    addBtn.dataset.locked = "0"; // unlock
  }, 800);
}


  // Wishlist
  if (wishBtn) {
    const card = wishBtn.closest(".food-card");
    if (!card) return;

    const product = getProductFromCard(card);
    const added = toggleWishlist(product);

    const icon = wishBtn.querySelector("i");
    if (icon) {
      icon.classList.toggle("fa-regular", !added);
      icon.classList.toggle("fa-solid", added);
    }
  }
});

function markWishlistedCards() {
  const wishlist = getLS("wishlist");
  const wishedIds = new Set(wishlist.map((p) => p.id));

  document.querySelectorAll(".food-card").forEach((card) => {
    const wishBtn = card.querySelector(".wish-btn i");
    if (!wishBtn) return;

    const isWished = wishedIds.has(card.dataset.id);
    wishBtn.classList.toggle("fa-solid", isWished);
    wishBtn.classList.toggle("fa-regular", !isWished);
  });
}

updateCounts();
markWishlistedCards();
