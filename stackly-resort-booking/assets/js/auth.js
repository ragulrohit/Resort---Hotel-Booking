/* ============================================================
   Stackly â€” auth.js
   Login / signup / logout / session guards / Google demo.
   ============================================================ */

const StacklyAuth = (() => {
  const V = () => StacklyValidate;

  /* ---------- shared UI: password toggle ---------- */

  function bindPasswordToggle(scope) {
    (scope || document).querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        if (!input) return;
        const showing = input.type === 'text';
        input.type = showing ? 'password' : 'text';
        btn.innerHTML = showing
          ? '<i class="fa-solid fa-eye"></i>'
          : '<i class="fa-solid fa-eye-slash"></i>';
        btn.setAttribute('aria-label', showing ? 'Show password' : 'Hide password');
      });
    });
  }

  /* ---------- signup ---------- */

  function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    V().clearAllErrors(form);

    const fullName = form.fullName.value.trim();
    const email = form.email.value.trim();
    const phone = form.phone.value.trim();
    const role = form.role.value;
    const password = form.password.value;
    const confirm = form.confirmPassword.value;
    const terms = form.terms.checked;

    let ok = true;
    if (V().isEmpty(fullName)) { V().setFieldError(form.fullName, 'Full name is required.'); ok = false; }
    else if (fullName.length < 2) { V().setFieldError(form.fullName, 'Name must be at least 2 characters.'); ok = false; }

    if (V().isEmpty(email)) { V().setFieldError(form.email, 'Email is required.'); ok = false; }
    else if (StacklyStorage.findUserByEmail(email)) { V().setFieldError(form.email, 'An account with this email already exists.'); ok = false; }

    if (V().isEmpty(phone)) { V().setFieldError(form.phone, 'Phone number is required.'); ok = false; }
    else if (!V().isPhone(phone)) { V().setFieldError(form.phone, 'Please enter a valid phone number.'); ok = false; }

    if (V().isEmpty(role)) { V().setFieldError(form.role, 'Please select a role.'); ok = false; }

    if (V().isEmpty(password)) { V().setFieldError(form.password, 'Password is required.'); ok = false; }

    if (!confirm) { V().setFieldError(form.confirmPassword, 'Please confirm your password.'); ok = false; }
    else if (password !== confirm) { V().setFieldError(form.confirmPassword, 'Passwords do not match.'); ok = false; }

    if (!terms) {
      const box = form.querySelector('.terms-wrap');
      if (box) {
        let err = box.querySelector('.field-error');
        if (!err) { err = document.createElement('span'); err.className = 'field-error'; err.style.display = 'block'; box.appendChild(err); }
        err.textContent = 'You must accept the Terms & Conditions.';
      }
      ok = false;
    }

    if (!ok) {
      V().toast('Please fix the highlighted fields.', 'error');
      return;
    }

    V().setLoading(btn, true, 'Creating accountâ€¦');
    setTimeout(() => {
      const res = StacklyStorage.addUser({ fullName, email, phone, role, password });
      V().setLoading(btn, false);
      if (!res.ok) {
        V().setFieldError(form.email, 'An account with this email already exists.');
        V().toast('This email is already registered.', 'error');
        return;
      }
      V().toast('Account created successfully! Redirecting to loginâ€¦', 'success');
      form.reset();
      setTimeout(() => { window.location.href = 'login.html?registered=1&email=' + encodeURIComponent(email); }, 1400);
    }, 900);
  }

  /* ---------- login ---------- */

  function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    V().clearAllErrors(form);

    const email = form.email.value.trim();
    const password = form.password.value;
    const remember = form.remember && form.remember.checked;

    let ok = true;
    if (V().isEmpty(email)) { V().setFieldError(form.email, 'Email address is required.'); ok = false; }
    else if (!V().isEmail(email)) { V().setFieldError(form.email, 'Please enter a valid email address.'); ok = false; }

    if (V().isEmpty(password)) { V().setFieldError(form.password, 'Password is required.'); ok = false; }

    if (!ok) { V().toast('Please fix the highlighted fields.', 'error'); return; }

    V().setLoading(btn, true, 'Signing inâ€¦');
    setTimeout(() => {
      let user = StacklyStorage.findUserByEmail(email);
      V().setLoading(btn, false);
      if (!user) {
        const created = StacklyStorage.addUser({
          fullName: email.split('@')[0] || 'Demo User',
          email,
          phone: '',
          password,
          role: form.role ? form.role.value : 'traveller',
          isDemo: true
        });
        user = created.user;
      }
      StacklyStorage.setSession(email);
      if (remember) localStorage.setItem('stackly_remember', '1');
      else localStorage.removeItem('stackly_remember');
      V().toast(`Welcome back, ${user.fullName || email.split('@')[0]}!`, 'success');
      setTimeout(() => { window.location.href = 'dashboard/overview.html'; }, 900);
    }, 900);
  }

  /* ---------- Google (DEMO) ---------- */

  function googleDemo() {
    window.location.href = '404.html';
  }

  /* ---------- logout ---------- */

  function doLogout() {
    StacklyStorage.clearSession();
    V().toast('You have been logged out successfully.', 'success');
    const inDashboard = window.location.pathname.includes('/dashboard/');
    setTimeout(() => {
      window.location.href = inDashboard ? '../login.html' : 'login.html';
    }, 900);
  }

  /* ---------- guards ---------- */

  function requireAuth() {
    if (!StacklyStorage.isLoggedIn()) {
      const inDashboard = window.location.pathname.includes('/dashboard/');
      window.location.href = inDashboard ? '../login.html?redirected=1' : 'login.html?redirected=1';
      return false;
    }
    return true;
  }

  function redirectIfAuthed(target) {
    if (StacklyStorage.isLoggedIn()) {
      window.location.href = target || 'dashboard/overview.html';
    }
  }

  /* ---------- URL helpers ---------- */

  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function bindAuthPage() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', handleSignup);
      bindPasswordToggle(signupForm);
      const pre = getParam('email');
      if (pre) { const f = signupForm.email; if (f) f.value = pre; }
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
      bindPasswordToggle(loginForm);
      if (getParam('registered')) {
        V().toast('Account created! Please sign in with your new credentials.', 'success', 5000);
        const em = getParam('email');
        if (em) loginForm.email.value = em;
      }
      if (getParam('redirected')) {
        V().toast('Please log in to access that page.', 'warning', 4200);
      }
      if (getParam('forgot')) {
        V().toast('Password reset is not available in this frontend demo. Please use a demo account.', 'info', 5000);
      }
      if (getParam('logout')) {
        V().toast('You have been logged out successfully.', 'success');
      }
      const rememberEmail = localStorage.getItem('stackly_remember_email');
      if (rememberEmail) {
        loginForm.email.value = rememberEmail;
        if (loginForm.remember) loginForm.remember.checked = true;
      }
    }

    document.querySelectorAll('[data-google-auth]').forEach(btn => {
      btn.addEventListener('click', e => { e.preventDefault(); googleDemo(); });
    });
  }

  return {
    bindPasswordToggle, handleSignup, handleLogin, googleDemo, doLogout,
    requireAuth, redirectIfAuthed, getParam, bindAuthPage
  };
})();

document.addEventListener('DOMContentLoaded', () => StacklyAuth.bindAuthPage());

