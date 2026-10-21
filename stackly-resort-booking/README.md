# Stackly — Resort & Hotel Booking Website

A complete, modern, colourful and fully responsive **Resort & Hotel Booking** platform built with **only HTML5, CSS3 and Vanilla JavaScript**. Stackly includes a public marketing site, a LocalStorage-powered authentication demo, and an eight-page user dashboard with interactive Chart.js visualisations.

> ⚠️ **Frontend demonstration only.** All authentication, bookings, payments, invoices and reviews are simulated in the browser via `LocalStorage`. No real reservations, payments or Google OAuth are processed. Production use requires a secure backend, database, real Google Identity Services integration and a trusted payment provider.

---

## 📁 Project Structure

```
stackly-resort-booking/
├── index.html               # Home
├── login.html               # Split-screen login
├── signup.html              # Split-screen signup
├── destinations.html        # Public destinations browser
├── hotels.html              # Hotels & resorts with filters
├── offers.html              # Offers + coupon engine
├── contact.html             # Contact form + FAQ accordion + map
├── 404.html                 # Custom 404 page
├── .htaccess                # Apache 404 + security/cache config
├── dashboard/
│   ├── overview.html        # 1. Overview dashboard + charts
│   ├── bookings.html        # 2. My bookings (cancel/details)
│   ├── destinations.html    # 3. Explore destinations
│   ├── favorites.html       # 4. Favorite hotels
│   ├── reservations.html    # 5. Booking & reservations form
│   ├── payments.html        # 6. Payments & invoices
│   ├── reviews.html         # 7. Reviews & feedback
│   └── profile.html         # 8. Profile & settings
└── assets/
    ├── css/
    │   ├── style.css        # Global styles, navbar, cards, modals
    │   ├── auth.css         # Login / signup split screens
    │   ├── dashboard.css    # Dashboard shell, sidebar, tables
    │   ├── animations.css   # Keyframes, scroll reveals, reduced-motion
    │   └── responsive.css   # Tablet & mobile media queries
    └── js/
        ├── storage.js       # LocalStorage helpers + demo dataset
        ├── validation.js    # Field validation, toasts, modals
        ├── auth.js          # Signup / login / logout / guards
        ├── booking.js       # Pricing, booking creation, invoices
        ├── charts.js        # Chart.js pie/bar/doughnut helpers
        ├── dashboard.js     # Shell injection + all dashboard logic
        └── app.js           # Navbar, hero search, filters, accordions
    └── images/
        └── placeholder.svg  # Local fallback for failed image loads
```

---

## 🚀 Quick Start

### Option A — Open directly (simplest)
1. Download / unzip the project folder.
2. Open `stackly-resort-booking/index.html` in any modern browser (Chrome, Edge, Firefox, Safari).

### Option B — Local static server (recommended)
```bash
cd stackly-resort-booking
# Python 3
python -m http.server 8080
# OR Node
npx serve .
```
Then visit `http://localhost:8080`.

> No build step, no npm install and no framework is required.

---

## 🔐 Demo Accounts & Data

| Account | Email | Password |
|---|---|---|
| Demo Guest | `demo@stackly.com` | `Demo@1234` |
| Google Demo | `google.demo@stackly.com` | `GoogleDemo@1` |

- On first visit, Stackly seeds **demo bookings and reviews** so charts and tables are populated immediately.
- The **"Continue with Google"** button runs in clearly-labelled **demo mode**: it creates a local demo session instead of performing real Google OAuth.

---

## ✨ Feature Highlights

### Public Site
- **Home** — hero with interactive hotel search, featured destinations, popular hotels, recommended stays, offers, testimonials, newsletter.
- **Destinations** — search + filters (region / budget / type), detail modal with related hotels.
- **Hotels & Resorts** — search, price-range slider, rating, type, sort, favourite toggle, detail modal, Book Now deep-links into the reservation form.
- **Offers** — seasonal / weekend / luxury / honeymoon / family deals with working coupon codes and live price recalculation.
- **Contact Us** — info cards, validated contact form, embedded map, FAQ accordion.
- **404** — branded error page with Go Back + Back to Home actions.

