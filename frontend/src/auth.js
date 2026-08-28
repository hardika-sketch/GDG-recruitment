import { 
  checkPasswordCriteria, 
  validateName, 
  validateEmail, 
  validatePhone, 
  validatePassword 
} from './validation.js';
import { societies } from './data.js';

let apiBaseUrl = 'http://localhost:5000';
let onAuthStateChange = null;
let currentMode = 'signin'; // 'signin' or 'signup'
let selectedRole = 'student'; // 'student' or 'recruiter'
let currentUser = null;

const STORAGE_USERS_KEY = 'se_local_users';
const STORAGE_CURRENT_USER_KEY = 'se_current_user';

// Helper to get local mock users database
function getLocalUsers() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_USERS_KEY)) || [];
  } catch {
    return [];
  }
}

// Helper to save a mock user locally
function saveLocalUser(user) {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
}

// Check if user is logged in on startup
export function loadCurrentUser() {
  try {
    const saved = localStorage.getItem(STORAGE_CURRENT_USER_KEY);
    if (saved) {
      currentUser = JSON.parse(saved);
      return currentUser;
    }
  } catch (e) {
    console.error('Error loading current user', e);
  }
  return null;
}

export function getCurrentUser() {
  return currentUser;
}

// Initialize Auth
export function initAuth(apiUrl, stateChangeCallback) {
  apiBaseUrl = apiUrl;
  onAuthStateChange = stateChangeCallback;
  
  loadCurrentUser();
  setupUI();
}

function setupUI() {
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  const authOverlay = document.getElementById('auth-overlay');
  
  updateHeaderButton();

  // Click on "Sign In" button in header
  authToggleBtn.addEventListener('click', () => {
    if (currentUser) {
      // User is logged in. Click acts as sign-out
      if (confirm('Are you sure you want to Sign Out?')) {
        logout();
      }
    } else {
      // Open Auth modal
      openAuthModal();
    }
  });

  // Close overlay on click outside card
  authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) {
      closeAuthModal();
    }
  });
}

function updateHeaderButton() {
  const authToggleBtn = document.getElementById('auth-toggle-btn');
  if (!authToggleBtn) return;
  
  if (currentUser) {
    authToggleBtn.classList.add('logged-in');
    const isRecruiter = currentUser.role === 'recruiter';
    const subText = isRecruiter ? `Recruiter: ${currentUser.name.split(' ')[0]}` : currentUser.name.split(' ')[0];
    authToggleBtn.title = `Logged in as ${currentUser.name} (Click to Sign Out)`;
    authToggleBtn.innerHTML = `
      <i data-lucide="log-out"></i>
      <span>Log Out (${subText})</span>
    `;
  } else {
    authToggleBtn.classList.remove('logged-in');
    authToggleBtn.title = "Sign In or Register";
    authToggleBtn.innerHTML = `
      <i data-lucide="user"></i>
      <span>Sign In</span>
    `;
  }
  if (window.lucide) window.lucide.createIcons();
}

function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_CURRENT_USER_KEY);
  updateHeaderButton();
  if (onAuthStateChange) {
    onAuthStateChange(null);
  }
}

function openAuthModal() {
  currentMode = 'signin';
  selectedRole = 'student';
  const authOverlay = document.getElementById('auth-overlay');
  authOverlay.classList.add('active');
  renderForm();
}

function closeAuthModal() {
  const authOverlay = document.getElementById('auth-overlay');
  authOverlay.classList.remove('active');
  authOverlay.innerHTML = '';
}

