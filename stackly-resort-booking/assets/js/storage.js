/* ============================================================
   Stackly — storage.js
   Centralised LocalStorage helpers + seed/demo data.
   Every read is wrapped in try/catch so corrupted or missing
   data degrades gracefully to an empty structure.
   ============================================================ */

const StacklyStorage = (() => {
  const KEYS = {
    USERS: 'stackly_users',
    SESSION: 'stackly_session',
    BOOKINGS: 'stackly_bookings',
    FAVORITES: 'stackly_favorites',
    REVIEWS: 'stackly_reviews',
    CONTACT: 'stackly_contacts',
    NEWSLETTER: 'stackly_newsletter',
    PREFERENCES: 'stackly_preferences'
  };

  /* ---------- low-level helpers ---------- */

  function get(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('StacklyStorage: corrupt data for', key, e);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('StacklyStorage: write failed for', key, e);
      return false;
    }
  }

  function remove(key) {
    try { localStorage.removeItem(key); } catch (e) { /* noop */ }
  }

  /* ---------- users ---------- */

  function getUsers() { return get(KEYS.USERS, []); }

  function saveUsers(list) { return set(KEYS.USERS, list); }

  function findUserByEmail(email) {
    if (!email) return null;
    const needle = email.toLowerCase().trim();
    return getUsers().find(u => u.email && u.email.toLowerCase() === needle) || null;
  }

  function addUser(user) {
    const users = getUsers();
    if (findUserByEmail(user.email)) return { ok: false, reason: 'duplicate' };
    user.id = 'U' + Date.now() + Math.random().toString(36).slice(2, 7);
    user.createdAt = new Date().toISOString();
    users.push(user);
    saveUsers(users);
    return { ok: true, user };
  }

  function updateUser(email, patch) {
    const users = getUsers();
    const idx = users.findIndex(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) return false;
    users[idx] = Object.assign({}, users[idx], patch);
    users[idx].updatedAt = new Date().toISOString();
    saveUsers(users);
    return true;
  }

  /* ---------- session ---------- */

  function getSession() { return get(KEYS.SESSION, null); }

  function setSession(email) {
    return set(KEYS.SESSION, { email, loggedInAt: new Date().toISOString() });
  }

  function clearSession() { remove(KEYS.SESSION); }

  function getCurrentUser() {
    const s = getSession();
    if (!s || !s.email) return null;
    return findUserByEmail(s.email);
  }

  function isLoggedIn() { return !!getCurrentUser(); }

  /* ---------- bookings ---------- */

  function getBookings() { return get(KEYS.BOOKINGS, []); }

  function saveBookings(list) { return set(KEYS.BOOKINGS, list); }

  function getBookingsForUser(email) {
    if (!email) return [];
    return getBookings().filter(b => b.userEmail && b.userEmail.toLowerCase() === email.toLowerCase());
  }

  function addBooking(booking) {
    const list = getBookings();
    booking.id = booking.id || ('BK' + Date.now() + Math.random().toString(36).slice(2, 5));
    booking.reference = booking.reference || generateReference();
    booking.createdAt = new Date().toISOString();
    list.push(booking);
    saveBookings(list);
    return booking;
  }

  function updateBooking(id, patch) {
    const list = getBookings();
    const idx = list.findIndex(b => b.id === id);
    if (idx === -1) return false;
    list[idx] = Object.assign({}, list[idx], patch);
    saveBookings(list);
    return true;
  }

  function cancelBooking(id) {
    return updateBooking(id, { status: 'cancelled', cancelledAt: new Date().toISOString() });
  }

  function generateReference() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let ref = 'STK-';
    for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
    return ref;
  }

  /* ---------- favourites ---------- */

  function getFavorites(email) {
    const all = get(KEYS.FAVORITES, {});
    if (!email) return [];
    return all[email.toLowerCase()] || [];
  }

  function toggleFavorite(email, hotelId) {
    if (!email || !hotelId) return [];
    const all = get(KEYS.FAVORITES, {});
    const key = email.toLowerCase();
    let list = all[key] || [];
    if (list.includes(hotelId)) {
      list = list.filter(h => h !== hotelId);
    } else {
      list.push(hotelId);
    }
    all[key] = list;
    set(KEYS.FAVORITES, all);
    return list;
  }

  function isFavorite(email, hotelId) {
    return getFavorites(email).includes(hotelId);
  }

  /* ---------- reviews ---------- */

  function getReviews() { return get(KEYS.REVIEWS, []); }

  function getReviewsForHotel(hotelId) {
    return getReviews().filter(r => r.hotelId === hotelId);
  }

  function getReviewsForUser(email) {
    if (!email) return [];
    return getReviews().filter(r => r.userEmail && r.userEmail.toLowerCase() === email.toLowerCase());
  }

  function addReview(review) {
    const list = getReviews();
    review.id = 'RV' + Date.now() + Math.random().toString(36).slice(2, 5);
    review.createdAt = new Date().toISOString();
    list.push(review);
    set(KEYS.REVIEWS, list);
    return review;
  }

  /* ---------- preferences ---------- */

  function getPreferences(email) {
    const all = get(KEYS.PREFERENCES, {});
    if (!email) return {};
    return all[email.toLowerCase()] || { notifications: true, theme: 'light' };
  }

  function setPreferences(email, prefs) {
    if (!email) return;
    const all = get(KEYS.PREFERENCES, {});
    all[email.toLowerCase()] = prefs;
    set(KEYS.PREFERENCES, all);
  }

  /* ---------- newsletter / contact ---------- */

  function addNewsletter(email) {
    const list = get(KEYS.NEWSLETTER, []);
    if (!list.includes(email)) list.push(email);
    set(KEYS.NEWSLETTER, list);
  }

  function addContact(entry) {
    const list = get(KEYS.CONTACT, []);
    entry.id = 'CT' + Date.now();
    entry.createdAt = new Date().toISOString();
    list.push(entry);
    set(KEYS.CONTACT, list);
    return entry;
  }

  /* ---------- seed demo data (first visit only) ---------- */

  function seedDemoBookings() {
    const KEY = 'stackly_seeded';
    if (get(KEY, false)) return;
    set(KEY, true);

    const demoEmail = 'demo@stackly.com';
    // create demo user if not present
    if (!findUserByEmail(demoEmail)) {
      addUser({
        fullName: 'Demo Guest',
        email: demoEmail,
        phone: '+1 555 010 2030',
        password: 'Demo@1234',
        isDemo: true
      });
    }

    const hotels = (typeof StacklyData !== 'undefined' && StacklyData.hotels) ? StacklyData.hotels : [];
    if (!hotels.length) return;

    const today = new Date();
    const dayMs = 86400000;

    function mk(daysFrom, nights, hotel, status, guests, rooms, roomType, total) {
      const ci = new Date(today.getTime() + daysFrom * dayMs);
      const co = new Date(ci.getTime() + nights * dayMs);
      return {
        id: 'BK' + (today.getTime() + Math.random() * 1e6 | 0),
        reference: generateReference(),
        userEmail: demoEmail,
        hotelId: hotel.id,
        hotelName: hotel.name,
        hotelImage: hotel.image,
        destination: hotel.destination,
        checkIn: ci.toISOString().slice(0, 10),
        checkOut: co.toISOString().slice(0, 10),
        guests: guests,
        rooms: rooms,
        roomType: roomType,
        total: total,
        status: status,
        paymentStatus: status === 'cancelled' ? 'refunded' : 'paid',
        paymentMethod: 'Visa •••• 4242 (Demo)',
        createdAt: new Date(today.getTime() - Math.random() * 30 * dayMs).toISOString(),
        specialRequests: ''
      };
    }

    const seeds = [
      mk(-90, 3, hotels[0], 'completed', 2, 1, 'Deluxe Suite', 960),
      mk(-60, 4, hotels[2], 'completed', 2, 1, 'Ocean Villa', 1560),
      mk(-30, 2, hotels[4], 'cancelled', 2, 1, 'Executive Room', 998),
      mk(-14, 5, hotels[3], 'completed', 4, 2, 'Family Room', 1420),
      mk(7, 3, hotels[1], 'upcoming', 2, 1, 'Overwater Bungalow', 2640),
      mk(21, 4, hotels[5], 'upcoming', 2, 1, 'Mountain Chalet', 2360),
      mk(45, 2, hotels[6], 'upcoming', 2, 1, 'Cave Suite', 1240),
      mk(120, 3, hotels[7], 'upcoming', 2, 1, 'Eiffel Suite', 1650),
      mk(-5, 1, hotels[0], 'upcoming', 1, 1, 'Deluxe Suite', 540)
    ];

    saveBookings(seeds);
  }

  function seedDemoReviews() {
    const KEY = 'stackly_seeded_reviews';
    if (get(KEY, false)) return;
    set(KEY, true);
    const hotels = (typeof StacklyData !== 'undefined' && StacklyData.hotels) ? StacklyData.hotels : [];
    if (!hotels.length) return;

    const names = [
      { name: 'Priya Sharma', email: 'priya@example.com' },
      { name: 'James Carter', email: 'james@example.com' },
      { name: 'Aiko Tanaka', email: 'aiko@example.com' },
      { name: 'Marco Rossi', email: 'marco@example.com' },
      { name: 'Sofia Alvarez', email: 'sofia@example.com' }
    ];

    const texts = [
      'Absolutely stunning property with world-class hospitality. The views from our room were breathtaking and the staff went above and beyond.',
      'Perfect getaway. Clean rooms, delicious food, and the pool area is gorgeous. Would definitely return.',
      'A magical experience from start to finish. Check-in was seamless and the suite exceeded all expectations.',
      'Great value for a luxury stay. The spa treatments were exceptional and the breakfast buffet is a must.',
      'Beautiful location, friendly staff, and incredibly comfortable beds. Our only wish is that we could stay longer!'
    ];

    const seeds = [];
    for (let h = 0; h < Math.min(6, hotels.length); h++) {
      const count = 2 + (h % 3);
      for (let i = 0; i < count; i++) {
        const person = names[(h + i) % names.length];
        seeds.push({
          id: 'RV' + h + i + Date.now(),
          hotelId: hotels[h].id,
          hotelName: hotels[h].name,
          userEmail: person.email,
          userName: person.name,
          rating: [5, 4, 5, 4, 3][(h + i) % 5],
          comment: texts[(h + i) % texts.length],
          createdAt: new Date(Date.now() - Math.random() * 60 * 86400000).toISOString()
        });
      }
    }
    set(KEYS.REVIEWS, seeds);
  }

  function seedAll() {
    try {
      if (typeof StacklyData !== 'undefined') {
        seedDemoBookings();
        seedDemoReviews();
      }
    } catch (e) {
      console.warn('Seed skipped:', e);
    }
  }

  /* ---------- public API ---------- */

  return {
    KEYS,
    get, set, remove,
    getUsers, saveUsers, findUserByEmail, addUser, updateUser,
    getSession, setSession, clearSession, getCurrentUser, isLoggedIn,
    getBookings, saveBookings, getBookingsForUser, addBooking, updateBooking, cancelBooking, generateReference,
    getFavorites, toggleFavorite, isFavorite,
    getReviews, getReviewsForHotel, getReviewsForUser, addReview,
    getPreferences, setPreferences,
    addNewsletter, addContact,
    seedAll
  };
})();