### Dashboard (8 pages)
1. **Overview** — animated stat cards, booking distribution pie chart, monthly bar chart, recent bookings table, upcoming reservation cards, quick actions.
2. **My Bookings** — search & status filter, view details modal, cancel (with confirmation), download confirmation / invoice.
3. **Explore Destinations** — hero, searchable/filterable destination cards.
4. **Favorite Hotels** — saved hotels with remove, Book Now, View Details.
5. **Booking & Reservations** — full form (destination → hotel → room cascading selects), coupon codes, live price summary (nights, taxes, discounts), validation, success modal with booking reference.
6. **Payments & Invoices** — spending summary, doughnut chart, invoice list, printable / downloadable HTML invoices (demo-labelled).
7. **Reviews & Feedback** — star rating input, hotel selection, rating distribution chart, saved reviews list.
8. **Profile & Settings** — edit name / email / phone / preferred destination, change password, notification & theme preferences, account info, logout.

### Global
- Sticky responsive navbar with animated underline + dropdowns (Escape + outside-click to close).
- Persistent login session (`stackly_session`) and route guard for all dashboard pages.
- Logout confirmation modal → clears session, preserves accounts, redirects to login.
- Toast notifications, loading states, empty states, modals, confirm dialogs.
- Scroll-reveal animations via `IntersectionObserver`, card hover effects, animated counters, `prefers-reduced-motion` support.
- Chart.js charts (pie, bar, doughnut) that resize responsively and show friendly empty states.
- Semantic HTML, ARIA labels, keyboard-navigable modals/accordions, visible focus states.

---

## 🎨 Brand & Theme

| Token | Value |
|---|---|
| Deep Navy | `#0A1F3F` |
| Turquoise | `#19A7CE` |
| Teal | `#14D9B9` |
| Coral | `#FC4E67` |
| Fonts | Plus Jakarta Sans (headings) + Inter (body) |
| Icons | Font Awesome 6 |
| Charts | Chart.js 4 |
| Images | Unsplash (realistic hotel / resort / travel photography) |

---

## 🗃 LocalStorage Keys

| Key | Purpose |
|---|---|
| `stackly_users` | Registered user accounts |
| `stackly_session` | Active login session |
| `stackly_bookings` | All bookings |
| `stackly_favorites` | Favourite hotel IDs per user |
| `stackly_reviews` | Submitted reviews |
| `stackly_preferences` | Notification / theme prefs |
| `stackly_contacts` | Contact form submissions |
| `stackly_newsletter` | Newsletter emails |

Clear your browser storage (or run "Clear site data") to reset the demo.

---

## 🧪 404 Hosting Configuration

For **static hosts** the custom `404.html` file is used automatically:
- **Netlify / Vercel**: add a `redirects` / `vercel.json` rule mapping unknown paths to `/404.html`.
- **Apache**: `.htaccess` → `ErrorDocument 404 /404.html`
- **nginx**: `error_page 404 /404.html;`
- **GitHub Pages**: rename to `404.html` (already provided) — it serves automatically.

---

## ✅ Verification Checklist

- [x] Every requested page implemented as a separate HTML file
- [x] All navigation links wired (public + dashboard)
- [x] Signup → login → session → dashboard → logout flow works
- [x] Logged-in user's name & email shown dynamically (email fallback)
- [x] All 8 dashboard pages functional
- [x] Booking create / cancel / favourite / profile / invoice flows verified
- [x] Charts driven by saved LocalStorage data
- [x] Dropdowns, modals, filters, search, accordions interactive
- [x] Responsive at desktop / tablet / mobile widths
- [x] Custom 404 page with working navigation buttons
- [x] Google button clearly labelled demo-mode
- [x] README with setup instructions

---

## 📜 Production Roadmap

To move this demo toward production:
1. Replace LocalStorage auth with server-side sessions (httpOnly cookies) + hashed passwords.
2. Implement real Google Identity Services (GIS) OAuth flow.
3. Back bookings, payments and reviews with a database + REST/GraphQL API.
4. Integrate a PCI-compliant payment provider (Stripe / Razorpay).
5. Add rate limiting, CSRF protection, input sanitisation and HTTPS.

---

© 2026 Stackly. Built with HTML5, CSS3 and Vanilla JavaScript.
