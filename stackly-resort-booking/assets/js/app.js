/* ============================================================
   Stackly â€” app.js
   Global UI: navbar, dropdowns, filters, accordions, search,
   hero search, date constraints, and site-wide interactions.
   ============================================================ */

const StacklyApp = (() => {
  const V = () => StacklyValidate;

  /* ---------- navbar ---------- */

  function bindSharedFooter() {
    const container = document.querySelector('.footer .container');
    if (!container) return;
    container.innerHTML = `
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" aria-label="Stackly home"><img class="footer-brand-logo footer-brand-logo-light" src="../images/Stackly_logo_clean.webp" alt="Stackly"></a>
          <p>Stackly is a premium resort, hotel and villa booking platform making luxury stays accessible and unforgettable.</p>
          <div class="footer-social">
            <a href="404.html" class="icon-btn" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="404.html" class="icon-btn" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="404.html" class="icon-btn" aria-label="X (Twitter)"><i class="fa-brands fa-x-twitter"></i></a>
            <a href="404.html" class="icon-btn" aria-label="YouTube"><i class="fa-brands fa-youtube"></i></a>
          </div>
        </div>
        <div>
          <h3 style="margin-bottom:1rem">Explore</h3>
          <div class="footer-links">
            <a class="footer-link" href="destinations.html">Destinations</a>
            <a class="footer-link" href="hotels.html">Hotels &amp; Resorts</a>
            <a class="footer-link" href="offers.html">Offers</a>
            <a class="footer-link" href="contact.html">Contact Us</a>
          </div>
        </div>
        <div>
          <h3 style="margin-bottom:1rem">Account</h3>
          <div class="footer-links">
            <a class="footer-link" href="login.html">Login</a>
            <a class="footer-link" href="signup.html">Sign Up</a>
            <a class="footer-link" href="dashboard/overview.html">My Dashboard</a>
            <a class="footer-link" href="dashboard/bookings.html">My Bookings</a>
          </div>
        </div>
        <div>
          <h3 style="margin-bottom:1rem">Support</h3>
          <div class="footer-links">
            <a class="footer-link" href="contact.html#faq">FAQ</a>
            <a class="footer-link" href="contact.html">Help Centre</a>
            <a class="footer-link" href="contact.html">Privacy Policy</a>
            <a class="footer-link" href="contact.html">Terms of Service</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom"><p>Â© 2026 Stackly. All rights reserved. Frontend demo â€” no real reservations or payments are processed.</p></div>`;
  }

  function bindNavbar() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.nav-toggle');
    const menu = document.querySelector('.nav-menu');
    if (!nav) return;

    // active page
    const cur = location.pathname.split('/').pop();
    nav.querySelectorAll('.nav-link').forEach(a => {
      const href = a.getAttribute('href');
      if (href === cur || (href === 'index.html' && cur === '') || (href === './index.html' && cur === '')) {
        a.classList.add('active');
      }
    });

    if (toggle) {
      toggle.addEventListener('click', () => {
        menu.classList.toggle('open');
        toggle.classList.toggle('open');
      });
    }

    // close on link click (mobile)
    nav.querySelectorAll('.nav-link:not(.dropdown-toggle), .nav-btn').forEach(a => {
      a.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.classList.remove('open');
      });
    });

    // sticky shadow
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 12);
    }, { passive: true });

    // close dropdowns on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.dropdown')) {
        nav.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
      }
    });

    // close dropdowns on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        nav.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        menu.classList.remove('open');
        if (toggle) toggle.classList.remove('open');
      }
    });

    // mobile dropdown toggle (desktop uses CSS :hover; link navigates normally)
    nav.querySelectorAll('.dropdown-toggle').forEach(t => {
      t.addEventListener('click', e => {
        const menu = t.nextElementSibling;
        if (!menu || !menu.classList.contains('dropdown-menu')) return;
        const isMobile = window.matchMedia('(max-width: 1080px)').matches;
        if (!isMobile) return; // desktop: hover handles the dropdown; let the link navigate
        e.preventDefault();
        const willShow = !menu.classList.contains('show');
        nav.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        if (willShow) {
          menu.classList.add('show');
          const rect = menu.getBoundingClientRect();
          if (rect.right > window.innerWidth) menu.style.left = 'auto';
          if (rect.bottom > window.innerHeight) menu.style.top = 'auto';
        }
      });
    });
  }

  /* ---------- hero search ---------- */

  function bindHeroSearch() {
    const form = document.getElementById('hero-search');
    if (!form) return;
    const ci = form.querySelector('#check-in');
    const co = form.querySelector('#check-out');
    const dest = form.querySelector('#destination');

    const today = new Date();
    if (ci) ci.min = today.toISOString().slice(0, 10);

    if (ci) {
      ci.addEventListener('change', () => {
        if (co && ci.value) {
          const d = new Date(ci.value);
          d.setDate(d.getDate() + 1);
          co.min = d.toISOString().slice(0, 10);
          if (co.value && new Date(co.value) <= new Date(ci.value)) {
            co.value = co.min;
          }
        }
      });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();
      V().clearAllErrors(form);
      let ok = true;
      if (dest && V().isEmpty(dest.value)) { V().setFieldError(dest, 'Destination required'); ok = false; }
      if (ci && V().isEmpty(ci.value)) { V().setFieldError(ci, 'Check-in required'); ok = false; }
      if (co && V().isEmpty(co.value)) { V().setFieldError(co, 'Check-out required'); ok = false; }
      if (ci && co && ci.value && co.value && new Date(co.value) <= new Date(ci.value)) {
        V().setFieldError(co, 'Check-out must be after check-in'); ok = false;
      }
      if (!ok) { V().toast('Please complete the search fields.', 'error'); return; }
      V().toast('Searching for hotels in ' + dest.value + 'â€¦', 'info', 2600);
      setTimeout(() => window.location.href = 'hotels.html?dest=' + encodeURIComponent(dest.value), 900);
    });
  }

  /* ---------- date constraints ---------- */

  function bindDateConstraints() {
    document.querySelectorAll('[data-date-constrain]').forEach(wrap => {
      const ci = wrap.querySelector('.date-ci');
      const co = wrap.querySelector('.date-co');
      if (!ci || !co) return;
      const today = new Date();
      ci.min = today.toISOString().slice(0, 10);
      ci.addEventListener('change', () => {
        const d = new Date(ci.value);
        d.setDate(d.getDate() + 1);
        co.min = d.toISOString().slice(0, 10);
        if (co.value && new Date(co.value) <= new Date(ci.value)) co.value = co.min;
      });
    });
  }

  /* ---------- accordions ---------- */

  function bindAccordions() {
    document.querySelectorAll('.accordion-item').forEach(item => {
      const hdr = item.querySelector('.accordion-header');
      hdr.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        item.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  /* ---------- newsletter ---------- */

  function bindNewsletter() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      const input = form.email;
      V().clearAllErrors(form);
      if (!input || V().isEmpty(input.value)) { V().setFieldError(input, 'Email required'); return; }
      if (!V().isEmail(input.value)) { V().setFieldError(input, 'Invalid email'); return; }
      StacklyStorage.addNewsletter(input.value);
      V().toast('Subscribed to Stackly newsletter.', 'success');
      form.reset();
    });
  }

  /* ---------- view details modal (home/hotels cards) ---------- */

  function bindViewDetails() {
    document.querySelectorAll('[data-view-details]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.hotelId;
        const hotel = StacklyData.hotelById(id);
        if (!hotel) { V().toast('Hotel details unavailable in demo.', 'error'); return; }
        const modal = document.getElementById('detail-modal');
        if (!modal) return;
        modal.querySelector('.dm-title').textContent = hotel.name;
        const locEl = modal.querySelector('.dm-location');
        const locSpan = locEl.querySelector('span');
        const locText = hotel.destination + ' â€¢ ' + hotel.stars + ' Star â€¢ â˜… ' + hotel.rating;
        if (locSpan) locSpan.textContent = locText; else locEl.textContent = locText;
        modal.querySelector('.dm-img').src = hotel.image;
        modal.querySelector('.dm-img').alt = hotel.name;
        modal.querySelector('.dm-desc').textContent = hotel.description;
        modal.querySelector('.dm-price').textContent = '$' + hotel.price + ' / night';
        modal.querySelector('.dm-amenities').innerHTML = (hotel.amenities || []).map(a => {
          const lbl = StacklyData.amenityLabels[a] || a;
          return `<span class="chip"><i class="fa-solid fa-check"></i> ${lbl}</span>`;
        }).join('');
        modal.querySelector('.dm-rooms').innerHTML = (hotel.rooms || []).map(r => `<li><strong>${r.type}</strong> â€” $${r.price}/night (up to ${r.capacity} guests)</li>`).join('');
        const book = modal.querySelector('.dm-book');
        if (book) book.href = 'hotels.html?hotel=' + encodeURIComponent(hotel.id) + '&dest=' + encodeURIComponent(hotel.destination);
        V().openModal('detail-modal');
      });
    });
  }

  /* ---------- search + filters for hotels/destinations ---------- */

  function bindHotelFilters() {
    const grid = document.getElementById('hotel-grid');
    const search = document.getElementById('hotel-search');
    const price = document.getElementById('price-range');
    const rating = document.getElementById('rating-filter');
    const type = document.getElementById('type-filter');
    const sort = document.getElementById('sort-filter');
    const destFilter = document.getElementById('dest-filter');
    const empty = document.getElementById('hotel-empty');
    if (!grid) return;

    // populate destination filter from available hotels
    if (destFilter) {
      const names = [...new Set(StacklyData.hotels.map(h => h.destination))];
      names.forEach(n => destFilter.appendChild(new Option(n, n)));
    }

    const params = new URLSearchParams(location.search);
    if (params.get('dest') && destFilter) {
      // try to match
      for (let i = 0; i < destFilter.options.length; i++) {
        if (destFilter.options[i].value.toLowerCase() === params.get('dest').toLowerCase()) { destFilter.value = destFilter.options[i].value; break; }
      }
    }
    if (params.get('hotel') && search) {
      const h = StacklyData.hotelById(params.get('hotel'));
      if (h) search.value = h.name;
    }

    function render() {
      const term = (search && search.value || '').toLowerCase();
      const pmax = price ? Number(price.value) : 9999;
      const rmin = rating ? Number(rating.value) : 0;
      const t = type ? type.value : 'all';
      const d = destFilter ? destFilter.value : 'all';
      const s = sort ? sort.value : 'default';

      let list = StacklyData.hotels.slice();
      if (d !== 'all') list = list.filter(h => h.destination === d);
      if (t !== 'all') list = list.filter(h => h.type === t);
      list = list.filter(h => h.price <= pmax);
      list = list.filter(h => h.rating >= rmin);
      if (term) list = list.filter(h => h.name.toLowerCase().includes(term) || h.destination.toLowerCase().includes(term));

      if (s === 'price-asc') list.sort((a, b) => a.price - b.price);
      if (s === 'price-desc') list.sort((a, b) => b.price - a.price);
      if (s === 'rating-desc') list.sort((a, b) => b.rating - a.rating);
      if (s === 'popularity') list.sort((a, b) => b.reviews - a.reviews);

      grid.innerHTML = '';
      if (!list.length) {
        if (empty) empty.style.display = 'flex';
        return;
      }
      if (empty) empty.style.display = 'none';

      list.forEach(h => {
        const el = document.createElement('article');
        el.className = 'hotel-card';
        const curUser = StacklyStorage.getCurrentUser();
        const isFav = curUser ? StacklyStorage.isFavorite(curUser.email, h.id) : false;
        el.innerHTML = `
          <div class="hotel-img-wrap">
            <img src="${h.image}" alt="${h.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
            ${curUser ? `<button class="icon-btn fav-btn${isFav ? ' active' : ''}" data-fav-id="${h.id}" title="${isFav ? 'Remove from favorites' : 'Add to favorites'}" style="position:absolute;top:12px;right:12px;background:rgba(255,255,255,.92)"><i class="fa${isFav ? 's' : 'r'} fa-heart" style="color:${isFav ? '#FC4E67' : '#64748b'}"></i></button>` : ''}
          </div>
          <div class="hotel-body">
            <div class="hotel-head">
              <div>
                <h3 class="hotel-title">${h.name}</h3>
                <p class="hotel-loc"><i class="fa-solid fa-location-dot"></i> ${h.destination} â€¢ ${h.stars} â˜…</p>
              </div>
              <span class="hotel-price">$${h.price}<span class="night">/night</span></span>
            </div>
            <p class="hotel-desc">${h.short}</p>
            <div class="hotel-amenities">
              ${(h.amenities || []).slice(0, 4).map(a => `<span class="chip-sm">${StacklyData.amenityLabels[a] || a}</span>`).join('')}
              ${(h.amenities || []).length > 4 ? `<span class="chip-sm">+${h.amenities.length - 4}</span>` : ''}
            </div>
            <div class="hotel-actions">
              <button class="btn btn-ghost" data-view-details data-hotel-id="${h.id}">View Details</button>
              <a class="btn btn-primary" href="dashboard/reservations.html?hotel=${encodeURIComponent(h.id)}">Book Now</a>
            </div>
          </div>`;
        grid.appendChild(el);
      });
      grid.querySelectorAll('[data-fav-id]').forEach(b => {
        b.addEventListener('click', () => {
          const u = StacklyStorage.getCurrentUser();
          if (!u) { V().toast('Please log in to save favorites.', 'warning'); return; }
          const id = b.dataset.favId;
          const list = StacklyStorage.toggleFavorite(u.email, id);
          const nowFav = list.includes(id);
          b.innerHTML = `<i class="fa${nowFav ? 's' : 'r'} fa-heart" style="color:${nowFav ? '#FC4E67' : '#64748b'}"></i>`;
          V().toast(nowFav ? 'Added to favorites â™¥' : 'Removed from favorites', 'success');
        });
      });
      bindViewDetails();
    }

    [search, price, rating, type, destFilter, sort].forEach(el => {
      if (el) el.addEventListener('input', render);
      if (el) el.addEventListener('change', render);
    });
    render();
  }

  function bindDestinationFilters() {
    const grid = document.getElementById('dest-grid');
    const search = document.getElementById('dest-search');
    const region = document.getElementById('region-filter');
    const budget = document.getElementById('budget-filter');
    const type = document.getElementById('type-filter');
    if (!grid) return;

    function render() {
      const term = (search && search.value || '').toLowerCase();
      const r = region ? region.value : 'all';
      const b = budget ? budget.value : 'all';
      const t = type ? type.value : 'all';

      let list = StacklyData.destinations.slice();
      if (r !== 'all') list = list.filter(d => d.region === r);
      if (b !== 'all') list = list.filter(d => d.budget === b);
      if (t !== 'all') list = list.filter(d => d.type === t);
      if (term) list = list.filter(d => d.name.toLowerCase().includes(term) || d.country.toLowerCase().includes(term));

      grid.innerHTML = '';
      if (!list.length) { grid.innerHTML = '<p style="color:#64748b">No destinations match your filters.</p>'; return; }

      list.forEach(d => {
        const el = document.createElement('article');
        el.className = 'dest-card';
        el.innerHTML = `
          <div class="dest-img-wrap">
            <img src="${d.image}" alt="${d.name}" loading="lazy" onerror="this.onerror=null;this.src='assets/images/placeholder.svg'">
          </div>
          <div class="dest-body">
            <div class="dest-head">
              <h3 class="dest-title">${d.name}, ${d.country}</h3>
              <span class="dest-rating"><i class="fa-solid fa-star"></i> ${d.rating}</span>
            </div>
            <p class="dest-desc">${d.description}</p>
            <div class="dest-highlights">
              ${(d.highlights || []).slice(0, 2).map(h => `<span class="chip-sm">${h}</span>`).join('')}
            </div>
            <div class="dest-actions">
              <button class="btn btn-ghost" data-dest-details data-id="${d.id}">View Details</button>
            </div>
          </div>`;
        grid.appendChild(el);
      });
    }

    [search, region, budget, type].forEach(el => el && el.addEventListener('input', render));
    render();
  }

  return {
    bindNavbar, bindHeroSearch, bindDateConstraints, bindAccordions,
    bindNewsletter, bindViewDetails, bindHotelFilters, bindDestinationFilters,
    initSite() {
      bindNavbar();
      bindSharedFooter();
      bindHeroSearch();
      bindDateConstraints();
      bindAccordions();
      bindNewsletter();
      bindViewDetails();
      bindHotelFilters();
      bindDestinationFilters();
      if (typeof Chart !== 'undefined' && document.body.dataset.charts) {
        StacklyCharts.initAll();
      }
      V().bindModalClose();
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => StacklyApp.initSite());