function renderForm() {
  const authOverlay = document.getElementById('auth-overlay');
  if (!authOverlay) return;

  const societyOptions = societies.map(s => `<option value="${s.id}">${s.name}</option>`).join('');

  if (currentMode === 'signin') {
    authOverlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Sign In</h2>
          <button class="close-btn" id="auth-close-btn" aria-label="Close authentication">
            <i data-lucide="x"></i>
          </button>
        </div>
        
        <!-- Role toggle Segment control -->
        <div class="segmented-control" id="auth-role-toggle">
          <button type="button" class="${selectedRole === 'student' ? 'active' : ''}" data-role="student">Student</button>
          <button type="button" class="${selectedRole === 'recruiter' ? 'active' : ''}" data-role="recruiter">Recruiter</button>
        </div>

        <form id="auth-signin-form" class="auth-form" novalidate>
          <div class="form-group" id="grp-login-identifier">
            <label for="login-identifier" class="form-label">Email or Phone Number</label>
            <input type="text" id="login-identifier" class="form-input" placeholder="e.g. john@example.com or +919876543210" required />
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>
          <div class="form-group" id="grp-login-password">
            <label for="login-password" class="form-label">Password</label>
            <input type="password" id="login-password" class="form-input" placeholder="Enter your password" required />
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>

          <div id="auth-error-banner" class="error-msg" style="display: none; padding: 10px 14px; border: 1px solid var(--error); background: rgba(var(--error-rgb), 0.08);">
            <i data-lucide="alert-triangle"></i>
            <span class="error-text" id="auth-error-text"></span>
          </div>

          <button type="submit" class="btn btn-primary" id="auth-submit-btn" style="width: 100%;">
            <span>Sign In</span>
          </button>

          <p class="auth-switch-mode">
            Don't have an account? 
            <span class="auth-switch-link" id="auth-switch-btn">Sign Up</span>
          </p>
        </form>
      </div>
    `;
  } else {
    authOverlay.innerHTML = `
      <div class="auth-card">
        <div class="auth-header">
          <h2 class="auth-title">Sign Up</h2>
          <button class="close-btn" id="auth-close-btn" aria-label="Close authentication">
            <i data-lucide="x"></i>
          </button>
        </div>

        <!-- Role toggle Segment control -->
        <div class="segmented-control" id="auth-role-toggle">
          <button type="button" class="${selectedRole === 'student' ? 'active' : ''}" data-role="student">Student</button>
          <button type="button" class="${selectedRole === 'recruiter' ? 'active' : ''}" data-role="recruiter">Recruiter</button>
        </div>

        <form id="auth-signup-form" class="auth-form" novalidate>
          <div class="form-group" id="grp-signup-name">
            <label for="signup-name" class="form-label">Full Name</label>
            <input type="text" id="signup-name" class="form-input" placeholder="e.g. John Doe" required />
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>
          
          <div class="form-group" id="grp-signup-email">
            <label for="signup-email" class="form-label">Email Address</label>
            <input type="email" id="signup-email" class="form-input" placeholder="e.g. john@example.com" required />
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>

          <div class="form-group" id="grp-signup-phone">
            <label for="signup-phone" class="form-label">Phone Number</label>
            <input type="tel" id="signup-phone" class="form-input" placeholder="e.g. +919876543210" required />
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>

          <div class="form-group" id="grp-signup-society" style="display: ${selectedRole === 'recruiter' ? 'flex' : 'none'};">
            <label for="signup-society" class="form-label">Head of Society</label>
            <select id="signup-society" class="form-select" required>
              <option value="" disabled selected>Select Society</option>
              ${societyOptions}
            </select>
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>

          <div class="form-group" id="grp-signup-password">
            <label for="signup-password" class="form-label">Password</label>
            <input type="password" id="signup-password" class="form-input" placeholder="Create a strong password" required />
            
            <!-- Real-time ticks password checklist -->
            <div class="password-checklist">
              <div class="checklist-item" id="chk-length">
                <div class="icon-wrapper"><i data-lucide="check" style="width: 8px; height: 8px;"></i></div>
                <span>Min 8 characters</span>
              </div>
              <div class="checklist-item" id="chk-upper">
                <div class="icon-wrapper"><i data-lucide="check" style="width: 8px; height: 8px;"></i></div>
                <span>At least 1 uppercase letter</span>
              </div>
              <div class="checklist-item" id="chk-lower">
                <div class="icon-wrapper"><i data-lucide="check" style="width: 8px; height: 8px;"></i></div>
                <span>At least 1 lowercase letter</span>
              </div>
              <div class="checklist-item" id="chk-number">
                <div class="icon-wrapper"><i data-lucide="check" style="width: 8px; height: 8px;"></i></div>
                <span>At least 1 number</span>
              </div>
              <div class="checklist-item" id="chk-special">
                <div class="icon-wrapper"><i data-lucide="check" style="width: 8px; height: 8px;"></i></div>
                <span>At least 1 special char</span>
              </div>
            </div>
            
            <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
          </div>

          <div id="auth-error-banner" class="error-msg" style="display: none; padding: 10px 14px; border: 1px solid var(--error); background: rgba(var(--error-rgb), 0.08);">
            <i data-lucide="alert-triangle"></i>
            <span class="error-text" id="auth-error-text"></span>
          </div>

          <button type="submit" class="btn btn-primary" id="auth-submit-btn" style="width: 100%;">
            <span>Sign Up</span>
          </button>

          <p class="auth-switch-mode">
            Already have an account? 
            <span class="auth-switch-link" id="auth-switch-btn">Sign In</span>
          </p>
        </form>
      </div>
    `;

    // Hook up dynamic checklist update
    const passwordInput = document.getElementById('signup-password');
    passwordInput.addEventListener('input', (e) => {
      updatePasswordChecklist(e.target.value);
    });
  }

  // Common bindings
  document.getElementById('auth-close-btn').addEventListener('click', closeAuthModal);
  
  // Segmented role switch binding
  const roleToggle = document.getElementById('auth-role-toggle');
  roleToggle.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      roleToggle.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedRole = btn.dataset.role;
      
      const societyGroup = document.getElementById('grp-signup-society');
      if (societyGroup) {
        if (selectedRole === 'recruiter') {
          societyGroup.style.display = 'flex';
        } else {
          societyGroup.style.display = 'none';
        }
      }
    });
  });

  document.getElementById('auth-switch-btn').addEventListener('click', () => {
    currentMode = currentMode === 'signin' ? 'signup' : 'signin';
    renderForm();
  });

  const form = document.getElementById(currentMode === 'signin' ? 'auth-signin-form' : 'auth-signup-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (currentMode === 'signin') {
      handleSignIn(form);
    } else {
      handleSignUp(form);
    }
  });

  if (window.lucide) window.lucide.createIcons();
}

// Helper to validate password criteria in real-time
function updatePasswordChecklist(password) {
  const criteria = checkPasswordCriteria(password);
  
  toggleChecklistItem('chk-length', criteria.minLength);
  toggleChecklistItem('chk-upper', criteria.hasUpper);
  toggleChecklistItem('chk-lower', criteria.hasLower);
  toggleChecklistItem('chk-number', criteria.hasNumber);
  toggleChecklistItem('chk-special', criteria.hasSpecial);
}

function toggleChecklistItem(id, isValid) {
  const el = document.getElementById(id);
  if (!el) return;
  if (isValid) {
    el.classList.add('valid');
  } else {
    el.classList.remove('valid');
  }
}

// Form submissions
async function handleSignIn(form) {
  const identifier = document.getElementById('login-identifier').value.trim();
  const password = document.getElementById('login-password').value;
  const errorBanner = document.getElementById('auth-error-banner');
  const errorText = document.getElementById('auth-error-text');
  const submitBtn = document.getElementById('auth-submit-btn');
  
  errorBanner.style.display = 'none';
  
  let hasErrors = false;
  if (!identifier) {
    showInputError('grp-login-identifier', 'Email or phone number is required.');
    hasErrors = true;
  } else {
    hideInputError('grp-login-identifier');
  }

  if (!password) {
    showInputError('grp-login-password', 'Password is required.');
    hasErrors = true;
  } else {
    hideInputError('grp-login-password');
  }

  if (hasErrors) return;

  setLoadingState(submitBtn, true, 'Signing In...');

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password, role: selectedRole })
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to sign in.');
    }

    loginUser(result.user);
    closeAuthModal();
  } catch (err) {
    console.warn('Backend authentication failed, checking local storage:', err.message);
    
    // Check local fallback
    const localUsers = getLocalUsers();
    const matchedUser = localUsers.find(
      u => (u.email.toLowerCase() === identifier.toLowerCase() || u.phone === identifier) 
        && u.password === password 
        && (u.role || 'student') === selectedRole
    );

    if (matchedUser) {
      loginUser({
        name: matchedUser.name,
        email: matchedUser.email,
        phone: matchedUser.phone,
        role: matchedUser.role || 'student',
        society: matchedUser.society || null
      });
      closeAuthModal();
    } else {
      // Show credentials mismatch error
      errorBanner.style.display = 'flex';
      errorText.textContent = `Invalid ${selectedRole} credentials or password.`;
      setLoadingState(submitBtn, false, 'Sign In');
    }
  }
}

async function handleSignUp(form) {
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;
  const societySelect = document.getElementById('signup-society');
  const society = selectedRole === 'recruiter' ? (societySelect ? societySelect.value : '') : null;
  
  const errorBanner = document.getElementById('auth-error-banner');
  const errorText = document.getElementById('auth-error-text');
  const submitBtn = document.getElementById('auth-submit-btn');

  errorBanner.style.display = 'none';

  // Perform full validation
  const errors = {
    name: validateName(name),
    email: validateEmail(email),
    phone: validatePhone(phone),
    password: validatePassword(password)
  };

  let hasErrors = false;
  Object.keys(errors).forEach(key => {
    const err = errors[key];
    const grpId = `grp-signup-${key}`;
    if (err) {
      showInputError(grpId, err);
      hasErrors = true;
    } else {
      hideInputError(grpId);
    }
  });

  if (selectedRole === 'recruiter' && !society) {
    showInputError('grp-signup-society', 'Recruiters must select their head society.');
    hasErrors = true;
  } else if (selectedRole === 'recruiter') {
    hideInputError('grp-signup-society');
  }

  if (hasErrors) return;

  setLoadingState(submitBtn, true, 'Registering...');

  const signupPayload = { name, email, phone, password, role: selectedRole, society };

  try {
    const response = await fetch(`${apiBaseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupPayload)
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to sign up.');
    }

    // Successfully saved on backend, sync locally too
    saveLocalUser(signupPayload);
    
    loginUser({ name, email, phone, role: selectedRole, society });
    closeAuthModal();
  } catch (err) {
    console.warn('Backend registration failed, saving locally:', err.message);
    
    // Check if email or phone is already taken locally
    const localUsers = getLocalUsers();
    const isEmailTaken = localUsers.some(u => u.email.toLowerCase() === email.toLowerCase());
    const isPhoneTaken = localUsers.some(u => u.phone === phone);

    if (isEmailTaken) {
      showInputError('grp-signup-email', 'Email address is already registered.');
      setLoadingState(submitBtn, false, 'Sign Up');
      return;
    }

    if (isPhoneTaken) {
      showInputError('grp-signup-phone', 'Phone number is already registered.');
      setLoadingState(submitBtn, false, 'Sign Up');
      return;
    }

    // Save and log in locally
    saveLocalUser(signupPayload);
    loginUser({ name, email, phone, role: selectedRole, society });
    closeAuthModal();
  }
}

function loginUser(user) {
  currentUser = user;
  localStorage.setItem(STORAGE_CURRENT_USER_KEY, JSON.stringify(user));
  updateHeaderButton();
  if (onAuthStateChange) {
    onAuthStateChange(user);
  }
}

function showInputError(groupId, msg) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.classList.add('has-error');
  grp.querySelector('.error-text').textContent = msg;
}

function hideInputError(groupId) {
  const grp = document.getElementById(groupId);
  if (!grp) return;
  grp.classList.remove('has-error');
}

function setLoadingState(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite; margin-right: 8px;">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      <span>${text}</span>
    `;
  } else {
    btn.innerHTML = `<span>${text}</span>`;
  }
}
