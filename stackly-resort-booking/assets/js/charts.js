/* ============================================================
   Stackly — charts.js
   Chart.js helpers for dashboard visualisations.
   ============================================================ */

const StacklyCharts = (() => {
  function getCtx(id) {
    const el = document.getElementById(id);
    return el ? el.getContext('2d') : null;
  }

  /* ---------- palette ---------- */

  const palette = {
    pie: ['#19A7CE', '#0A1F3F', '#FC4E67', '#14D9B9', '#A08BFF', '#FF8F6B', '#7AE7C7'],
    bar: ['#19A7CE', '#14D9B9', '#FC4E67'],
    doughnut: ['#0A1F3F', '#19A7CE', '#14D9B9', '#FC4E67']
  };

  // Keep dashboard charts in sync with the signed-in user's overview data.
  function scopedBookings() {
    const user = StacklyStorage.getCurrentUser();
    return user ? StacklyStorage.getBookingsForUser(user.email) : [];
  }

  /* ---------- booking distribution pie ---------- */

  function bookingDistribution() {
    const ctx = getCtx('chartBooking');
    if (!ctx) return;
    const bookings = scopedBookings();
    const map = {};
    bookings.forEach(b => { map[b.status] = (map[b.status] || 0) + 1; });
    const labels = Object.keys(map).map(s => s[0].toUpperCase() + s.slice(1));
    const data = Object.values(map);
    if (!data.length) {
      ctx.canvas.parentElement.innerHTML = '<p style="color:#64748b;padding:1rem">No bookings yet. Create a reservation to see booking distribution.</p>';
      return;
    }
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: palette.pie.slice(0, data.length),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }

  /* ---------- monthly booking bar ---------- */

  function monthlyBookings() {
    const ctx = getCtx('chartMonthly');
    if (!ctx) return;
    const bookings = scopedBookings().filter(b => b.createdAt);
    if (!bookings.length) {
      ctx.canvas.parentElement.innerHTML = '<p style="color:#64748b;padding:1rem">No booking activity to display yet.</p>';
      return;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const counts = Array(12).fill(0);
    bookings.forEach(b => {
      const d = new Date(b.createdAt);
      if (!isNaN(d)) counts[d.getMonth()]++;
    });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Bookings',
          data: counts,
          backgroundColor: palette.bar[0],
          borderRadius: 8,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        },
        plugins: {
          legend: { display: false },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }

  /* ---------- spending doughnut ---------- */

  function spendingDistribution() {
    const ctx = getCtx('chartSpending');
    if (!ctx) return;
    const user = StacklyStorage.getCurrentUser();
    const ownBookings = user ? StacklyStorage.getBookingsForUser(user.email) : StacklyStorage.getBookings();
    const bookings = ownBookings;
    if (!bookings.length) {
      ctx.canvas.parentElement.innerHTML = '<p style="color:#64748b;padding:1rem">No spending data available yet.</p>';
      return;
    }
    const map = {};
    bookings.forEach(b => { const dest = b.destination || 'Other'; map[dest] = (map[dest] || 0) + Number(b.total || 0); });
    const labels = Object.keys(map).slice(0, 6);
    const data = labels.map(l => Math.round(map[l]));
    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: palette.doughnut.slice(0, labels.length),
          borderWidth: 3,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) label += ': $' + context.formattedValue;
                return label;
              }
            }
          }
        },
        cutout: '70%'
      }
    });
  }

  /* ---------- review rating distribution ---------- */

  function reviewRatingDistribution() {
    const ctx = getCtx('chartReviews');
    if (!ctx) return;
    const reviews = StacklyStorage.getReviews();
    if (!reviews.length) {
      ctx.canvas.parentElement.innerHTML = '<p style="color:#64748b;padding:1rem">No reviews to chart yet. Be the first to leave a review!</p>';
      return;
    }
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      const s = Math.round(Number(r.rating || 0));
      if (s >= 1 && s <= 5) counts[s - 1]++;
    });
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['★ 1', '★ 2', '★ 3', '★ 4', '★ 5'],
        datasets: [{
          label: 'Reviews',
          data: counts,
          backgroundColor: [palette.pie[3], palette.pie[3], palette.pie[4], palette.pie[0], palette.pie[5]],
          borderRadius: 8,
          barThickness: 18
        }]
      },
      options: {
        responsive: true,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } }
      }
    });
  }

  return {
    bookingDistribution,
    monthlyBookings,
    spendingDistribution,
    reviewRatingDistribution,
    initAll() {
      bookingDistribution();
      monthlyBookings();
      spendingDistribution();
      reviewRatingDistribution();
    }
  };
})();