/* ---- shared demo dataset used across pages ---- */

const StacklyData = {
  destinations: [
    { id: 'goa', name: 'Goa', country: 'India', region: 'asia', type: 'beach', budget: 'budget', price: 180, rating: 4.6, image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70', description: 'Golden beaches, vibrant nightlife and Portuguese heritage make Goa India’s favourite coastal escape.', highlights: ['Baga & Calangute Beaches', 'Basilica of Bom Jesus', 'Dudhsagar Waterfalls', 'Anjuna Flea Market'] },
    { id: 'maldives', name: 'Maldives', country: 'Maldives', region: 'asia', type: 'luxury', budget: 'luxury', price: 850, rating: 4.9, image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=70', description: 'A paradise of turquoise lagoons, overwater villas and coral reefs — the ultimate romantic escape.', highlights: ['Overwater Villas', 'Coral Reef Snorkelling', 'Sunset Dolphin Cruises', 'World-Class Spas'] },
    { id: 'bali', name: 'Bali', country: 'Indonesia', region: 'asia', type: 'tropical', budget: 'mid', price: 320, rating: 4.8, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=70', description: 'Lush rice terraces, ancient temples and warm Balinese hospitality create an enchanting island experience.', highlights: ['Tegallalang Rice Terraces', 'Uluwatu Temple', 'Ubud Art Market', 'Mount Batur Sunrise Trek'] },
    { id: 'kerala', name: 'Kerala', country: 'India', region: 'asia', type: 'nature', budget: 'budget', price: 160, rating: 4.5, image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70', description: 'Serene backwaters, lush hill stations and Ayurvedic retreats earn Kerala its nickname — God’s Own Country.', highlights: ['Alleppey Houseboats', 'Munnar Tea Gardens', 'Kathakali Performances', 'Ayurvedic Wellness'] },
    { id: 'dubai', name: 'Dubai', country: 'UAE', region: 'middle-east', type: 'city', budget: 'luxury', price: 520, rating: 4.7, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=70', description: 'Futuristic skylines, desert safaris and opulent shopping malls — Dubai redefines modern luxury travel.', highlights: ['Burj Khalifa', 'Desert Safari', 'Dubai Mall Fountain Show', 'Palm Jumeirah'] },
    { id: 'switzerland', name: 'Switzerland', country: 'Switzerland', region: 'europe', type: 'mountain', budget: 'luxury', price: 640, rating: 4.9, image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=70', description: 'Snow-capped Alps, chocolate-box villages and scenic rail journeys make Switzerland a year-round wonder.', highlights: ['Jungfraujoch', 'Lake Geneva', 'Matterhorn', 'Glacier Express'] },
    { id: 'santorini', name: 'Santorini', country: 'Greece', region: 'europe', type: 'island', budget: 'mid', price: 460, rating: 4.8, image: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=1200&q=70', description: 'Whitewashed cliffs, sapphire domes and legendary sunsets over the Aegean Sea define this iconic Greek island.', highlights: ['Oia Sunset', 'Red Beach', 'Ancient Akrotiri', 'Wine Tasting Tours'] },
    { id: 'paris', name: 'Paris', country: 'France', region: 'europe', type: 'city', budget: 'mid', price: 400, rating: 4.7, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=70', description: 'The City of Light enchants with iconic landmarks, haute cuisine and timeless romantic charm.', highlights: ['Eiffel Tower', 'Louvre Museum', 'Seine River Cruise', 'Champs-Élysées'] },
    { id: 'jaipur', name: 'Jaipur', country: 'India', region: 'asia', type: 'heritage', budget: 'budget', price: 150, rating: 4.5, image: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=1200&q=70', description: 'The Pink City dazzles with majestic forts, colourful bazaars and the grandeur of royal Rajasthani heritage.', highlights: ['Amber Fort', 'Hawa Mahal', 'City Palace', 'Nahargarh Fort Sunset'] },
    { id: 'queenstown', name: 'Queenstown', country: 'New Zealand', region: 'oceania', type: 'adventure', budget: 'luxury', price: 580, rating: 4.8, image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70', description: 'The adventure capital of the world, cradled by dramatic Southern Alps and crystal-clear lakes.', highlights: ['Milford Sound', 'Bungee Jumping', 'Lake Wakatipu Cruises', 'Skiing & Snowboarding'] }
  ],

  hotels: [
    { id: 'h1', name: 'Taj Exotica Resort & Spa', destination: 'Goa', destinationId: 'goa', stars: 5, price: 320, type: 'resort', rating: 4.8, reviews: 1243, amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant', 'beach'], availability: true, image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=70'], description: 'Set on 56 acres of lush gardens along the Benaulim beach, Taj Exotica blends Mediterranean architecture with warm Indian hospitality.', rooms: [{ type: 'Deluxe Room', price: 320, capacity: 2 }, { type: 'Premier Suite', price: 520, capacity: 3 }, { type: 'Presidential Villa', price: 1200, capacity: 4 }], short: 'Beachfront luxury on 56 acres of tropical gardens.' },
    { id: 'h2', name: 'Soneva Fushi', destination: 'Maldives', destinationId: 'maldives', stars: 5, price: 950, type: 'resort', rating: 4.9, reviews: 892, amenities: ['pool', 'spa', 'wifi', 'restaurant', 'beach', 'diving'], availability: true, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=70'], description: 'Barefoot luxury at its finest — pioneering eco-luxury villas surrounded by pristine coral reefs and jungle.', rooms: [{ type: 'Jungle Villa', price: 950, capacity: 2 }, { type: 'Water Retreat', price: 1600, capacity: 2 }, { type: 'Crusoe Residence', price: 2400, capacity: 4 }], short: 'Barefoot eco-luxury with private beach and reef.' },
    { id: 'h3', name: 'Four Seasons Resort Bali', destination: 'Bali', destinationId: 'bali', stars: 5, price: 420, type: 'resort', rating: 4.8, reviews: 1567, amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=70'], description: 'A secluded sanctuary in the cultural heart of Ubud with breathtaking Ayung River valley views.', rooms: [{ type: 'Valley View Room', price: 420, capacity: 2 }, { type: 'Private Pool Villa', price: 780, capacity: 3 }, { type: 'Three-Bedroom Villa', price: 1500, capacity: 6 }], short: 'Secluded Ubud sanctuary in the Ayung River valley.' },
    { id: 'h4', name: 'Kumarakom Lake Resort', destination: 'Kerala', destinationId: 'kerala', stars: 5, price: 220, type: 'resort', rating: 4.6, reviews: 734, amenities: ['pool', 'spa', 'wifi', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=70'], description: 'A luxury heritage resort on the banks of Vembanad Lake, offering authentic Kerala backwater experiences.', rooms: [{ type: 'Lake View Room', price: 220, capacity: 2 }, { type: 'Heritage Villa', price: 380, capacity: 3 }, { type: 'Presidential Suite', price: 650, capacity: 4 }], short: 'Heritage luxury on the Vembanad Lake backwaters.' },
    { id: 'h5', name: 'Burj Al Arab Jumeirah', destination: 'Dubai', destinationId: 'dubai', stars: 5, price: 1100, type: 'hotel', rating: 4.9, reviews: 2105, amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant', 'beach'], availability: true, image: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70'], description: 'The world’s most iconic sail-shaped hotel delivering uncompromising luxury on its own private island.', rooms: [{ type: 'Deluxe Suite', price: 1100, capacity: 2 }, { type: 'Panoramic Suite', price: 1800, capacity: 3 }, { type: 'Royal Suite', price: 8000, capacity: 4 }], short: 'Iconic sail-shaped hotel on a private island.' },
    { id: 'h6', name: 'The Chedi Andermatt', destination: 'Switzerland', destinationId: 'switzerland', stars: 5, price: 680, type: 'hotel', rating: 4.8, reviews: 623, amenities: ['pool', 'spa', 'wifi', 'gym', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=800&q=70'], description: 'Alpine grandeur meets contemporary design in this award-winning mountain retreat in the Swiss Alps.', rooms: [{ type: 'Alpine Room', price: 680, capacity: 2 }, { type: 'Mountain Suite', price: 1100, capacity: 3 }, { type: 'Spa Chalet', price: 2200, capacity: 4 }], short: 'Award-winning Alpine retreat with 3,000 m² spa.' },
    { id: 'h7', name: 'Canaves Oia Suites', destination: 'Santorini', destinationId: 'santorini', stars: 5, price: 590, type: 'hotel', rating: 4.9, reviews: 1089, amenities: ['pool', 'spa', 'wifi', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1570213489059-0aac6626cade?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1504512485720-7d83a16ee930?auto=format&fit=crop&w=800&q=70'], description: 'Perched on the caldera cliffs of Oia with private plunge pools and the most photographed sunsets in the world.', rooms: [{ type: 'Caldera Suite', price: 590, capacity: 2 }, { type: 'Infinity Pool Suite', price: 980, capacity: 2 }, { type: 'Honeymoon Villa', price: 1450, capacity: 2 }], short: 'Cliffside caldera suites with private plunge pools.' },
    { id: 'h8', name: 'Plaza Athénée Paris', destination: 'Paris', destinationId: 'paris', stars: 5, price: 750, type: 'hotel', rating: 4.8, reviews: 1893, amenities: ['spa', 'wifi', 'gym', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1549294413-26f195200c16?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=70'], description: 'A Parisian icon on Avenue Montaigne with Eiffel Tower views, Alain Ducasse dining and legendary refinement.', rooms: [{ type: 'Superior Room', price: 750, capacity: 2 }, { type: 'Eiffel Suite', price: 1400, capacity: 3 }, { type: 'Royal Suite', price: 4500, capacity: 4 }], short: 'Parisian icon on Avenue Montaigne with Eiffel views.' },
    { id: 'h9', name: 'Rambagh Palace', destination: 'Jaipur', destinationId: 'jaipur', stars: 5, price: 280, type: 'resort', rating: 4.7, reviews: 967, amenities: ['pool', 'spa', 'wifi', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1596436889106-be35e843f974?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=70'], description: 'The former residence of the Maharaja of Jaipur, now a palatial heritage hotel amid 47 acres of manicured gardens.', rooms: [{ type: 'Palace Room', price: 280, capacity: 2 }, { type: 'Royal Suite', price: 620, capacity: 3 }, { type: 'Maharaja Suite', price: 1400, capacity: 4 }], short: 'Former royal residence set in 47 acres of gardens.' },
    { id: 'h10', name: 'Matakauri Lodge', destination: 'Queenstown', destinationId: 'queenstown', stars: 5, price: 820, type: 'resort', rating: 4.9, reviews: 456, amenities: ['pool', 'spa', 'wifi', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=70'], description: 'A luxury lodge overlooking Lake Wakatipu and The Remarkables — the perfect base for New Zealand adventures.', rooms: [{ type: 'Lake View Suite', price: 820, capacity: 2 }, { type: 'Two-Bedroom Villa', price: 1600, capacity: 4 }, { type: 'Owner’s Cottage', price: 3200, capacity: 6 }], short: 'Luxury lodge overlooking Lake Wakatipu.' },
    { id: 'h11', name: 'The Oberoi Beach Resort', destination: 'Goa', destinationId: 'goa', stars: 5, price: 380, type: 'resort', rating: 4.7, reviews: 812, amenities: ['pool', 'spa', 'wifi', 'beach', 'restaurant'], availability: true, image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=800&q=70'], description: 'An intimate beachfront sanctuary of 20 acres of palm-fringed gardens on the serene shores of Sinquerim Beach.', rooms: [{ type: 'Luxury Room', price: 380, capacity: 2 }, { type: 'Sea View Villa', price: 640, capacity: 3 }, { type: 'Premier Sea View Room', price: 520, capacity: 2 }], short: 'Intimate 20-acre beachfront sanctuary in North Goa.' },
    { id: 'h12', name: 'One&Only Reethi Rah', destination: 'Maldives', destinationId: 'maldives', stars: 5, price: 1200, type: 'resort', rating: 4.9, reviews: 678, amenities: ['pool', 'spa', 'wifi', 'restaurant', 'beach', 'diving'], availability: true, image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=70', gallery: ['https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=800&q=70', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=70'], description: 'A world of its own on a private island, with 45 acres of tropical beauty and 12 pristine beaches.', rooms: [{ type: 'Beach Villa', price: 1200, capacity: 2 }, { type: 'Water Villa', price: 2000, capacity: 2 }, { type: 'Grand Residence', price: 5500, capacity: 8 }], short: 'Private island with 12 pristine beaches and 45 acres.' }
  ],

  offers: [
    { id: 'o1', title: 'Early Bird Goa Escape', code: 'GOA25', discount: 25, type: 'Seasonal Deal', description: 'Book 60 days in advance and save 25% on any Goa resort stay of 3 nights or more.', expiry: '2026-12-31', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=70', tag: '25% OFF', minNights: 3 },
    { id: 'o2', title: 'Maldives Honeymoon Package', code: 'LOVE15', discount: 15, type: 'Honeymoon', description: 'Romantic overwater villa, sunset cruise, couples spa and private dinner on the beach. 15% off.', expiry: '2026-11-30', image: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&w=1200&q=70', tag: 'HONEYMOON', minNights: 4 },
    { id: 'o3', title: 'Weekend Bali Retreat', code: 'WEEKEND10', discount: 10, type: 'Weekend Getaway', description: 'Two nights of tropical bliss in Ubud with daily breakfast and a traditional Balinese massage.', expiry: '2026-12-15', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=70', tag: '10% OFF', minNights: 2 },
    { id: 'o4', title: 'Alpine Luxury Package', code: 'ALPS30', discount: 30, type: 'Luxury Resort', description: 'Experience the Swiss Alps in style — 30% off premium suites with spa access and scenic rail passes.', expiry: '2026-10-31', image: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1200&q=70', tag: '30% OFF', minNights: 3 },
    { id: 'o5', title: 'Family Kerala Getaway', code: 'FAMILY20', discount: 20, type: 'Family Vacation', description: 'Houseboat cruise, spice plantation tour and kid-friendly activities — 20% off for families of 4+.', expiry: '2027-01-31', image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=70', tag: 'FAMILY 20%', minNights: 2 },
    { id: 'o6', title: 'Dubai City & Desert', code: 'DUBAI18', discount: 18, type: 'Seasonal Deal', description: 'Combine a luxury city stay with an overnight desert safari. 18% off all-inclusive packages.', expiry: '2026-12-31', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=70', tag: '18% OFF', minNights: 3 },
    { id: 'o7', title: 'Tokyo City Lights', code: 'TOKYO15', discount: 15, type: 'City Break', description: 'Discover vibrant neighbourhoods, tranquil temples and unforgettable Japanese dining with 15% off.', expiry: '2027-02-28', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=70', tag: '15% OFF', minNights: 3 },
    { id: 'o8', title: 'Queenstown Adventure', code: 'QUEEN20', discount: 20, type: 'Adventure Escape', description: 'Experience alpine lakes, dramatic mountains and thrilling outdoor adventures with 20% off.', expiry: '2027-03-31', image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=70', tag: '20% OFF', minNights: 3 }
  ],

  testimonials: [
    { name: 'Aarav Mehta', role: 'Travel Blogger', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=70', text: 'Stackly made planning our Maldives honeymoon effortless. Every detail was perfect — from the overwater villa to the sunset cruise.', rating: 5 },
    { name: 'Emily Watson', role: 'Vacation Planner', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=70', text: 'The best booking platform I have used. The Bali recommendation was spot-on and the price comparison saved us over $400.', rating: 5 },
    { name: 'Rohan Gupta', role: 'Software Engineer', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=70', text: 'Booked a last-minute weekend in Goa through Stackly. Beautiful resort, seamless check-in, and the dashboard kept all my trips organised.', rating: 4 },
    { name: 'Sofia Reyes', role: 'Photographer', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=70', text: 'From Santorini sunsets to Swiss Alps views, Stackly helped us chase the world’s most beautiful stays. Highly recommended!', rating: 5 }
  ],

  amenityLabels: { pool: 'Pool', spa: 'Spa', wifi: 'Wi-Fi', gym: 'Gym', restaurant: 'Restaurant', beach: 'Private Beach', diving: 'Diving' },

  hotelById(id) { return this.hotels.find(h => h.id === id) || null; },
  destinationById(id) { return this.destinations.find(d => d.id === id) || null; },
  hotelsByDestination(destId) { return this.hotels.filter(h => h.destinationId === destId); }
};

/* Seed demo data once StacklyData is defined */
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => StacklyStorage.seedAll());

  /* Apply saved theme preference across every page */
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const user = StacklyStorage.getCurrentUser();
      const prefs = user ? StacklyStorage.getPreferences(user.email) : {};
      let theme = prefs.theme || 'light';
      if (theme === 'system') {
        theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      if (theme === 'dark') document.body.classList.add('theme-dark');
    } catch (e) { /* ignore */ }
  });
}
