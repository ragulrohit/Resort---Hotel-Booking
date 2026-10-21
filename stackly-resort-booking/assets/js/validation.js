/* ============================================================
   Stackly — validation.js
   Reusable form validation helpers for every page.
   ============================================================ */

const StacklyValidate = (() => {

  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/,
    phone: /^[+]?[\d\s\-().]{7,20}$/,
    passwordStrong: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  };

  function isEmpty(v) {
    return !v || !String(v).trim().length;
  }

  function isEmail(v) {
    return patterns.email.test(String(v).trim());
  }

  function isPhone(v) {
    return patterns.phone.test(String(v).trim());
  }

  function isStrongPassword(v) {
    return patterns.passwordStrong.test(String(v));
  }

  function isFutureDate(v) {
    const d = new Date(v);
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return !isNaN(d) && d >= now;
  }

  function dateAfter(v, other) {
    return new Date(v) > new Date(other);
  }

  function nightsBetween(a, b) {
    return Math.round((new Date(b) - new Date(a)) / 86400000);
  }

  function isPositiveInt(v) {
    const n = Number(v);
    return Number.isInteger(n) && n > 0;
  }

  /* ---------- field-level UI helpers ---------- */

  function setFieldError(input, message) {
    if (!input) return;
    const field = input.closest('.form-group') || input.closest('.field');
    if (!field) return;
    let err = field.querySelector('.field-error');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-error';
      err.setAttribute('role', 'alert');
      field.appendChild(err);
    }
    if (message) {
      err.textContent = message;
      err.style.display = 'block';
      input.classList.add('input-error');
      input.setAttribute('aria-invalid', 'true');
    } else {
      err.textContent = '';
      err.style.display = 'none';
      input.classList.remove('input-error');
      input.removeAttribute('aria-invalid');
    }
  }

  function clearFieldError(input) { setFieldError(input, ''); }

  function clearAllErrors(form) {
    if (!form) return;
    form.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    form.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.style.display = 'none'; });
  }

  /* ---------- custom form dropdowns ---------- */

  function bindCustomSelects(scope) {
    const root = scope || document;
    root.querySelectorAll('select.select:not([data-custom-select])').forEach(select => {
      select.dataset.customSelect = 'true';
      const wrapper = document.createElement('div');
      wrapper.className = 'custom-select';
      select.parentNode.insertBefore(wrapper, select);
      wrapper.appendChild(select);
      select.classList.add('custom-select-native');

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      wrapper.insertBefore(trigger, select);

      const list = document.createElement('div');
      list.className = 'custom-select-options';
      list.setAttribute('role', 'listbox');
      document.body.appendChild(list);

      function close() {
        wrapper.classList.remove('is-open');
        list.classList.remove('is-visible');
        trigger.setAttribute('aria-expanded', 'false');
        list.style.removeProperty('top');
        list.style.removeProperty('left');
        list.style.removeProperty('width');
      }

      function position() {
        if (!wrapper.classList.contains('is-open')) return;
        const rect = trigger.getBoundingClientRect();
        const viewportGap = 12;
        const width = Math.min(Math.max(rect.width, 180), window.innerWidth - (viewportGap * 2));
        list.style.width = `${width}px`;
        list.style.left = `${Math.max(viewportGap, Math.min(rect.left, window.innerWidth - width - viewportGap))}px`;
        const listHeight = Math.min(list.scrollHeight, Math.round(window.innerHeight * .48));
        const below = window.innerHeight - rect.bottom - viewportGap;
        const above = rect.top - viewportGap;
        list.style.top = below >= Math.min(listHeight, 280) || below >= above
          ? `${rect.bottom + 6}px`
          : `${Math.max(viewportGap, rect.top - listHeight - 6)}px`;
      }

      function syncOptions() {
        list.innerHTML = '';
        Array.from(select.options).forEach(option => {
          const item = document.createElement('button');
          item.type = 'button';
          item.className = 'custom-select-option';
          item.dataset.value = option.value;
          item.textContent = option.textContent;
          item.setAttribute('role', 'option');
          item.setAttribute('aria-selected', option.selected ? 'true' : 'false');
          item.disabled = option.disabled;
          item.addEventListener('click', () => {
            if (option.disabled) return;
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            close();
          });
          list.appendChild(item);
        });
        const selected = select.options[select.selectedIndex];
        trigger.innerHTML = `<span>${escapeHtml(selected ? selected.textContent : 'Select an option')}</span><i class="fa-solid fa-chevron-down" aria-hidden="true"></i>`;
        list.querySelectorAll('.custom-select-option').forEach(item => {
          item.setAttribute('aria-selected', item.dataset.value === select.value ? 'true' : 'false');
        });
      }

      trigger.addEventListener('click', e => {
        e.preventDefault();
        const open = !wrapper.classList.contains('is-open');
        document.querySelectorAll('.custom-select.is-open').forEach(el => el.classList.remove('is-open'));
        document.querySelectorAll('.custom-select-options.is-visible').forEach(el => el.classList.remove('is-visible'));
        document.querySelectorAll('.custom-select-trigger[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        if (open) {
          wrapper.classList.add('is-open');
          list.classList.add('is-visible');
          trigger.setAttribute('aria-expanded', 'true');
          position();
        }
      });
      trigger.addEventListener('position-custom-select', position);
      select.addEventListener('change', syncOptions);
      new MutationObserver(syncOptions).observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'selected'] });
      syncOptions();
    });

    if (!document.body.dataset.customSelectEvents) {
      document.body.dataset.customSelectEvents = 'true';
      document.addEventListener('click', e => {
        if (!e.target.closest('.custom-select')) {
          document.querySelectorAll('.custom-select.is-open').forEach(el => el.classList.remove('is-open'));
          document.querySelectorAll('.custom-select-options.is-visible').forEach(el => el.classList.remove('is-visible'));
          document.querySelectorAll('.custom-select-trigger[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        }
      });
      document.addEventListener('pointerdown', e => {
        if (!e.target.closest('.custom-select') && !e.target.closest('.custom-select-options')) {
          document.querySelectorAll('.custom-select.is-open').forEach(el => el.classList.remove('is-open'));
          document.querySelectorAll('.custom-select-options.is-visible').forEach(el => el.classList.remove('is-visible'));
          document.querySelectorAll('.custom-select-trigger[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          document.querySelectorAll('.custom-select.is-open').forEach(el => el.classList.remove('is-open'));
          document.querySelectorAll('.custom-select-options.is-visible').forEach(el => el.classList.remove('is-visible'));
          document.querySelectorAll('.custom-select-trigger[aria-expanded="true"]').forEach(el => el.setAttribute('aria-expanded', 'false'));
        }
      });
      window.addEventListener('resize', () => document.querySelectorAll('.custom-select.is-open').forEach(el => {
        const trigger = el.querySelector('.custom-select-trigger');
        if (trigger) trigger.dispatchEvent(new Event('position-custom-select'));
      }));
      window.addEventListener('scroll', () => document.querySelectorAll('.custom-select.is-open').forEach(el => {
        const trigger = el.querySelector('.custom-select-trigger');
        if (trigger) trigger.dispatchEvent(new Event('position-custom-select'));
      }), { passive: true });
    }
  }

  /* ---------- toast feedback ---------- */

  function toast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.setAttribute('role', 'status');
    const icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      info: 'fa-circle-info',
      warning: 'fa-triangle-exclamation'
    };
    el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast-show'));
    setTimeout(() => {
      el.classList.remove('toast-show');
      setTimeout(() => el.remove(), 400);
    }, duration);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  /* ---------- button loading state ---------- */

  function setLoading(btn, isLoading, loadingText) {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.origText = btn.innerHTML;
      btn.disabled = true;
      btn.classList.add('btn-loading');
      btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${loadingText || 'Please wait…'}`;
    } else {
      btn.disabled = false;
      btn.classList.remove('btn-loading');
      btn.innerHTML = btn.dataset.origText || btn.innerHTML;
    }
  }

  /* ---------- modal helpers (used across pages) ---------- */

  function openModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.add('active');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    const focusable = m.querySelector('button, [href], input, select, textarea');
    if (focusable) focusable.focus();
  }

  function closeModal(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('active');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function bindModalClose() {
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.dataset.closeModal));
    });
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', e => {
        if (e.target === modal) closeModal(modal.id);
      });
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(m => closeModal(m.id));
      }
    });
  }

  /* ---------- confirm dialog (promise based) ---------- */

  function confirmDialog(message, title) {
    return new Promise(resolve => {
      let overlay = document.getElementById('confirm-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.className = 'modal active';
        overlay.setAttribute('aria-hidden', 'false');
        overlay.innerHTML = `
          <div class="modal-box modal-sm" role="alertdialog" aria-modal="true">
            <div class="modal-icon"><i class="fa-solid fa-circle-question"></i></div>
            <h3 class="modal-title" id="confirm-title"></h3>
            <p class="modal-text" id="confirm-msg"></p>
            <div class="modal-actions">
              <button class="btn btn-outline" id="confirm-no">Cancel</button>
              <button class="btn btn-primary" id="confirm-yes">Confirm</button>
            </div>
          </div>`;
        document.body.appendChild(overlay);
      }
      overlay.querySelector('#confirm-msg').textContent = message;
      overlay.querySelector('#confirm-title').textContent = title || 'Please confirm';
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      const yes = overlay.querySelector('#confirm-yes');
      const no = overlay.querySelector('#confirm-no');

      function cleanup(result) {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        yes.removeEventListener('click', onYes);
        no.removeEventListener('click', onNo);
        resolve(result);
      }
      function onYes() { cleanup(true); }
      function onNo() { cleanup(false); }
      yes.addEventListener('click', onYes);
      no.addEventListener('click', onNo);
    });
  }

  return {
    patterns, isEmpty, isEmail, isPhone, isStrongPassword,
    isFutureDate, dateAfter, nightsBetween, isPositiveInt,
    setFieldError, clearFieldError, clearAllErrors,
    toast, escapeHtml, setLoading, bindCustomSelects,
    openModal, closeModal, bindModalClose, confirmDialog
  };
})();

document.addEventListener('DOMContentLoaded', () => StacklyValidate.bindCustomSelects());
