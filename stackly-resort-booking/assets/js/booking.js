/* ============================================================
   Stackly — booking.js
   Price calculation, reservation form, invoice helpers.
   ============================================================ */

const StacklyBooking = (() => {
  const V = () => StacklyValidate;

  /* ---------- pricing ---------- */

  function calculatePrice({ hotel, roomType, checkIn, checkOut, guests, rooms, discountPct }) {
    if (!hotel || !checkIn || !checkOut) return null;
    const nights = V().nightsBetween(checkIn, checkOut);
    if (nights <= 0) return null;
    const room = hotel.rooms ? hotel.rooms.find(r => r.type === roomType) : null;
    const nightly = room ? room.price : hotel.price;
    const roomCount = Math.max(1, parseInt(rooms, 10) || 1);
    const subtotal = nightly * nights * roomCount;
    const taxes = Math.round(subtotal * 0.12 * 100) / 100;
    const discount = discountPct ? Math.round(subtotal * (discountPct / 100) * 100) / 100 : 0;
    const total = Math.round((subtotal + taxes - discount) * 100) / 100;
    return { nights, nightly, roomCount, subtotal, taxes, discount, discountPct: discountPct || 0, total };
  }

  function formatMoney(n) {
    return '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  /* ---------- validation for reservation form ---------- */

  function validateReservation(form) {
    V().clearAllErrors(form);
    let ok = true;

    const destination = form.destination;
    const hotel = form.hotel;
    const checkIn = form.checkIn;
    const checkOut = form.checkOut;
    const guests = form.guests;
    const rooms = form.rooms;
    const roomType = form.roomType;
    const guestName = form.guestName;
    const guestEmail = form.guestEmail;

    if (destination && V().isEmpty(destination.value)) { V().setFieldError(destination, 'Please select a destination.'); ok = false; }
    if (hotel && V().isEmpty(hotel.value)) { V().setFieldError(hotel, 'Please select a hotel.'); ok = false; }
    if (checkIn && V().isEmpty(checkIn.value)) { V().setFieldError(checkIn, 'Check-in date is required.'); ok = false; }
    else if (checkIn && !V().isFutureDate(checkIn.value) && checkIn.value !== new Date().toISOString().slice(0, 10)) {
      V().setFieldError(checkIn, 'Check-in cannot be in the past.'); ok = false;
    }
    if (checkOut && V().isEmpty(checkOut.value)) { V().setFieldError(checkOut, 'Check-out date is required.'); ok = false; }
    else if (checkIn && checkOut && checkIn.value && checkOut.value && !V().dateAfter(checkOut.value, checkIn.value)) {
      V().setFieldError(checkOut, 'Check-out must be after check-in.'); ok = false;
    }
    if (guests && (!V().isPositiveInt(guests.value) || Number(guests.value) < 1)) { V().setFieldError(guests, 'At least 1 guest required.'); ok = false; }
    if (rooms && (!V().isPositiveInt(rooms.value) || Number(rooms.value) < 1)) { V().setFieldError(rooms, 'At least 1 room required.'); ok = false; }
    if (roomType && V().isEmpty(roomType.value)) { V().setFieldError(roomType, 'Please select a room type.'); ok = false; }
    if (guestName && V().isEmpty(guestName.value.trim())) { V().setFieldError(guestName, 'Guest name is required.'); ok = false; }
    if (guestEmail && V().isEmpty(guestEmail.value.trim())) { V().setFieldError(guestEmail, 'Email is required.'); ok = false; }
    else if (guestEmail && !V().isEmail(guestEmail.value)) { V().setFieldError(guestEmail, 'Please enter a valid email.'); ok = false; }

    return ok;
  }

  /* ---------- create booking ---------- */

  function createBooking(data) {
    const user = StacklyStorage.getCurrentUser();
    const booking = {
      userEmail: data.email || (user && user.email) || 'guest@demo.com',
      guestName: data.guestName || (user && user.fullName) || 'Guest',
      hotelId: data.hotel.id,
      hotelName: data.hotel.name,
      hotelImage: data.hotel.image,
      destination: data.hotel.destination,
      checkIn: data.checkIn,
      checkOut: data.checkOut,
      guests: Number(data.guests) || 1,
      rooms: Number(data.rooms) || 1,
      roomType: data.roomType,
      nightly: data.pricing.nightly,
      subtotal: data.pricing.subtotal,
      taxes: data.pricing.taxes,
      discount: data.pricing.discount,
      total: data.pricing.total,
      status: 'upcoming',
      paymentStatus: 'paid',
      paymentMethod: data.paymentMethod || 'Visa •••• 4242 (Demo)',
      specialRequests: data.specialRequests || '',
      offerCode: data.offerCode || ''
    };
    return StacklyStorage.addBooking(booking);
  }

  /* ---------- download helpers ---------- */

  function downloadText(filename, content, mime) {
    const blob = new Blob([content], { type: mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }

  function bookingConfirmationText(b) {
    return [
      '═══════════════════════════════════════════',
      '           STACKLY  —  BOOKING CONFIRMATION',
      '═══════════════════════════════════════════',
      '',
      `Booking Reference : ${b.reference}`,
      `Hotel              : ${b.hotelName}`,
      `Destination        : ${b.destination}`,
      `Check-in           : ${b.checkIn}`,
      `Check-out          : ${b.checkOut}`,
      `Guests             : ${b.guests}`,
      `Rooms              : ${b.rooms}`,
      `Room Type          : ${b.roomType}`,
      `Status             : ${b.status.toUpperCase()}`,
      `Total              : ${formatMoney(b.total)}`,
      '',
      'This is a demo confirmation generated by Stackly.',
      'No real reservation or payment has been processed.',
      '═══════════════════════════════════════════'
    ].join('\n');
  }

  function downloadConfirmation(booking) {
    downloadText(`stackly-confirmation-${booking.reference}.txt`, bookingConfirmationText(booking));
    V().toast('Confirmation downloaded.', 'success');
  }

  function invoiceHtml(b) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice ${b.reference}</title>
<style>body{font-family:Arial,sans-serif;max-width:700px;margin:40px auto;color:#1a1a2e;padding:0 20px}
h1{color:#0A1F3F}table{width:100%;border-collapse:collapse;margin:20px 0}
td,th{border-bottom:1px solid #ddd;padding:10px;text-align:left}
.total{font-size:1.3em;font-weight:bold;color:#19A7CE}
.badge{display:inline-block;padding:4px 12px;border-radius:20px;background:#e6f9f0;color:#0a7d4b;font-size:.85em}
footer{margin-top:30px;font-size:.85em;color:#777;border-top:1px solid #eee;padding-top:14px}</style></head>
<body><h1>Stackly Invoice</h1>
<p><strong>Invoice #:</strong> INV-${b.reference}<br>
<strong>Booking Ref:</strong> ${b.reference}<br>
<strong>Date:</strong> ${new Date(b.createdAt || Date.now()).toLocaleDateString()}</p>
<table><tr><th>Item</th><th>Detail</th></tr>
<tr><td>Hotel</td><td>${b.hotelName}</td></tr>
<tr><td>Destination</td><td>${b.destination}</td></tr>
<tr><td>Dates</td><td>${b.checkIn} → ${b.checkOut}</td></tr>
<tr><td>Guests / Rooms</td><td>${b.guests} guests, ${b.rooms} room(s)</td></tr>
<tr><td>Room Type</td><td>${b.roomType}</td></tr>
<tr><td>Payment Method</td><td>${b.paymentMethod || 'Demo payment'}</td></tr>
<tr><td>Status</td><td><span class="badge">${(b.paymentStatus || 'paid').toUpperCase()} (DEMO)</span></td></tr></table>
<p class="total">Total: ${formatMoney(b.total)}</p>
<footer>This invoice is generated for demo purposes by Stackly.<br>No real payment has been processed.</footer>
<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script></body></html>`;
  }

  function downloadInvoice(booking) {
    downloadText(`stackly-invoice-${booking.reference}.html`, invoiceHtml(booking), 'text/html');
    V().toast('Invoice downloaded. Opening print-ready layout…', 'success');
  }

  function printInvoice(booking) {
    const w = window.open('', '_blank');
    if (!w) { V().toast('Please allow pop-ups to print the invoice.', 'warning'); return; }
    w.document.write(invoiceHtml(booking));
    w.document.close();
  }

  return {
    calculatePrice, formatMoney, validateReservation, createBooking,
    downloadConfirmation, downloadInvoice, printInvoice, invoiceHtml, bookingConfirmationText
  };
})();
