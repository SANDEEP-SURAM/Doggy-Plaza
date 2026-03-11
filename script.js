document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search");
  if (!searchInput) return;

  // Optional: sections to hide on index when searching
  const carouselSection = document.querySelector(".carousel-section"); // index only
  const servicesSection = document.querySelector(".services-section"); // index only
  const aboutSection = document.querySelector(".about-section");       // index only

  const recProductsSection = document.querySelector(".rec-products");  // index products
  const foodSection = document.querySelector(".food-section");         // dogfood products

  searchInput.addEventListener("input", () => {
    const searchText = searchInput.value.toLowerCase().trim();

    const pCards = document.querySelectorAll(".p-card");       // index.html cards
    const foodCards = document.querySelectorAll(".food-card"); // dogfood.html cards

    // Filter index cards
    pCards.forEach((card) => {
      const titleEl = card.querySelector(".p-title");
      const title = titleEl ? titleEl.innerText.toLowerCase() : "";
      card.hidden = searchText !== "" && !title.includes(searchText);
    });

    // Filter dogfood cards
    foodCards.forEach((card) => {
      const titleEl = card.querySelector(".food-title");
      const title = titleEl ? titleEl.innerText.toLowerCase() : "";
      card.hidden = searchText !== "" && !title.includes(searchText);
    });

    // ✅ If user types something, jump to products area
    if (searchText !== "") {
      if (recProductsSection) recProductsSection.scrollIntoView({ behavior: "smooth" });
      if (foodSection) foodSection.scrollIntoView({ behavior: "smooth" });

      // ✅ Hide top sections on index so user feels search is working
      if (carouselSection) carouselSection.style.display = "none";
      if (servicesSection) servicesSection.style.display = "none";
      if (aboutSection) aboutSection.style.display = "none";
    } else {
      // Restore when search empty
      if (carouselSection) carouselSection.style.display = "";
      if (servicesSection) servicesSection.style.display = "";
      if (aboutSection) aboutSection.style.display = "";
    }
  });
});
