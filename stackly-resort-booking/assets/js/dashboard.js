/* ============================================================
   Stackly — dashboard.js
   Auth guard, user greeting, booking management, favorites,
   reservations form, reviews, profile, counts, sidebar.
   ============================================================ */

const StacklyDashboard = (() => {
  const V = () => StacklyValidate;
  const B = () => StacklyBooking;

  /* ---------- animated counters ---------- */

  function animateCount(el, target, duration, isMoney) {
    if (!el) return;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const end = Number(target) || 0;
    if (reduce) { el.textContent = isMoney ? '$' + end.toLocaleString() : end; return; }
    const start = 0;
    const t0 = performance.now();
    function tick(now) {
      const p = Math.min(1, (now - t0) / (duration || 900));
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(start + (end - start) * eased);
      el.textContent = isMoney ? '$' + val.toLocaleString() : val;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- inject shared dashboard shell ---------- */

  const SHELL_NAV = [
    { href: 'overview.html', icon: 'fa-gauge-high', label: 'Overview Dashboard' },
    { href: 'bookings.html', icon: 'fa-calendar-check', label: 'My Bookings' },
    { href: 'destinations.html', icon: 'fa-map-location-dot', label: 'Explore Destinations' },
    { href: 'favorites.html', icon: 'fa-heart', label: 'Favorite Hotels' },
    { href: 'reservations.html', icon: 'fa-book-open', label: 'Booking & Reservations' },
    { href: 'payments.html', icon: 'fa-credit-card', label: 'Payments & Invoices' },
    { href: 'reviews.html', icon: 'fa-star', label: 'Reviews & Feedback' },
    { href: 'profile.html', icon: 'fa-user-gear', label: 'Profile & Settings' }
  ];

  function renderShell() {
    const sidebar = document.getElementById('sidebar');
    const header = document.getElementById('dash-header');
    const cur = location.pathname.split('/').pop();

    if (sidebar) {
      sidebar.innerHTML = `
        <div class="sidebar-brand">
          <a href="../index.html" class="dashboard-brand-link" aria-label="Stackly home"><img class="dashboard-brand-logo" src="../../images/Stackly_logo_clean.png" alt="Stackly"></a>
          <button class="sidebar-close" id="sidebar-close" type="button" aria-label="Close dashboard menu"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="sidebar-user">
          <div class="avatar"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=70" alt="User avatar" data-sidebar-avatar></div>
          <div style="min-width:0">
            <h4 data-user-name>Guest</h4>
            <p data-user-email>guest@example.com</p>
          </div>
        </div>
        <nav class="sidebar-nav" aria-label="Dashboard navigation">
          ${SHELL_NAV.map(n => `<a class="nav-link${n.href === cur ? ' active' : ''}" href="${n.href}"${n.href === cur ? ' aria-current="page"' : ''}><i class="fa-solid ${n.icon}"></i> ${n.label}</a>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" data-logout type="button"><i class="fa-solid fa-right-from-bracket"></i> Logout</button>
        </div>`;
    }

    if (header) {
      const title = SHELL_NAV.find(n => n.href === cur);
      header.innerHTML = `
        <button id="sidebar-toggle" type="button" aria-label="Toggle sidebar"><i class="fa-solid fa-bars"></i></button>
        <div style="flex:1;min-width:0">
          <h1>${title ? title.label : 'Dashboard'}</h1>
          <p class="muted">Welcome back, <strong data-user-name>Guest</strong>! <span data-user-email></span></p>
        </div>
        <div class="header-actions">
          <button class="icon-btn" type="button" title="Notifications" id="notif-btn"><i class="fa-solid fa-bell"></i></button>
          <div class="dropdown profile-dd">
            <button class="icon-btn dropdown-toggle" type="button" aria-label="Profile menu"><i class="fa-solid fa-user"></i></button>
            <div class="dropdown-menu" style="right:0;left:auto">
              <a href="profile.html"><i class="fa-solid fa-user-gear" style="width:20px"></i> Profile & Settings</a>
              <a href="bookings.html"><i class="fa-solid fa-calendar-check" style="width:20px"></i> My Bookings</a>
              <a href="#" data-logout><i class="fa-solid fa-right-from-bracket" style="width:20px"></i> Logout</a>
            </div>
          </div>
        </div>`;
      const notif = header.querySelector('#notif-btn');
      if (notif) notif.addEventListener('click', () => {
        const user = StacklyStorage.getCurrentUser();
        const up = user ? StacklyStorage.getBookingsForUser(user.email).filter(b => b.status === 'upcoming').length : 0;
        V().toast(up ? `You have ${up} upcoming stay${up > 1 ? 's' : ''}!` : 'No new notifications right now.', 'info');
      });
    }
  }

  /* ---------- user display ---------- */

  function displayUser() {
    const user = StacklyStorage.getCurrentUser();
    if (!user) return;
    const name = user.fullName || (user.email ? user.email.split('@')[0] : 'Guest');
    document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = name);
    document.querySelectorAll('[data-user-email]').forEach(el => el.textContent = user.email);
    document.querySelectorAll('[data-sidebar-avatar]').forEach(img => {
      img.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=70';
      img.alt = name;
    });
  }

  /* ---------- sidebar + logout ---------- */

  function bindSidebar() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const close = document.getElementById('sidebar-close');
    const setSidebarState = (open) => {
      sidebar?.classList.toggle('open', open);
      document.body.classList.toggle('sidebar-open', open);
    };
    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        setSidebarState(!sidebar.classList.contains('open'));
      });
    }
    if (close && sidebar) {
      close.addEventListener('click', () => setSidebarState(false));
    }
    // profile dropdown toggle
    document.querySelectorAll('.dropdown-toggle').forEach(t => {
      t.addEventListener('click', (e) => {
        e.preventDefault();
        const menu = t.nextElementSibling;
        if (menu && menu.classList.contains('dropdown-menu')) {
          const willShow = !menu.classList.contains('show');
          document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
          menu.classList.toggle('show', willShow);
        }
      });
    });
    // close dropdowns on outside click / escape
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.dropdown-menu.show').forEach(m => m.classList.remove('show'));
        setSidebarState(false);
      }
    });
    document.querySelectorAll('[data-logout]').forEach(b => {
      b.addEventListener('click', (e) => {
        e.preventDefault();
        V().openModal('logout-modal');
      });
    });
    const logoutBtn = document.getElementById('logout-confirm');
    if (logoutBtn) logoutBtn.addEventListener('click', () => StacklyAuth.doLogout());
    const logoutCancel = document.querySelector('[data-close-modal="logout-modal"]');
    if (logoutCancel && !logoutCancel.dataset.logoutCancelBound) {
      logoutCancel.dataset.logoutCancelBound = 'true';
      logoutCancel.addEventListener('click', e => {
        e.preventDefault();
        V().closeModal('logout-modal');
      });
    }
  }

  /* ---------- overview counts ---------- */

  function renderOverview() {
    const user = StacklyStorage.getCurrentUser();
    const all = StacklyStorage.getBookings();
    const mine = user ? StacklyStorage.getBookingsForUser(user.email) : all;

    function count(list, st) { return list.filter(b => b.status === st).length; }
    function sum(list, st) {
      return Math.round(list.filter(b => !st || b.status === st).reduce((s, b) => s + Number(b.total || 0), 0));
    }

    const total = mine.length;
    const upcoming = count(mine, 'upcoming');
    const completed = count(mine, 'completed');
    const cancelled = count(mine, 'cancelled');
    const spending = sum(mine);

    const stat = (k) => document.querySelector(`[data-stat="${k}"]`);
    animateCount(stat('total'), total, 900);
    animateCount(stat('upcoming'), upcoming, 900);
    animateCount(stat('completed'), completed, 900);
    animateCount(stat('cancelled'), cancelled, 900);
    animateCount(stat('spending'), spending, 1000, true);

    // recent bookings
    const tbody = document.getElementById('recent-bookings');
    if (tbody) {
      tbody.innerHTML = '';
      const list = mine.slice().sort((a, b) => new Date(b.createdAt || b.checkIn) - new Date(a.createdAt || a.checkIn)).slice(0, 6);
      if (!list.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No bookings yet. Visit "Booking & Reservations" to create one.</td></tr>';
      } else {
        list.forEach(b => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td data-label="Reference"><strong>${b.reference}</strong></td>
            <td data-label="Hotel">${b.hotelName}</td>
            <td data-label="Destination">${b.destination}</td>
            <td>${b.checkIn} → ${b.checkOut}</td>
            <td data-label="Total">${B().formatMoney(b.total)}</td>
            <td data-label="Status"><span class="status status-${b.status}">${b.status}</span></td>`;
          tr.querySelectorAll('td')[3].dataset.label = 'Dates';
          tbody.appendChild(tr);
        });
      }
    }

    // upcoming cards
    const wrap = document.getElementById('upcoming-cards');
    if (wrap) {
      wrap.innerHTML = '';
      const list = mine.filter(b => b.status === 'upcoming').sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn)).slice(0, 4);
      if (!list.length) {
        wrap.innerHTML = '<p style="color:#64748b">No upcoming stays at the moment.</p>';
        return;
      }
      list.forEach(b => {
        const card = document.createElement('div');
        card.className = 'booking-card';
        card.innerHTML = `
          <img src="${b.hotelImage}" alt="${b.hotelName}" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/placeholder.svg'">
          <div class="booking-info">
            <h4>${b.hotelName}</h4>
            <p class="loc"><i class="fa-solid fa-location-dot"></i> ${b.destination}</p>
            <p class="dates">${b.checkIn} → ${b.checkOut} • ${b.guests} guests</p>
            <span class="status status-upcoming">Upcoming</span>
          </div>`;
        wrap.appendChild(card);
      });
    }
  }

  /* ---------- my bookings table ---------- */

  function renderBookings() {
    const tbody = document.getElementById('bookings-table');
    if (!tbody) return;
    const user = StacklyStorage.getCurrentUser();
    const mine = user ? StacklyStorage.getBookingsForUser(user.email) : StacklyStorage.getBookings();
    const search = document.getElementById('booking-search');
    const filter = document.getElementById('booking-filter');
    const term = (search && search.value || '').toLowerCase();
    const st = filter ? filter.value : 'all';

    let list = mine.slice().sort((a, b) => new Date(b.createdAt || b.checkIn) - new Date(a.createdAt || a.checkIn));
    if (st !== 'all') list = list.filter(b => b.status === st);
    if (term) list = list.filter(b => b.reference.toLowerCase().includes(term) || b.hotelName.toLowerCase().includes(term) || b.destination.toLowerCase().includes(term));

    tbody.innerHTML = '';
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="empty-row">No bookings match your current filters.</td></tr>';
      return;
    }

    list.forEach(b => {
      const tr = document.createElement('tr');
      const canCancel = b.status === 'upcoming';
      tr.innerHTML = `
        <td data-label="Reference"><strong>${b.reference}</strong></td>
        <td data-label="Hotel"><div class="booking-table-hotel"><img src="${b.hotelImage}" alt="${b.hotelName}" onerror="this.onerror=null;this.src='../assets/images/placeholder.svg'"><div>${b.hotelName}</div></div></td>
        <td data-label="Destination">${b.destination}</td>
        <td data-label="Dates">${b.checkIn} &rarr; ${b.checkOut}</td>
        <td data-label="Guests / Rooms">${b.guests} / ${b.rooms}</td>
        <td data-label="Price">${B().formatMoney(b.total)}</td>
        <td data-label="Status"><span class="status status-${b.status}">${b.status}</span></td>
        <td data-label="Actions">
          <div class="action-row">
            <button class="icon-btn" data-action="view" data-id="${b.id}" title="View details"><i class="fa-solid fa-eye"></i></button>
            ${canCancel ? `<button class="icon-btn danger" data-action="cancel" data-id="${b.id}" title="Cancel booking"><i class="fa-solid fa-ban"></i></button>` : ''}
          </div>
        </td>`;
      tbody.appendChild(tr);
    });

    tbody.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const bookings = StacklyStorage.getBookings();
        const b = bookings.find(x => x.id === id);
        if (!b) return;
        if (action === 'view') {
          const modal = document.getElementById('booking-detail-modal');
          if (modal) {
            modal.querySelector('.bd-ref').textContent = b.reference;
            modal.querySelector('.bd-hotel').textContent = b.hotelName;
            modal.querySelector('.bd-dest').textContent = b.destination;
            modal.querySelector('.bd-dates').textContent = b.checkIn + ' → ' + b.checkOut;
            modal.querySelector('.bd-guests').textContent = b.guests + ' guests, ' + b.rooms + ' room(s)';
            modal.querySelector('.bd-room').textContent = b.roomType;
            modal.querySelector('.bd-total').textContent = B().formatMoney(b.total);
            modal.querySelector('.bd-status').textContent = b.status;
            modal.querySelector('.bd-img').src = b.hotelImage;
            V().openModal('booking-detail-modal');
          }
        }
        if (action === 'cancel' && b.status === 'upcoming') {
          const ok = await V().confirmDialog('Are you sure you want to cancel this booking?', 'Cancel booking');
          if (ok) {
            StacklyStorage.cancelBooking(id);
            V().toast('Booking cancelled successfully.', 'success');
            renderBookings();
            if (typeof renderOverview === 'function') renderOverview();
            if (typeof renderPayments === 'function') renderPayments();
            if (typeof StacklyCharts !== 'undefined' && document.getElementById('chartBooking')) setTimeout(() => location.reload(), 400);
          }
        }
      });
    });
  }

  /* ---------- favorites ---------- */

  function renderFavorites() {
    const grid = document.getElementById('fav-grid');
    if (!grid) return;
    const user = StacklyStorage.getCurrentUser();
    if (!user) return;
    const favs = StacklyStorage.getFavorites(user.email);
    const picker = document.getElementById('favorite-picker-grid');
    if (picker) {
      const available = StacklyData.hotels.filter(h => !favs.includes(h.id));
      picker.innerHTML = available.length ? available.map(h => `
        <div class="hotel-card">
          <div class="hotel-img-wrap"><img src="${h.image}" alt="${h.name}" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/placeholder.svg'"></div>
          <div class="hotel-body">
            <h3 class="hotel-title">${h.name}</h3>
            <p class="hotel-loc"><i class="fa-solid fa-location-dot"></i> ${h.destination}</p>
            <button type="button" class="btn btn-primary" data-add-fav data-id="${h.id}">Add to Favorites</button>
          </div>
        </div>`).join('') : '<p class="muted">All hotels are already in your favorites.</p>';
      picker.querySelectorAll('[data-add-fav]').forEach(b => b.addEventListener('click', () => {
        StacklyStorage.toggleFavorite(user.email, b.dataset.id);
        V().toast('Added to favorites.', 'success');
        renderFavorites();
      }));
    }
    const addBtn = document.getElementById('add-favorite-btn');
    if (addBtn && !addBtn.dataset.bound) {
      addBtn.dataset.bound = 'true';
      addBtn.addEventListener('click', () => V().openModal('add-favorite-modal'));
    }
    grid.innerHTML = '';
    if (!favs.length) {
      grid.innerHTML = '<p style="color:#64748b">You have no saved hotels yet. Browse Hotels & Resorts to add favourites.</p>';
      return;
    }
    favs.forEach(id => {
      const h = StacklyData.hotelById(id);
      if (!h) return;
      const el = document.createElement('div');
      el.className = 'hotel-card';
      el.innerHTML = `
        <div class="hotel-img-wrap">
          <img src="${h.image}" alt="${h.name}" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/placeholder.svg'">
        </div>
        <div class="hotel-body">
          <div class="hotel-head">
            <div>
              <h3 class="hotel-title">${h.name}</h3>
              <p class="hotel-loc"><i class="fa-solid fa-location-dot"></i> ${h.destination}</p>
            </div>
            <span class="hotel-price">$${h.price}<span class="night">/night</span></span>
          </div>
          <div class="hotel-actions">
            <button class="btn btn-outline" data-remove-fav data-id="${h.id}">Remove from Favorites</button>
            <a class="btn btn-primary" href="reservations.html?hotel=${encodeURIComponent(h.id)}">Book Now</a>
          </div>
        </div>`;
      grid.appendChild(el);
    });
    grid.querySelectorAll('[data-remove-fav]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.dataset.id;
        StacklyStorage.toggleFavorite(user.email, id);
        V().toast('Removed from favorites.', 'success');
        renderFavorites();
      });
    });

  }

  /* ---------- destinations explore ---------- */

  function renderExploreDest() {
    const grid = document.getElementById('explore-dest-grid');
    if (!grid) return;
    grid.innerHTML = '';
    StacklyData.destinations.forEach(d => {
      const el = document.createElement('article');
      el.className = 'dest-card';
      el.dataset.region = d.region;
      el.dataset.budget = d.budget;
      el.innerHTML = `
        <div class="dest-img-wrap"><img src="${d.image}" alt="${d.name}" loading="lazy" onerror="this.onerror=null;this.src='../assets/images/placeholder.svg'"></div>
        <div class="dest-body">
          <div class="dest-head">
            <h3 class="dest-title">${d.name}, ${d.country}</h3>
            <span class="dest-rating"><i class="fa-solid fa-star"></i> ${d.rating}</span>
          </div>
          <p class="dest-desc">${d.description}</p>
        </div>`;
      grid.appendChild(el);
    });
  }

  /* ---------- reservations form ---------- */

  function bindReservations() {
    const form = document.getElementById('reservation-form');
    if (!form) return;
    const user = StacklyStorage.getCurrentUser();
    if (user) {
      if (form.guestName) form.guestName.value = user.fullName || '';
      if (form.guestEmail) form.guestEmail.value = user.email || '';
    }
    const destSel = form.querySelector('#destination');
    const hotelSel = form.querySelector('#hotel');
    const roomSel = form.querySelector('#roomType');
    const summaryEl = document.getElementById('booking-summary');
    const offerInput = form.offerCode;
    const allRoomTypes = [...new Map(StacklyData.hotels.flatMap(h => h.rooms || []).map(room => [room.type, room])).values()];

    // fill destinations
    StacklyData.destinations.forEach(d => {
      const o = new Option(d.name, d.name);
      destSel.appendChild(o);
    });

    const params = new URLSearchParams(location.search);
    if (params.get('dest')) {
      const requestedDest = params.get('dest');
      const destination = StacklyData.destinations.find(d => d.name.toLowerCase() === requestedDest.toLowerCase());
      if (destination) {
        destSel.value = destination.name;
        populateHotels();
      }
    }
    if (params.get('hotel')) {
      const h = StacklyData.hotelById(params.get('hotel'));
      if (h) {
        // ensure dest selected
        destSel.value = h.destination;
        populateHotels();
        hotelSel.value = h.id;
        populateRooms();
      }
    }

    function populateHotels() {
      const v = destSel.value;
      hotelSel.innerHTML = '<option value="">Select Hotel</option>';
      const destination = StacklyData.destinations.find(x => x.name === v);
      StacklyData.hotelsByDestination(destination ? destination.id : '').forEach(h => {
        const o = new Option(h.name, h.id);
        o.dataset.hotel = JSON.stringify(h);
        hotelSel.appendChild(o);
      });
      populateRooms();
      updateSummary();
    }

    function populateRooms() {
      const opt = hotelSel.options[hotelSel.selectedIndex];
      let hotel = opt && opt.dataset.hotel ? JSON.parse(opt.dataset.hotel) : null;
      if (!hotel && hotelSel.value) hotel = StacklyData.hotelById(hotelSel.value);
      roomSel.innerHTML = '<option value="">Select Room Type</option>';
      const rooms = hotel && hotel.rooms ? hotel.rooms : allRoomTypes;
      rooms.forEach(r => {
          const o = new Option(`${r.type} — $${r.price}/night (up to ${r.capacity} guests)`, r.type);
          roomSel.appendChild(o);
      });
      updateSummary();
    }

    populateRooms();

    function updateSummary() {
      const opt = hotelSel.options[hotelSel.selectedIndex];
      let hotel = opt && opt.dataset.hotel ? JSON.parse(opt.dataset.hotel) : null;
      if (!hotel && hotelSel.value) hotel = StacklyData.hotelById(hotelSel.value);
      if (!hotel) { summaryEl.innerHTML = '<p style="color:#64748b">Select destination, hotel and dates to see pricing.</p>'; return; }
      const ci = form.checkIn.value;
      const co = form.checkOut.value;
      const guests = form.guests.value;
      const rooms = form.rooms.value;
      const roomType = form.roomType.value;
      if (!ci || !co || !roomType) { summaryEl.innerHTML = '<p style="color:#64748b">Complete dates and room selection to see the breakdown.</p>'; return; }
      let discountPct = 0;
      const code = (offerInput.value || '').trim().toUpperCase();
      if (code) {
        const offer = StacklyData.offers.find(o => o.code === code);
        if (offer) {
          discountPct = offer.discount;
          summaryEl.dataset.offerApplied = offer.code;
        } else {
          summaryEl.dataset.offerApplied = '';
        }
      } else { summaryEl.dataset.offerApplied = ''; }
      const pricing = B().calculatePrice({ hotel, roomType, checkIn: ci, checkOut: co, guests, rooms, discountPct });
      if (!pricing) { summaryEl.innerHTML = '<p style="color:#64748b">Check-out must be after check-in.</p>'; return; }
      summaryEl.innerHTML = `
        <div class="summary-row"><span>Nights</span><strong>${pricing.nights}</strong></div>
        <div class="summary-row"><span>Rate (${roomType})</span><strong>${B().formatMoney(pricing.nightly)} / night</strong></div>
        <div class="summary-row"><span>Rooms</span><strong>${pricing.roomCount}</strong></div>
        <div class="summary-row"><span>Subtotal</span><strong>${B().formatMoney(pricing.subtotal)}</strong></div>
        ${pricing.discount > 0 ? `<div class="summary-row"><span>Discount (${pricing.discountPct}%)</span><strong>− ${B().formatMoney(pricing.discount)}</strong></div>` : ''}
        <div class="summary-row"><span>Taxes & Fees (12%)</span><strong>${B().formatMoney(pricing.taxes)}</strong></div>
        <div class="summary-total"><span>Total</span><strong>${B().formatMoney(pricing.total)}</strong></div>
        <p style="color:#64748b;font-size:.85em;margin-top:.5rem">* This is a demo booking. Actual availability and payment will require backend integration.</p>`;
    }

    destSel.addEventListener('change', populateHotels);
    hotelSel.addEventListener('change', populateRooms);
    [form.checkIn, form.checkOut, form.guests, form.rooms, form.roomType].forEach(el => el.addEventListener('change', updateSummary));
    [form.checkIn, form.checkOut, form.guests, form.rooms].forEach(el => el.addEventListener('input', updateSummary));
    offerInput.addEventListener('input', updateSummary);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!B().validateReservation(form)) { V().toast('Please fix the errors in the form.', 'error'); return; }
      const btn = form.querySelector('button[type="submit"]');
      const opt = hotelSel.options[hotelSel.selectedIndex];
      let hotel = opt && opt.dataset.hotel ? JSON.parse(opt.dataset.hotel) : StacklyData.hotelById(hotelSel.value);
      const ci = form.checkIn.value;
      const co = form.checkOut.value;
      const roomType = form.roomType.value;
      const guests = form.guests.value;
      const rooms = form.rooms.value;
      const code = (offerInput.value || '').trim().toUpperCase();
      let discountPct = 0;
      if (code) { const offer = StacklyData.offers.find(o => o.code === code); if (offer) discountPct = offer.discount; }
      const pricing = B().calculatePrice({ hotel, roomType, checkIn: ci, checkOut: co, guests, rooms, discountPct });
      if (!pricing) { V().toast('Invalid dates selected.', 'error'); return; }
      V().setLoading(btn, true, 'Confirming booking…');
      setTimeout(() => {
        const bk = B().createBooking({
          hotel, checkIn: ci, checkOut: co, guests, rooms, roomType, pricing,
          guestName: form.guestName.value, email: form.guestEmail.value,
          specialRequests: form.specialRequests.value, offerCode: code
        });
        V().setLoading(btn, false);
        form.reset();
        // show modal
        const m = document.getElementById('success-modal');
        if (m) {
          m.querySelector('.sm-ref').textContent = bk.reference;
          m.querySelector('.sm-hotel').textContent = bk.hotelName;
          m.querySelector('.sm-dates').textContent = bk.checkIn + ' → ' + bk.checkOut;
          m.querySelector('.sm-total').textContent = B().formatMoney(bk.total);
          V().openModal('success-modal');
        } else {
          V().toast(`Booking confirmed! Ref: ${bk.reference}`, 'success');
        }
        // update views
        renderBookings();
        renderOverview();
      }, 1000);
    });

    // bind success modal actions
    const dlConf = document.getElementById('dl-confirmation');
    const dlInv = document.getElementById('dl-invoice');
    if (dlConf) dlConf.addEventListener('click', () => {
      // get last booking? store last ref? simple: no global; user can download from My Bookings
      V().toast('Download your confirmation from "My Bookings" anytime.', 'info');
    });
    if (dlInv) dlInv.addEventListener('click', () => {
      V().toast('Download your invoice from "My Bookings" anytime.', 'info');
    });
  }

  /* ---------- payments & invoices ---------- */

  function renderPayments() {
    const tbody = document.getElementById('payments-table');
    if (!tbody) return;
    const user = StacklyStorage.getCurrentUser();
    const mine = user ? StacklyStorage.getBookingsForUser(user.email) : StacklyStorage.getBookings();
    const ownPaid = mine.filter(b => (b.paymentStatus || 'paid') === 'paid');
    const paid = ownPaid.length ? ownPaid : StacklyStorage.getBookings().filter(b => (b.paymentStatus || 'paid') === 'paid');
    const history = document.getElementById('payment-history-list');
    if (history) {
      history.innerHTML = paid.length ? paid.slice().sort((a, b) => new Date(b.createdAt || b.checkIn) - new Date(a.createdAt || a.checkIn)).slice(0, 5).map(b => `
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px;background:#f8fafc;border-radius:12px;flex-wrap:wrap">
          <div><strong>${b.hotelName}</strong><p class="muted" style="margin:3px 0 0">${b.reference} · ${b.destination}</p></div>
          <div><strong>${B().formatMoney(b.total)}</strong></div>
        </div>`).join('') : '<p class="muted">No payment history yet. Complete a reservation to see payments here.</p>';
    }
    tbody.innerHTML = '';
    if (!paid.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-row">No payment history yet.</td></tr>';
      return;
    }
    paid.slice().sort((a, b) => new Date(b.createdAt || b.checkIn) - new Date(a.createdAt || a.checkIn)).forEach(b => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${b.reference}</td>
        <td>${b.hotelName}</td>
        <td>${b.checkIn} → ${b.checkOut}</td>
        <td>${B().formatMoney(b.total)}</td>
        <td><span class="status status-completed">Paid (Demo)</span></td>
        <td>${b.paymentMethod || 'Visa •••• 4242 (Demo)'}</td>`;
      tbody.appendChild(tr);
    });
    // spending summary
    const total = Math.round(paid.reduce((s, b) => s + Number(b.total || 0), 0));
    const totalEl = document.querySelector('[data-pay-total]');
    if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
  }

  /* ---------- reviews ---------- */

  function bindReviews() {
    const form = document.getElementById('review-form');
    if (!form) return;
    const hotelSel = form.hotel;
    StacklyData.hotels.forEach(h => hotelSel.appendChild(new Option(h.name, h.id)));
    const user = StacklyStorage.getCurrentUser();
    if (user && form.name) form.name.value = user.fullName || '';
    if (user && form.email) form.email.value = user.email || '';

    const stars = form.querySelectorAll('.star');
    const ratingInput = document.getElementById('rating');
    let r = 5;
    stars.forEach(s => {
      s.addEventListener('click', () => {
        r = Number(s.dataset.value);
        ratingInput.value = r;
        stars.forEach(x => x.classList.toggle('active', Number(x.dataset.value) <= r));
      });
      s.addEventListener('mouseenter', () => {
        const v = Number(s.dataset.value);
        stars.forEach(x => x.classList.toggle('hover', Number(x.dataset.value) <= v));
      });
      s.addEventListener('mouseleave', () => stars.forEach(x => x.classList.remove('hover')));
    });

    form.addEventListener('submit', e => {
      e.preventDefault();
      V().clearAllErrors(form);
      let ok = true;
      if (!hotelSel.value) { V().setFieldError(hotelSel, 'Select a hotel.'); ok = false; }
      if (!form.comment.value.trim()) { V().setFieldError(form.comment, 'Review comment is required.'); ok = false; }
      if (!ok) { V().toast('Please complete all fields.', 'error'); return; }
      const h = StacklyData.hotelById(hotelSel.value);
      StacklyStorage.addReview({
        hotelId: h.id, hotelName: h.name,
        userName: form.name.value || 'Guest',
        userEmail: form.email.value || 'guest@demo.com',
        rating: r, comment: form.comment.value.trim()
      });
      form.reset();
      stars.forEach(x => x.classList.toggle('active', Number(x.dataset.value) <= 5));
      ratingInput.value = 5;
      r = 5;
      V().toast('Thank you for your review!', 'success');
      renderReviewsList();
    });
  }

  function renderReviewsList() {
    const listEl = document.getElementById('reviews-list');
    if (!listEl) return;
    const reviews = StacklyStorage.getReviews().slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    listEl.innerHTML = '';
    if (!reviews.length) {
      listEl.innerHTML = '<p style="color:#64748b">No reviews have been submitted yet.</p>';
      return;
    }
    reviews.forEach(r => {
      const div = document.createElement('div');
      div.className = 'review-card';
      const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
      div.innerHTML = `
        <div class="review-head">
          <div class="avatar sm"><img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=160&q=70" alt="${r.userName}"></div>
          <div>
            <h4>${r.userName}</h4>
            <p class="muted">${new Date(r.createdAt).toLocaleDateString()} • ${r.hotelName}</p>
          </div>
          <span class="review-rating">${stars}</span>
        </div>
        <p class="review-text">${StacklyValidate.escapeHtml(r.comment)}</p>`;
      listEl.appendChild(div);
    });
  }

  /* ---------- profile ---------- */

  function bindProfile() {
    const form = document.getElementById('profile-form');
    if (!form) return;
    const user = StacklyStorage.getCurrentUser();
    if (user) {
      form.fullName.value = user.fullName || '';
      form.email.value = user.email || '';
      form.phone.value = user.phone || '';
      form.preferredDestination.value = user.preferredDestination || '';
    }
    form.addEventListener('submit', e => {
      e.preventDefault();
      V().clearAllErrors(form);
      let ok = true;
      if (V().isEmpty(form.fullName.value)) { V().setFieldError(form.fullName, 'Name required'); ok = false; }
      if (!V().isEmail(form.email.value)) { V().setFieldError(form.email, 'Invalid email'); ok = false; }
      if (!V().isPhone(form.phone.value)) { V().setFieldError(form.phone, 'Invalid phone'); ok = false; }
      if (!ok) { V().toast('Please correct the errors.', 'error'); return; }
      const oldEmail = (user && user.email || '').toLowerCase();
      const newEmail = form.email.value.trim().toLowerCase();
      // prevent duplicate email collisions
      if (newEmail !== oldEmail && StacklyStorage.findUserByEmail(newEmail)) {
        V().setFieldError(form.email, 'That email is already registered.');
        V().toast('Email already in use.', 'error');
        return;
      }
      StacklyStorage.updateUser(oldEmail, {
        fullName: form.fullName.value.trim(),
        email: newEmail,
        phone: form.phone.value.trim(),
        preferredDestination: form.preferredDestination.value
      });
      // keep the session pointing at the (possibly updated) email
      if (newEmail !== oldEmail) StacklyStorage.setSession(newEmail);
      V().toast('Profile updated successfully.', 'success');
      setTimeout(() => location.reload(), 700);
    });

    // password
    const pw = document.getElementById('password-form');
    if (pw) {
      V().bindPasswordToggle(pw);
      pw.addEventListener('submit', e => {
        e.preventDefault();
        V().clearAllErrors(pw);
        let ok = true;
        const c = pw.currentPassword.value;
        const n = pw.newPassword.value;
        const cn = pw.confirmPassword.value;
        if (V().isEmpty(c)) { V().setFieldError(pw.currentPassword, 'Current password required'); ok = false; }
        if (!V().isStrongPassword(n)) { V().setFieldError(pw.newPassword, 'Weak password'); ok = false; }
        if (n !== cn) { V().setFieldError(pw.confirmPassword, 'Passwords do not match'); ok = false; }
        if (user && user.password !== c) { V().setFieldError(pw.currentPassword, 'Incorrect current password'); ok = false; }
        if (!ok) { V().toast('Please fix password fields.', 'error'); return; }
        const email = user.email.toLowerCase();
        StacklyStorage.updateUser(email, { password: n });
        pw.reset();
        V().openModal('password-success-modal');
      });
    }

    // prefs
    const prefs = document.getElementById('prefs-form');
    if (prefs && user) {
      const p = StacklyStorage.getPreferences(user.email);
      if (prefs.notify) prefs.notify.checked = p.notifications !== false;
      if (prefs.theme) prefs.theme.value = p.theme || 'light';
      prefs.addEventListener('submit', e => {
        e.preventDefault();
        StacklyStorage.setPreferences(user.email, {
          notifications: prefs.notify.checked,
          theme: prefs.theme.value
        });
        // apply theme live
        let t = prefs.theme.value;
        if (t === 'system') t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.body.classList.toggle('theme-dark', t === 'dark');
        V().toast('Preferences saved.', 'success');
      });
    }
  }

  return {
    displayUser, bindSidebar, renderOverview, renderBookings,
    renderFavorites, renderExploreDest, bindReservations,
    renderPayments, bindReviews, renderReviewsList, bindProfile,
    initDashboard() {
      if (!StacklyAuth.requireAuth()) return;
      renderShell();
      displayUser();
      bindSidebar();
      renderOverview();
      renderBookings();
      renderFavorites();
      renderExploreDest();
      bindReservations();
      renderPayments();
      bindReviews();
      renderReviewsList();
      bindProfile();
      V().bindModalClose();
      if (typeof Chart !== 'undefined' && document.body.dataset.charts) {
        StacklyCharts.initAll();
      }
      // close sidebar when clicking a link on mobile
      document.getElementById('sidebar')?.querySelectorAll('.nav-link').forEach(a => {
        a.addEventListener('click', () => {
          document.getElementById('sidebar').classList.remove('open');
          document.body.classList.remove('sidebar-open');
        });
      });
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  if (body.dataset.page === 'dashboard' || body.dataset.page === 'dashboard-sub') {
    StacklyDashboard.initDashboard();
  }
});
