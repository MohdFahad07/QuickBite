/* ============================================================
   QuickBite Authentication UI Script
   Handles Login & Sign Up Modals, User Session, and Navbar State
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  injectAuthModalHTML();
  initNavbarAuth();

  // Enforce Copyright Year 2024 across all pages
  document.querySelectorAll('.footer-year').forEach(el => el.textContent = '2024');

  // Listen for auth state changes
  window.addEventListener('authStateChanged', () => {
    updateNavbarUserUI();
    autoFillCheckoutDetails();
  });

  // Verify stored session on page load
  if (window.API && window.API.getToken()) {
    window.API.getMe().then(user => {
      updateNavbarUserUI();
      autoFillCheckoutDetails();
    }).catch(err => {
      console.warn('Session expired or invalid:', err.message);
      window.API.logout();
    });
  }
});

// Disposable domain set for quick client-side check
const DISPOSABLE_EMAIL_DOMAINS = new Set([
  'tempmail.com', 'temp-mail.org', 'mailinator.com', '10minutemail.com',
  'guerrillamail.com', 'trashmail.com', 'throwawaymail.com', 'yopmail.com',
  'sharklasers.com', 'dispostable.com', 'getnada.com', 'maildrop.cc',
  'crazymailing.com', 'tmailor.com', 'disposablemail.com', 'generator.email',
  'emailondeck.com', 'tempmail.net', 'fakemailgenerator.com', 'mohmal.com',
  'tempmailo.com', 'boun.cr', 'burnermail.io', 'mailsac.com', 'dropmail.me',
  'inboxkitten.com', 'nada.ltd', 'mytemp.email', 'tempinbox.com', 'mailcatch.com'
]);

let pendingSignupData = null;

// ---- Inject Modal HTML into DOM ----
function injectAuthModalHTML() {
  if (document.getElementById('authModal')) return;

  const modalDiv = document.createElement('div');
  modalDiv.id = 'authModal';
  modalDiv.className = 'auth-modal-overlay';
  modalDiv.innerHTML = `
    <div class="auth-modal-card">
      <button class="auth-close-btn" onclick="closeAuthModal()" title="Close">&times;</button>
      
      <div class="auth-brand-header">
        <div class="auth-brand-logo"><i class="fas fa-bolt"></i> Quick<span>Bite</span></div>
        <p class="auth-brand-subtitle">Order delicious food &amp; track deliveries live!</p>
      </div>

      <!-- Auth Tab Switches -->
      <div class="auth-tabs-row" id="authTabsRow">
        <button id="tabLoginBtn" class="auth-tab-btn active" onclick="switchAuthTab('login')">
          <i class="fas fa-right-to-bracket"></i> Login
        </button>
        <button id="tabSignupBtn" class="auth-tab-btn" onclick="switchAuthTab('signup')">
          <i class="fas fa-user-plus"></i> Sign Up
        </button>
      </div>

      <div id="authAlertMsg" class="auth-alert-box" style="display:none;"></div>

      <!-- LOGIN FORM -->
      <form id="loginForm" onsubmit="handleLoginSubmit(event)" class="auth-form-panel active">
        <div class="auth-field-group">
          <label><i class="fas fa-envelope"></i> Email Address / Admin ID</label>
          <input type="text" id="loginEmail" placeholder="e.g. admin123 or user@example.com" required autocomplete="username" />
        </div>
        <div class="auth-field-group">
          <label><i class="fas fa-lock"></i> Password</label>
          <input type="password" id="loginPassword" placeholder="••••••••" required autocomplete="current-password" />
        </div>
        <button type="submit" id="loginSubmitBtn" class="btn-auth-submit">
          <i class="fas fa-arrow-right-to-bracket"></i> Login to Account
        </button>
      </form>

      <!-- SIGNUP FORM -->
      <form id="signupForm" onsubmit="handleSignupSubmit(event)" class="auth-form-panel">
        <div class="auth-field-group">
          <label><i class="fas fa-user"></i> Full Name</label>
          <input type="text" id="signupName" placeholder="e.g. Mohd Fahad" required autocomplete="name" />
        </div>
        <div class="auth-field-group">
          <label><i class="fas fa-envelope"></i> Email Address</label>
          <input type="email" id="signupEmail" placeholder="e.g. fahad@example.com" required autocomplete="email" />
        </div>
        <div class="auth-field-group">
          <label><i class="fas fa-lock"></i> Password (min 6 characters)</label>
          <input type="password" id="signupPassword" placeholder="••••••••" minlength="6" required autocomplete="new-password" />
        </div>
        <div class="auth-field-group">
          <label><i class="fas fa-phone"></i> Mobile Phone</label>
          <input type="tel" id="signupPhone" placeholder="+91 98765 43210" autocomplete="tel" />
        </div>
        <div class="auth-field-group">
          <label><i class="fas fa-location-dot"></i> Delivery Address</label>
          <input type="text" id="signupAddress" placeholder="House no, Street, City..." autocomplete="street-address" />
        </div>
        <button type="submit" id="signupSubmitBtn" class="btn-auth-submit">
          <i class="fas fa-paper-plane"></i> Verify Email &amp; Continue
        </button>
      </form>

      <!-- REDESIGNED OTP VERIFICATION FORM PANEL -->
      <form id="otpForm" onsubmit="handleOtpSubmit(event)" class="auth-form-panel">
        <div class="otp-header-card">
          <div class="otp-icon-pulse"><i class="fas fa-envelope-open-text"></i></div>
          <div class="otp-title">Verify Your Email</div>
          <div class="otp-subtitle">We've sent a 6-digit security code to<br/><span class="otp-target-email" id="otpEmailTarget">user@example.com</span></div>
        </div>

        <div class="otp-digits-container" id="otpBoxesGroup">
          <input type="text" maxlength="1" class="otp-digit-box" data-index="0" inputmode="numeric" pattern="[0-9]" />
          <input type="text" maxlength="1" class="otp-digit-box" data-index="1" inputmode="numeric" pattern="[0-9]" />
          <input type="text" maxlength="1" class="otp-digit-box" data-index="2" inputmode="numeric" pattern="[0-9]" />
          <input type="text" maxlength="1" class="otp-digit-box" data-index="3" inputmode="numeric" pattern="[0-9]" />
          <input type="text" maxlength="1" class="otp-digit-box" data-index="4" inputmode="numeric" pattern="[0-9]" />
          <input type="text" maxlength="1" class="otp-digit-box" data-index="5" inputmode="numeric" pattern="[0-9]" />
        </div>

        <button type="submit" id="otpSubmitBtn" class="btn-auth-submit">
          <i class="fas fa-user-check"></i> Verify &amp; Create Account
        </button>

        <div class="otp-actions-row">
          <button type="button" id="resendOtpBtn" class="otp-resend-btn" onclick="handleResendOtp()">
            <i class="fas fa-rotate"></i> <span id="resendBtnText">Resend Code</span>
          </button>
          <button type="button" class="otp-edit-btn" onclick="cancelOtpVerification()">
            <i class="fas fa-pen"></i> Change Email
          </button>
        </div>
      </form>

      <div class="auth-footer-text">
        🔒 Encrypted &amp; Secured with MySQL &amp; JWT Token Authentication
      </div>
    </div>
  `;

  document.body.appendChild(modalDiv);
  initOtpInputListeners();

  modalDiv.addEventListener('click', function(e) {
    if (e.target === this) closeAuthModal();
  });
}

// 6-Digit Auto-Focus & Paste Helper
function initOtpInputListeners() {
  const container = document.getElementById('otpBoxesGroup');
  if (!container) return;
  const boxes = container.querySelectorAll('.otp-digit-box');

  boxes.forEach((box, idx) => {
    box.addEventListener('input', (e) => {
      const val = e.target.value.replace(/[^0-9]/g, '');
      e.target.value = val;

      if (val) {
        box.classList.add('filled');
        if (idx < boxes.length - 1) {
          boxes[idx + 1].focus();
        }
      } else {
        box.classList.remove('filled');
      }
    });

    box.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !box.value && idx > 0) {
        boxes[idx - 1].focus();
      }
    });

    box.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasted = (e.clipboardData || window.clipboardData).getData('text').replace(/[^0-9]/g, '').slice(0, 6);
      if (pasted) {
        pasted.split('').forEach((digit, i) => {
          if (boxes[i]) {
            boxes[i].value = digit;
            boxes[i].classList.add('filled');
          }
        });
        if (boxes[Math.min(pasted.length, 5)]) {
          boxes[Math.min(pasted.length, 5)].focus();
        }
      }
    });
  });
}

function getEnteredOtpCode() {
  const container = document.getElementById('otpBoxesGroup');
  if (!container) return '';
  const boxes = container.querySelectorAll('.otp-digit-box');
  let code = '';
  boxes.forEach(b => code += (b.value || ''));
  return code;
}

function clearOtpDigitBoxes() {
  const container = document.getElementById('otpBoxesGroup');
  if (!container) return;
  const boxes = container.querySelectorAll('.otp-digit-box');
  boxes.forEach(b => {
    b.value = '';
    b.classList.remove('filled');
  });
}

let resendTimerInterval = null;
function startResendCountdown(seconds = 30) {
  const btn = document.getElementById('resendOtpBtn');
  const txt = document.getElementById('resendBtnText');
  if (!btn || !txt) return;

  btn.disabled = true;
  let remaining = seconds;
  txt.textContent = `Resend in ${remaining}s`;

  if (resendTimerInterval) clearInterval(resendTimerInterval);
  resendTimerInterval = setInterval(() => {
    remaining--;
    if (remaining <= 0) {
      clearInterval(resendTimerInterval);
      btn.disabled = false;
      txt.textContent = 'Resend Code';
    } else {
      txt.textContent = `Resend in ${remaining}s`;
    }
  }, 1000);
}

// ---- Switch Login / Signup Tabs ----
function switchAuthTab(tab) {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const otpForm = document.getElementById('otpForm');
  const loginBtn = document.getElementById('tabLoginBtn');
  const signupBtn = document.getElementById('tabSignupBtn');
  const tabsRow = document.getElementById('authTabsRow');
  const alertBox = document.getElementById('authAlertMsg');

  if (alertBox) alertBox.style.display = 'none';
  if (tabsRow) tabsRow.style.display = 'flex';
  if (otpForm) otpForm.classList.remove('active');

  if (tab === 'login') {
    loginForm.classList.add('active');
    signupForm.classList.remove('active');
    loginBtn.classList.add('active');
    signupBtn.classList.remove('active');
  } else {
    signupForm.classList.add('active');
    loginForm.classList.remove('active');
    signupBtn.classList.add('active');
    loginBtn.classList.remove('active');
  }
}

function openAuthModal(defaultTab = 'login') {
  injectAuthModalHTML();
  switchAuthTab(defaultTab);
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

function showAuthAlert(msg, isError = true) {
  const alertBox = document.getElementById('authAlertMsg');
  if (!alertBox) return;
  alertBox.className = `auth-alert-box ${isError ? 'error' : 'success'}`;
  alertBox.textContent = msg;
  alertBox.style.display = 'block';
}

// ---- Form Handlers ----
async function handleLoginSubmit(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const btn = document.getElementById('loginSubmitBtn');

  if (!email || !password) return;

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

  try {
    const res = await window.API.login({ email, password });
    const isAdmin = res.user && res.user.role === 'admin';
    showAuthAlert(res.message || (isAdmin ? '👑 Admin Login Verified!' : 'Login successful!'), false);
    if (typeof showToast === 'function') {
      showToast(isAdmin ? `👑 Welcome Admin ${res.user.name}!` : `👋 Welcome back, ${res.user.name}!`);
    }

    setTimeout(() => {
      closeAuthModal();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Login to Account';
      const loginForm = document.getElementById('loginForm');
      if (loginForm) loginForm.reset();

      if (isAdmin) {
        window.location.href = 'admin.html';
      }
    }, 800);
  } catch (err) {
    showAuthAlert(err.message || 'Invalid email or password', true);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-arrow-right-to-bracket"></i> Login to Account';
  }
}

// Client-side disposable email check
function checkDisposableDomain(email) {
  if (!email || !email.includes('@')) return false;
  const parts = email.toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];

  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  const suspicious = ['temp', 'disposable', 'trash', 'fake', 'burner', 'throwaway', '10min', 'guerrilla'];
  return suspicious.some(p => domain.includes(p));
}

// Step 1: Submit Signup Form -> Request Email Verification OTP
async function handleSignupSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim().toLowerCase();
  const password = document.getElementById('signupPassword').value;
  const phone = document.getElementById('signupPhone').value.trim();
  const address = document.getElementById('signupAddress').value.trim();
  const btn = document.getElementById('signupSubmitBtn');

  if (!name || !email || !password) return;

  if (checkDisposableDomain(email)) {
    showAuthAlert('🚫 Temporary / disposable email addresses are strictly prohibited. Please use a valid email address (e.g. Gmail, Outlook, Yahoo).', true);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';

  pendingSignupData = { name, email, password, phone, address };

  try {
    const res = await window.API.sendOTP(pendingSignupData);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Verify Email &amp; Continue';

    // Transition to OTP Verification Panel
    document.getElementById('signupForm').classList.remove('active');
    document.getElementById('loginForm').classList.remove('active');
    document.getElementById('authTabsRow').style.display = 'none';
    document.getElementById('otpForm').classList.add('active');

    document.getElementById('otpEmailTarget').textContent = email;
    clearOtpDigitBoxes();

    if (res.otpDemo) {
      // Auto-fill demo OTP for convenience
      const digits = res.otpDemo.split('');
      const container = document.getElementById('otpBoxesGroup');
      if (container) {
        const boxes = container.querySelectorAll('.otp-digit-box');
        digits.forEach((d, i) => {
          if (boxes[i]) {
            boxes[i].value = d;
            boxes[i].classList.add('filled');
          }
        });
      }
      showAuthAlert(`📩 Verification OTP generated! (Demo Code: ${res.otpDemo})`, false);
    } else {
      showAuthAlert(`📩 Real verification code sent to ${email}! Please check your email inbox/spam folder.`, false);
    }

    startResendCountdown(30);

    const firstBox = document.querySelector('.otp-digit-box[data-index="0"]');
    if (firstBox) firstBox.focus();
  } catch (err) {
    showAuthAlert(err.message || 'Failed to send verification code', true);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-paper-plane"></i> Verify Email &amp; Continue';
  }
}

// Step 2: Submit OTP Verification Form
async function handleOtpSubmit(e) {
  e.preventDefault();
  if (!pendingSignupData) return;

  const otp = getEnteredOtpCode();
  const btn = document.getElementById('otpSubmitBtn');

  if (!otp || otp.length !== 6) {
    showAuthAlert('Please enter the complete 6-digit verification code', true);
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

  try {
    const res = await window.API.verifyOTPAndSignup({ email: pendingSignupData.email, otp });
    showAuthAlert(res.message || '✅ Email verified & Account Created!', false);
    if (typeof showToast === 'function') showToast(`🎉 Email Verified! Welcome ${res.user.name}`);

    setTimeout(() => {
      closeAuthModal();
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-check"></i> Verify &amp; Create Account';
      document.getElementById('signupForm').reset();
      document.getElementById('otpForm').reset();
      clearOtpDigitBoxes();
      pendingSignupData = null;
    }, 800);
  } catch (err) {
    showAuthAlert(err.message || 'Invalid 6-digit OTP code', true);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-check"></i> Verify &amp; Create Account';
  }
}

async function handleResendOtp() {
  if (!pendingSignupData) return;
  showAuthAlert('🔄 Resending OTP verification code...', false);
  try {
    const res = await window.API.sendOTP(pendingSignupData);
    clearOtpDigitBoxes();
    if (res.otpDemo) {
      const digits = res.otpDemo.split('');
      const container = document.getElementById('otpBoxesGroup');
      if (container) {
        const boxes = container.querySelectorAll('.otp-digit-box');
        digits.forEach((d, i) => {
          if (boxes[i]) {
            boxes[i].value = d;
            boxes[i].classList.add('filled');
          }
        });
      }
      showAuthAlert(`📩 New OTP code generated! (Demo Code: ${res.otpDemo})`, false);
    } else {
      showAuthAlert(`📩 New verification code sent to ${pendingSignupData.email}! Check your inbox.`, false);
    }
    startResendCountdown(30);
  } catch (err) {
    showAuthAlert(err.message || 'Failed to resend OTP', true);
  }
}

function cancelOtpVerification() {
  document.getElementById('otpForm').classList.remove('active');
  document.getElementById('signupForm').classList.add('active');
  document.getElementById('authTabsRow').style.display = 'flex';
  const alertBox = document.getElementById('authAlertMsg');
  if (alertBox) alertBox.style.display = 'none';
}

// ---- Navbar UI Management ----
function initNavbarAuth() {
  updateNavbarUserUI();
}

function updateNavbarUserUI() {
  const user = window.API ? window.API.getUser() : null;
  const navContainer = document.getElementById('navUserSlot');

  if (!navContainer) return;

  if (user) {
    if (user.role === 'admin') {
      navContainer.innerHTML = `
        <div class="user-nav-badge admin-nav-badge" title="${user.email}">
          <div class="user-avatar-circle" style="background:#e65c00;"><i class="fas fa-crown"></i></div>
          <a href="admin.html" class="user-nav-name" style="color:#ffa07a;text-decoration:none;font-weight:700;margin:0 4px;">Admin Panel</a>
          <button onclick="handleUserLogout()" class="btn-user-logout" title="Logout">
            <i class="fas fa-power-off"></i>
          </button>
        </div>
      `;
    } else {
      const initial = (user.name || 'U').charAt(0).toUpperCase();
      navContainer.innerHTML = `
        <div class="user-nav-badge" title="${user.email}">
          <div class="user-avatar-circle">${initial}</div>
          <span class="user-nav-name">${escapeHtml(user.name.split(' ')[0])}</span>
          <button onclick="handleUserLogout()" class="btn-user-logout" title="Logout">
            <i class="fas fa-power-off"></i>
          </button>
        </div>
      `;
    }
  } else {
    navContainer.innerHTML = `
      <button onclick="openAuthModal('login')" class="btn-nav-login">
        <i class="fas fa-right-to-bracket"></i> Login
      </button>
    `;
  }
}

function handleUserLogout() {
  if (confirm('Are you sure you want to log out?')) {
    if (window.API) window.API.logout();
    if (typeof showToast === 'function') showToast('👋 Logged out successfully');
  }
}

// ---- Auto-fill checkout fields on Cart Page ----
function autoFillCheckoutDetails() {
  const user = window.API ? window.API.getUser() : null;
  if (!user) return;

  const custName = document.getElementById('custName');
  const custPhone = document.getElementById('custPhone');
  const custAddress = document.getElementById('custAddress');

  if (custName && !custName.value) custName.value = user.name || '';
  if (custPhone && !custPhone.value) custPhone.value = user.phone || '';
  if (custAddress && !custAddress.value) custAddress.value = user.address || '';
}
