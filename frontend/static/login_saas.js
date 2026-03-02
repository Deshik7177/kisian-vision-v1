// login_saas.js – Farmer Login Page (v1)

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  function getEnteredPIN() {
    const p1 = $('pin-1')?.value || '';
    const p2 = $('pin-2')?.value || '';
    const p3 = $('pin-3')?.value || '';
    const p4 = $('pin-4')?.value || '';
    return p1 + p2 + p3 + p4;
  }

  function clearPINInputs() {
    for (let i = 1; i <= 4; i++) {
      const input = $(`pin-${i}`);
      if (input) input.value = '';
    }
    $('pin-1')?.focus();
  }

  function showError(msg) {
    const errorEl = $('login-error');
    if (errorEl) {
      errorEl.textContent = msg;
      errorEl.classList.remove('hidden');
    }
  }

  function hideError() {
    const errorEl = $('login-error');
    if (errorEl) {
      errorEl.classList.add('hidden');
    }
  }

  function setupPINInputs() {
    const inputs = [1, 2, 3, 4].map(i => $(`pin-${i}`));
    
    inputs.forEach((input, idx) => {
      if (!input) return;
      
      // Auto-focus next input on entry
      input.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val && idx < 3) {
          inputs[idx + 1]?.focus();
        }
      });
      
      // Handle backspace to go to previous
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !input.value && idx > 0) {
          inputs[idx - 1]?.focus();
        }
      });
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    hideError();

    const farmerName = $('farmer-name')?.value?.trim();
    const pin = getEnteredPIN();

    if (!farmerName) {
      showError('Please enter your name');
      $('farmer-name')?.focus();
      return;
    }

    if (pin.length !== 4) {
      showError('Please enter your 4-digit PIN');
      $('pin-1')?.focus();
      return;
    }

    const loginBtn = $('login-btn');
    if (loginBtn) {
      loginBtn.disabled = true;
      loginBtn.textContent = '⏳ Logging in...';
    }

    try {
      const res = await fetch('/farmer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farmer_name: farmerName,
          pin: pin,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Login failed');
      }

      const data = await res.json();
      
      // Store farmer info in localStorage
      localStorage.setItem('last_farmer_id', String(data.farmer.id));
      localStorage.setItem('last_farmer_name', data.farmer.farmer_name);
      localStorage.setItem('farmer_logged_in', '1');

      // Redirect to home
      window.location.href = '/';

    } catch (err) {
      console.error('[Login] Error:', err);
      showError(err.message || 'Invalid name or PIN. Please try again.');
      clearPINInputs();
    } finally {
      if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.textContent = '🔓 Login';
      }
    }
  }

  function checkAlreadyLoggedIn() {
    const loggedIn = localStorage.getItem('farmer_logged_in') === '1';
    const farmerId = localStorage.getItem('last_farmer_id');
    
    if (loggedIn && farmerId) {
      // Already logged in, redirect to home
      window.location.href = '/';
    }
  }

  function init() {
    // Check if already logged in
    checkAlreadyLoggedIn();

    // Setup PIN inputs
    setupPINInputs();

    // Handle form submission
    const form = $('login-form');
    if (form) {
      form.addEventListener('submit', handleLogin);
    }

    // Focus name input
    $('farmer-name')?.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
