// SURGE — shared interactivity (vanilla JS, easy to port to Shopify theme JS)

document.addEventListener('DOMContentLoaded', () => {

  // Mobile filter drawer toggle (category page)
  const filterBtn = document.querySelector('.filter-drawer-btn');
  const filters = document.querySelector('.filters');
  if (filterBtn && filters) {
    filterBtn.addEventListener('click', () => filters.classList.toggle('open'));
  }

  // Grid / list view toggle (category page)
  const viewButtons = document.querySelectorAll('.view-toggle button');
  const pgrid = document.querySelector('.pgrid');
  viewButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      viewButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (pgrid) pgrid.classList.toggle('list', btn.dataset.view === 'list');
    });
  });

  // Product gallery thumbnail swap (product page)
  const thumbs = document.querySelectorAll('.gallery-thumbs .thumb');
  thumbs.forEach(t => {
    t.addEventListener('click', () => {
      thumbs.forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
  });

  // Color swatch selection (product page)
  const swatches = document.querySelectorAll('.swatch');
  swatches.forEach(s => {
    s.addEventListener('click', () => {
      swatches.forEach(x => x.classList.remove('active'));
      s.classList.add('active');
    });
  });

  // Quantity stepper (product + cart pages)
  document.querySelectorAll('.qty-stepper').forEach(stepper => {
    const span = stepper.querySelector('span');
    const [minus, plus] = stepper.querySelectorAll('button');
    let qty = parseInt(span.textContent, 10) || 1;
    minus?.addEventListener('click', () => { if (qty > 1) qty--; span.textContent = qty; });
    plus?.addEventListener('click', () => { qty++; span.textContent = qty; });
  });

  // Mobile hamburger (simple demo: reveals nav links stacked)
  const hamburger = document.querySelector('.hamburger');
  const navlinks = document.querySelector('.navlinks');
  if (hamburger && navlinks) {
    hamburger.addEventListener('click', () => {
      navlinks.style.display = navlinks.style.display === 'flex' ? 'none' : 'flex';
      navlinks.style.cssText += 'flex-direction:column; position:absolute; top:100%; left:0; right:0; background:#1b1d28; padding:16px 28px; border-bottom:1px solid #2c2e3d;';
    });
  }
});
