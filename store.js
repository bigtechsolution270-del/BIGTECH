/* BIGTECH storefront — shared frontend logic.
   Single source of truth for products (fetched from the API/database),
   the cart (localStorage), search, filtering, and rendering used by
   index.html, category.html, product.html, cart.html and checkout.html. */
(() => {
  const API = "/api/products";
  const CART_KEY = "bigtech_cart";
  const WISH_KEY = "bigtech_wishlist";

  const ICONS = {
    phones: "📱", tablets: "📲", laptops: "💻", nintendo: "🎮",
    playstation: "🎮", xbox: "🎮", deals: "🔥", default: "🛍️"
  };

  const get = (k, fallback = []) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; }
  };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  let cart = get(CART_KEY);
  let wishlist = get(WISH_KEY);
  let products = [];
  let productsLoaded = false;

  const money = n => `C$${Number(n || 0).toLocaleString("en-US")}`;
  const icon = category => ICONS[String(category || "").toLowerCase()] || ICONS.default;
  const find = id => products.find(p => String(p.id) === String(id));

  async function loadProducts() {
    if (productsLoaded) return products;
    try {
      const res = await fetch(API);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      products = Array.isArray(data) ? data : (data.products || []);
      productsLoaded = true;
    } catch (err) {
      console.error("BIGTECH: could not load products", err);
      products = [];
    }
    return products;
  }

  // ---------- cart ----------
  function cartCount() { return cart.reduce((sum, x) => sum + x.qty, 0); }

  function updateBadges() {
    document.querySelectorAll(".cart-count,[data-cart-count]").forEach(el => el.textContent = cartCount());
    document.querySelectorAll("[data-wishlist-count]").forEach(el => el.textContent = wishlist.length);
  }

  function add(id, qty = 1) {
    const p = find(id);
    if (!p) return;
    if (p.stock !== undefined && p.stock <= 0) { toast("Sorry, this item is out of stock"); return; }
    const row = cart.find(x => String(x.id) === String(id));
    const currentQty = row ? row.qty : 0;
    const maxAllowed = p.stock !== undefined ? Number(p.stock) : Infinity;

    if (currentQty + qty > maxAllowed) {
      const remaining = Math.max(maxAllowed - currentQty, 0);
      if (remaining <= 0) { toast(`You already have all ${maxAllowed} in stock in your cart`); return; }
      if (row) row.qty += remaining; else cart.push({ id, qty: remaining });
      save(CART_KEY, cart);
      updateBadges();
      toast(`Only ${maxAllowed} of ${p.name} in stock — added ${remaining} more`);
      renderCart();
      return;
    }

    if (row) row.qty += qty; else cart.push({ id, qty });
    save(CART_KEY, cart);
    updateBadges();
    toast(`${p.name} added to cart`);
  }

  function remove(id) {
    cart = cart.filter(x => String(x.id) !== String(id));
    save(CART_KEY, cart);
    updateBadges();
  }

  function change(id, delta) {
    const row = cart.find(x => String(x.id) === String(id));
    if (!row) return;
    const p = find(id);
    const maxAllowed = p && p.stock !== undefined ? Number(p.stock) : Infinity;
    if (delta > 0 && row.qty + delta > maxAllowed) {
      toast(`Only ${maxAllowed} of ${p?.name || "this item"} in stock`);
      return;
    }
    row.qty += delta;
    if (row.qty <= 0) remove(id); else save(CART_KEY, cart);
    updateBadges();
    renderCart();
  }

  function toggleWish(id) {
    if (wishlist.includes(id)) wishlist = wishlist.filter(x => x !== id);
    else wishlist.push(id);
    save(WISH_KEY, wishlist);
    updateBadges();
  }

  function toast(msg) {
    let t = document.getElementById("bt-toast");
    if (!t) {
      t = document.createElement("div");
      t.id = "bt-toast";
      t.style.cssText = "position:fixed;right:20px;bottom:90px;z-index:9999;background:#151a24;color:#fff;border:1px solid #8b5cf6;padding:12px 16px;border-radius:12px;box-shadow:0 14px 35px #0008;font:600 13px Inter,sans-serif;transition:.25s;max-width:280px";
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = "1";
    clearTimeout(window.__btToast);
    window.__btToast = setTimeout(() => t.style.opacity = "0", 2200);
  }

  // ---------- product card rendering ----------
  function mediaFor(p) {
    if (p.image) {
      return `<img src="${escapeAttr(p.image)}" alt="${escapeAttr(p.name)}" loading="lazy" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;card-icon-fallback&quot;>${icon(p.category)}</span>')">`;
    }
    return `<span class="card-icon-fallback">${icon(p.category)}</span>`;
  }

  function escapeAttr(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  }
  const BRAND_KEYWORDS = [
    "Apple", "Samsung", "Sony", "Microsoft", "Nintendo", "Google", "Lenovo",
    "HP", "Dell", "ASUS", "Acer", "Xiaomi", "Motorola", "Huawei", "Amazon"
  ];
  function brandFor(p) {
    const haystack = `${p.name || ""}`;
    const found = BRAND_KEYWORDS.find(b => haystack.toLowerCase().includes(b.toLowerCase()));
    if (found) return found;
    // Fall back to platform-based brand guesses for consoles/accessories
    const cat = String(p.category || "").toLowerCase();
    if (cat === "playstation") return "Sony";
    if (cat === "xbox") return "Microsoft";
    if (cat === "nintendo") return "Nintendo";
    return "BIGTECH";
  }

  function escapeHtml(str) {
    return String(str ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Product card: image, name and price only — the whole card is a single
  // link to the product page. No buttons live inside the card itself.
  function productCard(p) {
    const outOfStock = p.stock !== undefined && Number(p.stock) <= 0;
    return `<a href="product.html?id=${p.id}" class="product-card" data-product-id="${p.id}">
      <div class="card-media">
        ${mediaFor(p)}
      </div>
      <div class="card-body">
        <div class="card-meta">${escapeHtml(p.category || "BIGTECH")}</div>
        <h3>${escapeHtml(p.name || "Unnamed product")}</h3>
        <div class="card-price">${money(p.price)}</div>
        ${outOfStock ? '<span class="card-out-of-stock">Out of stock</span>' : ""}
      </div>
    </a>`;
  }

  function renderGrid(root, list) {
    if (!root) return;
    if (!list.length) {
      root.innerHTML = `<div style="padding:55px 10px;text-align:center;grid-column:1/-1"><h2>No products found</h2><p style="color:var(--muted);margin-top:8px">Try a different search or category.</p></div>`;
      return;
    }
    root.innerHTML = list.map(productCard).join("");
  }

  // ---------- featured grid (index.html) ----------
  async function wireFeatured() {
    const root = document.querySelector("[data-featured-root]");
    if (!root) return;
    await loadProducts();
    const featured = products.filter(p => p.featured);
    renderGrid(root, (featured.length ? featured : products).slice(0, 8));
  }

  // ---------- category / catalog listing ----------
  async function wireCatalog() {
    const root = document.querySelector("[data-catalog-root]");
    if (!root) return;
    await loadProducts();

    const params = new URLSearchParams(location.search);
    const cat = params.get("category");
    const q = params.get("q")?.toLowerCase().trim();

    let list = products.slice();

    // Selected categories are the source of truth for filtering, seeded from
    // the ?category= URL param. This must NOT depend on whether a checkbox
    // happens to exist in the DOM for that category — if it did, requesting
    // a category with zero matching products (e.g. no laptops added yet)
    // would silently fall back to showing every product instead of an
    // honest "no products" result, which is what previously made clicking
    // "Laptops" appear to show random Xbox/PlayStation items.
    let selectedCategories = cat ? [cat.toLowerCase()] : [];

    // Build category checkboxes from real product categories, PLUS the
    // requested URL category even if no product currently has it, so the
    // checkbox and the URL always stay in sync.
    const filterGroup = document.querySelector("[data-category-filters]");
    if (filterGroup) {
      const knownCats = new Set(products.map(p => p.category).filter(Boolean));
      if (cat) knownCats.add(cat);
      const cats = Array.from(knownCats).sort((a, b) => a.localeCompare(b));
      filterGroup.innerHTML = cats.map(c =>
        `<label><input type="checkbox" data-filter="category" value="${escapeAttr(c)}" ${selectedCategories.includes(c.toLowerCase()) ? "checked" : ""}> ${escapeHtml(c)}</label>`
      ).join("") || `<p style="color:var(--faint);font-size:12px">No categories yet</p>`;
    }

    function applyFilters() {
      selectedCategories = Array.from(document.querySelectorAll("[data-filter='category']:checked")).map(el => el.value.toLowerCase());
      list = products.filter(p => {
        const matchesCategory = !selectedCategories.length || selectedCategories.includes(String(p.category || "").toLowerCase());
        const matchesQuery = !q || `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      });
      applySort();
    }

    function applySort() {
      const sortEl = document.getElementById("sort");
      const mode = sortEl ? sortEl.value : "default";
      if (mode === "low") list.sort((a, b) => Number(a.price) - Number(b.price));
      if (mode === "high") list.sort((a, b) => Number(b.price) - Number(a.price));
      renderGrid(root, list);
    }

    const heading = document.querySelector("[data-category-title]");
    if (heading) {
      if (q) heading.textContent = `Search results for "${q}"`;
      else if (cat) heading.textContent = cat;
      else heading.textContent = "All products";
    }

    document.querySelectorAll("[data-filter='category']").forEach(el => el.addEventListener("change", applyFilters));
    document.getElementById("sort")?.addEventListener("change", applySort);

    applyFilters();
  }

  // ---------- single product page ----------
  // Builds the 4-view product gallery: a main image plus clickable
  // thumbnails and prev/next arrows. Only views that actually have an
  // image are shown — a product with just one photo gets no thumbnail
  // row or arrows, so nothing looks broken for older/simpler listings.
  function renderGallery(p) {
    const galleryRoot = document.querySelector("[data-product-gallery]");
    if (!galleryRoot) return; // page has no gallery markup (shouldn't happen on product.html)

    const allViews = [
      { key: "front", url: p.image, label: "Front view" },
      { key: "back", url: p.image_back, label: "Back view" },
      { key: "side", url: p.image_side, label: "Side view" },
      { key: "closeup", url: p.image_closeup, label: "Close-up view" }
    ];
    const views = allViews.filter(v => v.url);
    // If literally no image exists for this product, still render one
    // "slot" so the icon fallback has somewhere to go.
    const activeViews = views.length ? views : [{ key: "front", url: "", label: "Front view" }];

    const mainEl = galleryRoot.querySelector("[data-gallery-main]");
    const thumbsEl = galleryRoot.querySelector("[data-gallery-thumbs]");
    const prevBtn = galleryRoot.querySelector("[data-gallery-prev]");
    const nextBtn = galleryRoot.querySelector("[data-gallery-next]");
    let currentIndex = 0;

    function altText(view) {
      return `${p.name} — ${view.label}`;
    }

    function showView(index, animate) {
      currentIndex = (index + activeViews.length) % activeViews.length;
      const view = activeViews[currentIndex];

      const paint = () => {
        mainEl.innerHTML = view.url
          ? `<img src="${escapeAttr(view.url)}" alt="${escapeAttr(altText(view))}" onerror="this.remove();this.parentElement.insertAdjacentHTML('beforeend','<span class=&quot;card-icon-fallback&quot;>${icon(p.category)}</span>')">`
          : `<span class="card-icon-fallback">${icon(p.category)}</span>`;
        if (animate) requestAnimationFrame(() => mainEl.classList.remove("fading"));
      };

      if (animate) {
        mainEl.classList.add("fading");
        setTimeout(paint, 140);
      } else {
        paint();
      }

      thumbsEl?.querySelectorAll("[data-thumb-index]").forEach(t => {
        t.classList.toggle("active", Number(t.dataset.thumbIndex) === currentIndex);
      });
    }

    if (thumbsEl) {
      if (activeViews.length > 1) {
        thumbsEl.hidden = false;
        thumbsEl.innerHTML = activeViews.map((v, i) => `
          <button type="button" class="gallery-thumb" data-thumb-index="${i}" aria-label="Show ${escapeAttr(v.label.toLowerCase())}">
            ${v.url ? `<img src="${escapeAttr(v.url)}" alt="${escapeAttr(altText(v))}" loading="lazy">` : `<span class="card-icon-fallback" style="font-size:24px">${icon(p.category)}</span>`}
          </button>
        `).join("");
        thumbsEl.querySelectorAll("[data-thumb-index]").forEach(btn => {
          btn.addEventListener("click", () => showView(Number(btn.dataset.thumbIndex), true));
        });
      } else {
        thumbsEl.hidden = true;
        thumbsEl.innerHTML = "";
      }
    }

    const showArrows = activeViews.length > 1;
    [prevBtn, nextBtn].forEach(btn => { if (btn) btn.hidden = !showArrows; });
    if (prevBtn) prevBtn.onclick = () => showView(currentIndex - 1, true);
    if (nextBtn) nextBtn.onclick = () => showView(currentIndex + 1, true);

    showView(0, false);
  }

  async function wireProductPage() {
    const root = document.querySelector("[data-product-root]");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id");
    await loadProducts();
    const p = id ? find(id) : null;

    if (!p) {
      root.innerHTML = `<div style="padding:60px 10px;text-align:center;grid-column:1/-1"><h1>Product not found</h1><p style="color:var(--muted);margin:10px 0 22px">This product may have been removed.</p><a class="btn btn-primary" href="category.html">Browse all products</a></div>`;
      document.title = "BIGTECH | Product not found";
      return;
    }

    document.title = `BIGTECH | ${p.name}`;
    const outOfStock = p.stock !== undefined && Number(p.stock) <= 0;

    document.querySelectorAll("[data-product-name]").forEach(e => e.textContent = p.name);
    document.querySelectorAll("[data-product-price]").forEach(e => e.textContent = money(p.price));
    document.querySelectorAll("[data-product-desc]").forEach(e => e.textContent = p.description || `Genuine ${p.name} from BIGTECH. Door-to-door delivery is available, with free delivery around Managua. Contact +505 7890 4496 for availability and order confirmation.`);
    document.querySelectorAll("[data-product-category]").forEach(e => { e.textContent = p.category || "BIGTECH"; e.href = `category.html?category=${encodeURIComponent(p.category || "")}`; });
    document.querySelectorAll("[data-product-brand]").forEach(e => { e.textContent = brandFor(p); });
    document.querySelectorAll("[data-product-stock]").forEach(e => {
      e.innerHTML = outOfStock ? "Out of stock" : `<span class="dot"></span> In stock${p.stock ? ` (${p.stock} left)` : ""}`;
      e.classList.toggle("stock", !outOfStock);
    });
    renderGallery(p);

    document.querySelectorAll("[data-add-product]").forEach(b => {
      b.disabled = outOfStock;
      b.textContent = outOfStock ? "Out of stock" : "Add to cart";
      b.onclick = () => add(p.id, getQty());
    });

    function getQty() {
      const stepper = document.querySelector(".pdp-qty-row .qty-stepper span, [data-product-qty]");
      const n = parseInt(stepper?.textContent, 10);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }

    // Description / Reviews tabs
    const tabButtons = document.querySelectorAll("[data-tab]");
    tabButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        tabButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        document.querySelectorAll("[data-tab-panel]").forEach(panel => {
          panel.hidden = panel.dataset.tabPanel !== btn.dataset.tab;
        });
      });
    });
  }

  // ---------- cart page ----------
  async function renderCart() {
    const root = document.querySelector("[data-cart-root]");
    if (!root) return;
    await loadProducts();

    if (!cart.length) {
      root.innerHTML = `<div style="padding:55px 10px;text-align:center"><h2>Your cart is empty</h2><p style="color:var(--muted);margin:10px 0 22px">Add products from BIGTECH to get started.</p><a class="btn btn-primary" href="category.html">Shop products</a></div>`;
      document.querySelectorAll("[data-cart-subtotal],[data-cart-total]").forEach(e => e.textContent = money(0));
      return;
    }

    root.innerHTML = cart.map(x => {
      const p = find(x.id);
      if (!p) return "";
      return `<div class="cart-item">
        <div class="cart-thumb">${mediaFor(p)}</div>
        <div><h4>${escapeHtml(p.name)}</h4><div class="meta">${escapeHtml(p.category || "")}</div><a href="#" class="remove-link" data-remove="${x.id}">Remove</a></div>
        <div class="qty-stepper"><button data-minus="${x.id}">−</button><span>${x.qty}</span><button data-plus="${x.id}">+</button></div>
        <div class="cart-price">${money((p.price || 0) * x.qty)}</div>
      </div>`;
    }).join("");

    root.querySelectorAll("[data-minus]").forEach(b => b.onclick = e => { e.preventDefault(); change(b.dataset.minus, -1); });
    root.querySelectorAll("[data-plus]").forEach(b => b.onclick = e => { e.preventDefault(); change(b.dataset.plus, 1); });
    root.querySelectorAll("[data-remove]").forEach(b => b.onclick = e => { e.preventDefault(); remove(b.dataset.remove); renderCart(); });

    const subtotal = cart.reduce((s, x) => s + (find(x.id)?.price || 0) * x.qty, 0);
    document.querySelectorAll("[data-cart-subtotal],[data-cart-total]").forEach(e => e.textContent = money(subtotal));
  }

  // ---------- checkout ----------
  async function wireCheckout() {
    const form = document.querySelector("[data-checkout-form]");
    if (!form) return;
    await loadProducts();

    const total = cart.reduce((s, x) => s + (find(x.id)?.price || 0) * x.qty, 0);
    document.querySelectorAll("[data-checkout-total]").forEach(e => e.textContent = money(total));

    form.addEventListener("submit", async e => {
      e.preventDefault();
      if (!cart.length) { toast("Your cart is empty"); return; }

      const submitBtn = form.querySelector("button[type='submit']");
      const originalLabel = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Placing order…"; }

      const data = new FormData(form);
      const name = data.get("name") || "Customer";
      const address = data.get("address") || "";
      const phone = data.get("phone") || "";
      const note = data.get("note") || "";
      const items = cart.map(x => {
        const p = find(x.id);
        return { id: x.id, name: p?.name || "Product", qty: x.qty, price: p?.price || 0 };
      });
      const orderTotal = items.reduce((s, i) => s + i.price * i.qty, 0);

      let orderSaved = false;
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: name,
            customer_phone: phone,
            customer_address: address,
            items,
            total: orderTotal
          })
        });
        const result = await res.json().catch(() => ({}));

        if (!res.ok) {
          // e.g. insufficient stock — stop here, keep the cart, let the person fix it.
          toast(result.error || "Could not place your order. Please try again.");
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
          await loadFreshStock();
          renderCart();
          return;
        }
        orderSaved = true;
      } catch (err) {
        console.error("BIGTECH: could not save order", err);
        toast("Network error — please check your connection and try again.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
        return;
      }

      const lines = items.map(i => `${i.name} x${i.qty}`).join(", ");
      const msg = `Hello BIGTECH! I want to place an order.%0A%0AName: ${encodeURIComponent(name)}%0APhone: ${encodeURIComponent(phone)}%0AAddress: ${encodeURIComponent(address)}%0ANote: ${encodeURIComponent(note)}%0AProducts: ${encodeURIComponent(lines)}%0ATotal: ${encodeURIComponent(money(orderTotal))}`;

      cart = [];
      save(CART_KEY, cart);
      updateBadges();

      window.open(`https://wa.me/50578904496?text=${msg}`, "_blank");
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      toast("Order placed! Confirm the details on WhatsApp.");
      setTimeout(() => { location.href = "index.html"; }, 1500);
    });
  }

  // Re-fetch products so stock numbers reflect the latest DB state
  // (used after a failed checkout so the cart/product pages show accurate stock).
  async function loadFreshStock() {
    productsLoaded = false;
    await loadProducts();
  }

  // ---------- search + nav ----------
  function wireSearch() {
    document.querySelectorAll(".searchbar input,[data-search]").forEach(input => {
      input.addEventListener("keydown", e => {
        if (e.key === "Enter") {
          const q = input.value.trim();
          location.href = `category.html${q ? "?q=" + encodeURIComponent(q) : ""}`;
        }
      });
    });
  }

  function wireCategoryNav() {
    document.querySelectorAll("[data-category]").forEach(a => {
      a.addEventListener("click", e => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return; // let new-tab/middle-click behave normally
        const c = a.dataset.category;
        if (c) { e.preventDefault(); location.href = `category.html?category=${encodeURIComponent(c)}`; }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    updateBadges();
    wireSearch();
    wireCategoryNav();
    wireFeatured();
    wireCatalog();
    wireProductPage();
    renderCart();
    wireCheckout();

    document.querySelectorAll("[data-action='shop']").forEach(b => b.onclick = () => location.href = "category.html");
    document.querySelectorAll("[data-action='cart']").forEach(b => b.onclick = () => location.href = "cart.html");
    document.querySelectorAll("[data-action='checkout']").forEach(b => b.onclick = () => location.href = "checkout.html");
    document.querySelectorAll(".cart-link").forEach(b => b.onclick = e => { e.preventDefault(); location.href = "cart.html"; });
  });

  window.BIGTECH = { add, remove, change, toggleWish, money, loadProducts };
})();
