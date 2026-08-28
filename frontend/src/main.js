import './style.css';
import { societies as fallbackSocieties } from './data.js';
import { quizQuestions, getRecommendation } from './quiz.js';
import * as validator from './validation.js';
import { initAuth, getCurrentUser } from './auth.js';

// ─── API Configuration ──────────────────────────────────────────────────────
// In Vite production builds (Vercel), this reads from the VITE_API_URL env var.
// For local dev with server.js, it falls back to localhost:5000.
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : 'http://localhost:5000';

// ─── Application State ──────────────────────────────────────────────────────
let societies = [];           // Populated dynamically from API
let currentCategory = 'All';
let searchQuery = '';
let selectedSociety = null;
let drawerViewMode = 'details';
let currentQuizQuestionIndex = 0;
let quizAnswers = [];
let isSubmitting = false;     // Prevent double-submissions

// ─── DOM Elements Cache ─────────────────────────────────────────────────────
const societiesGrid = document.getElementById('societies-grid');
const searchBar = document.getElementById('search-bar');
const filtersContainer = document.getElementById('filters-container');
const emptyState = document.getElementById('empty-state');
const clearSearchBtn = document.getElementById('clear-search-btn');

const drawerOverlay = document.getElementById('drawer-overlay');
const detailsDrawer = document.getElementById('details-drawer');

const quizOverlay = document.getElementById('quiz-overlay');
const quizToggleBtn = document.getElementById('quiz-toggle-btn');
const recordsToggleBtn = document.getElementById('records-toggle-btn');

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const successDialog = document.getElementById('success-dialog');
const successDialogCloseBtn = document.getElementById('success-dialog-close-btn');

// ─── LocalStorage Application Records ──────────────────────────────────────
const STORAGE_KEY = 'se_applications';

function getSavedApplications() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch { return []; }
}

function saveApplication(record) {
  const records = getSavedApplications();
  records.unshift(record); // newest first
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function deleteApplication(id) {
  const records = getSavedApplications().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

// ─── Initialize Application ─────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Retrieve saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    toggleThemeIcons(true);
  }

  setupEventListeners();

  // Initialize Auth
  initAuth(API_BASE_URL, (user) => {
    console.log('Auth state changed:', user);
    handleAuthViewSwitch(user);
  });

  // Fetch societies from backend API dynamically
  await loadSocieties();

  // Apply role-based view routing on initial load (handles page refresh)
  handleAuthViewSwitch(getCurrentUser());
});

// ─── Dynamic Data Fetching ──────────────────────────────────────────────────
async function loadSocieties() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/societies`);

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();

    // Supabase returns snake_case columns; normalize to camelCase
    societies = data.map(s => {
      const fallback = fallbackSocieties.find(f => f.id === s.id);
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        tagline: s.tagline,
        icon: s.icon,
        description: s.description,
        criteria: s.criteria,
        roles: s.roles,
        customFields: fallback ? fallback.customFields : []
      };
    });

    console.log(`✅ Loaded ${societies.length} societies from API`);
  } catch (err) {
    console.warn('⚠️ Could not reach backend API. Using offline fallback data.', err.message);
    societies = [...fallbackSocieties];
  }

  renderFilters();
  renderSocieties();
}

// ─── Submit Application (API with localStorage fallback) ────────────────────
async function submitApplication(payload) {
  // Try the backend API first
  try {
    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.error || `Server error (${response.status})`);
    }

    const result = await response.json();

    // Also save locally for records tracking
    const record = {
      id: crypto.randomUUID(),
      ...payload,
      societyName: selectedSociety.name,
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      source: 'api'
    };
    saveApplication(record);

    return result;
  } catch (fetchErr) {
    // Backend unreachable — save to localStorage as fallback
    console.warn('⚠️ Backend unreachable, saving application locally:', fetchErr.message);

    const record = {
      id: crypto.randomUUID(),
      ...payload,
      societyName: selectedSociety.name,
      submittedAt: new Date().toISOString(),
      status: 'saved_locally',
      source: 'local'
    };
    saveApplication(record);

    return { success: true, message: 'Application saved locally', data: record };
  }
}

// ─── Event Listeners ────────────────────────────────────────────────────────
function setupEventListeners() {
  themeToggleBtn.addEventListener('click', toggleTheme);

  searchBar.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSocieties();
  });

  clearSearchBtn.addEventListener('click', resetFilters);

  drawerOverlay.addEventListener('click', () => {
    closeDrawer();
    closeQuiz();
  });

  quizToggleBtn.addEventListener('click', openQuiz);
  recordsToggleBtn.addEventListener('click', () => openDrawer(null, 'records'));

  successDialogCloseBtn.addEventListener('click', () => {
    successDialog.classList.remove('active');
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeQuiz();
      successDialog.classList.remove('active');
    }
  });
}

// ─── Theme Management ───────────────────────────────────────────────────────
function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  toggleThemeIcons(isLight);
}

function toggleThemeIcons(isLight) {
  const sunIcon = themeToggleBtn.querySelector('.sun-icon');
  const moonIcon = themeToggleBtn.querySelector('.moon-icon');
  if (isLight) {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  } else {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  }
}

// ─── Filter Badges ──────────────────────────────────────────────────────────
function renderFilters() {
  const categories = ['All', ...new Set(societies.map(s => s.category))];

  filtersContainer.innerHTML = '';
  categories.forEach(cat => {
    const badge = document.createElement('button');
    badge.className = `filter-badge ${cat === currentCategory ? 'active' : ''}`;
    badge.textContent = cat;
    badge.addEventListener('click', () => {
      currentCategory = cat;
      document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
      badge.classList.add('active');
      renderSocieties();
    });
    filtersContainer.appendChild(badge);
  });
}

function resetFilters() {
  currentCategory = 'All';
  searchQuery = '';
  searchBar.value = '';
  renderFilters();
  renderSocieties();
}

// ─── Society Cards Grid ─────────────────────────────────────────────────────
function renderSocieties() {
  const filtered = societies.filter(s => {
    const matchesCategory = currentCategory === 'All' || s.category.toLowerCase() === currentCategory.toLowerCase();
    const searchString = `${s.name} ${s.category} ${s.tagline} ${s.description}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  societiesGrid.innerHTML = '';

  if (filtered.length === 0) {
    societiesGrid.style.display = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  societiesGrid.style.display = 'grid';
  emptyState.style.display = 'none';

  filtered.forEach(s => {
    const card = document.createElement('div');
    card.className = 'society-card';
    card.dataset.id = s.id;
    card.innerHTML = `
      <div class="card-header">
        <div class="card-icon-container">
          <i data-lucide="${s.icon}"></i>
        </div>
        <span class="category-tag">${s.category}</span>
      </div>
      <div class="card-body">
        <h3 class="society-card-title">${s.name}</h3>
        <p class="society-card-tagline">${s.tagline}</p>
      </div>
      <div class="card-footer">
        <span class="open-roles-count">${s.roles.length} Open Roles</span>
        <span class="card-learn-more">
          <span>Learn More</span>
          <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </span>
      </div>
    `;

    card.addEventListener('click', () => openDrawer(s, 'details'));
    societiesGrid.appendChild(card);
  });

  if (window.lucide) window.lucide.createIcons();
}

// ─── Drawer Management ──────────────────────────────────────────────────────
function openDrawer(society, mode = 'details') {
  selectedSociety = society;
  drawerViewMode = mode;
  drawerOverlay.classList.add('active');
  detailsDrawer.classList.add('active');
  renderDrawerContent();
}

function closeDrawer() {
  drawerOverlay.classList.remove('active');
  detailsDrawer.classList.remove('active');
  selectedSociety = null;
}

function renderDrawerContent() {
  if (drawerViewMode === 'records') {
    renderRecordsView();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (!selectedSociety) return;

  if (drawerViewMode === 'details') {
    renderDetailsView();
  } else if (drawerViewMode === 'apply') {
    renderApplyFormView();
  }

  if (window.lucide) window.lucide.createIcons();
}

// ─── Details View ───────────────────────────────────────────────────────────
function renderDetailsView() {
  detailsDrawer.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-title-group">
        <div class="card-icon-container" style="width: 56px; height: 56px; margin-bottom: 8px;">
          <i data-lucide="${selectedSociety.icon}" style="width: 28px; height: 28px;"></i>
        </div>
        <h2>${selectedSociety.name}</h2>
        <p class="drawer-tagline">${selectedSociety.tagline}</p>
      </div>
      <button class="close-btn" id="drawer-close-btn" aria-label="Close details">
        <i data-lucide="x"></i>
      </button>
    </div>

    <div class="drawer-section">
      <h4 class="drawer-section-title">About the Society</h4>
      <p class="drawer-body-text">${selectedSociety.description}</p>
    </div>

    <div class="drawer-section">
      <h4 class="drawer-section-title">Recruitment Criteria</h4>
      <p class="drawer-body-text">${selectedSociety.criteria}</p>
    </div>

    <div class="drawer-section">
      <h4 class="drawer-section-title">Open Positions</h4>
      <div class="roles-list">
        ${selectedSociety.roles.map(role => `<span class="role-badge">${role}</span>`).join('')}
      </div>
    </div>

    <div class="drawer-footer">
      ${(() => {
        const user = getCurrentUser();
        if (user && user.role !== 'recruiter') {
          return `<button class="btn btn-primary" id="drawer-apply-btn" style="flex-grow: 1;">
            <i data-lucide="edit-3"></i>
            <span>Apply for Recruitment</span>
          </button>`;
        } else if (!user) {
          return `<button class="btn btn-secondary" id="drawer-signin-prompt-btn" style="flex-grow: 1;">
            <i data-lucide="log-in"></i>
            <span>Sign In to Apply</span>
          </button>`;
        }
        return '';
      })()}
    </div>
  `;

  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
  const applyBtn = document.getElementById('drawer-apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      drawerViewMode = 'apply';
      renderDrawerContent();
    });
  }
  const signinPrompt = document.getElementById('drawer-signin-prompt-btn');
  if (signinPrompt) {
    signinPrompt.addEventListener('click', () => {
      closeDrawer();
      document.getElementById('auth-toggle-btn').click();
    });
  }
}

function renderCustomFieldsHTML(fields) {
  if (!fields || fields.length === 0) return '';
  
  return fields.map(field => {
    const requiredAttr = field.required ? 'required' : '';
    const fieldId = `custom-input-${field.id}`;
    const groupId = `group-custom-${field.id}`;
    
    let inputHTML = '';
    
    if (field.type === 'text' || field.type === 'url') {
      inputHTML = `<input type="${field.type === 'url' ? 'url' : 'text'}" id="${fieldId}" name="${field.id}" class="form-input" placeholder="${field.placeholder || ''}" ${requiredAttr} />`;
    } else if (field.type === 'textarea') {
      inputHTML = `<textarea id="${fieldId}" name="${field.id}" class="form-textarea" placeholder="${field.placeholder || ''}" ${requiredAttr}></textarea>`;
    } else if (field.type === 'select') {
      inputHTML = `
        <select id="${fieldId}" name="${field.id}" class="form-select" ${requiredAttr}>
          <option value="" disabled selected>${field.placeholder || 'Select Option'}</option>
          ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
        </select>
      `;
    } else if (field.type === 'checkbox-group') {
      inputHTML = `
        <div class="checkbox-options-list">
          ${field.options.map((opt, idx) => `
            <label class="checkbox-option">
              <input type="checkbox" name="${field.id}" value="${opt}" />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (field.type === 'radio-group') {
      inputHTML = `
        <div class="radio-options-list">
          ${field.options.map((opt, idx) => `
            <label class="radio-option">
              <input type="radio" name="${field.id}" value="${opt}" />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    }
    
    return `
      <div class="form-group custom-field-group" id="${groupId}" data-field-id="${field.id}" data-field-type="${field.type}" data-field-required="${field.required ? 'true' : 'false'}" data-field-label="${field.label}">
        <label class="form-label">${field.label}${field.required ? ' *' : ''}</label>
        ${inputHTML}
        <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
      </div>
    `;
  }).join('');
}

function validateCustomField(group, type, required, label) {
  if (type === 'text' || type === 'textarea') {
    const el = group.querySelector('input, textarea');
    const val = el ? el.value.trim() : '';
    if (required && val.length === 0) {
      return `${label} is required.`;
    }
    return null;
  }
  
  if (type === 'url') {
    const el = group.querySelector('input');
    const val = el ? el.value.trim() : '';
    if (required && val.length === 0) {
      return `${label} is required.`;
    }
    if (val.length > 0 && !/^https?:\/\/[^\s$.?#].[^\s]*$/i.test(val)) {
      return `Please enter a valid URL (starting with http:// or https://).`;
    }
    return null;
  }
  
  if (type === 'select') {
    const el = group.querySelector('select');
    const val = el ? el.value : '';
    if (required && (!val || val === "")) {
      return `Please select an option for ${label}.`;
    }
    return null;
  }
  
  if (type === 'checkbox-group') {
    const checked = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    if (required && checked.length === 0) {
      return `Please select at least one option for ${label}.`;
    }
    return null;
  }
  
  if (type === 'radio-group') {
    const checked = group.querySelector('input[type="radio"]:checked');
    if (required && !checked) {
      return `Please select an option for ${label}.`;
    }
    return null;
  }
  
  return null;
}

// ─── Application Form View ──────────────────────────────────────────────────
function renderApplyFormView() {
  const loggedInUser = getCurrentUser();
  const defaultName = loggedInUser ? loggedInUser.name : '';

  detailsDrawer.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-title-group">
        <span class="category-tag" style="align-self: flex-start; margin-bottom: 6px;">Application Form</span>
        <h2>Join ${selectedSociety.name}</h2>
        <p class="drawer-tagline">${selectedSociety.tagline}</p>
      </div>
      <button class="close-btn" id="drawer-close-btn" aria-label="Close application">
        <i data-lucide="x"></i>
      </button>
    </div>

    <form id="apply-form" class="application-form-container" novalidate>
      <div class="form-group" id="group-name">
        <label for="input-name" class="form-label">Full Name</label>
        <input type="text" id="input-name" class="form-input" placeholder="e.g. John Doe" value="${defaultName}" required />
        <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
      </div>

      <div style="display: flex; gap: 16px;">
        <div class="form-group" id="group-year" style="flex: 1;">
          <label for="input-year" class="form-label">Academic Year</label>
          <select id="input-year" class="form-select" required>
            <option value="" disabled selected>Select Year</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
          <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
        </div>

        <div class="form-group" id="group-branch" style="flex: 2;">
          <label for="input-branch" class="form-label">Academic Branch</label>
          <input type="text" id="input-branch" class="form-input" placeholder="e.g. Computer Science" required />
          <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
        </div>
      </div>

      <div class="form-group" id="group-role">
        <label for="input-role" class="form-label">Desired Role</label>
        <select id="input-role" class="form-select" required>
          <option value="" disabled selected>Select a Role</option>
          ${selectedSociety.roles.map(role => `<option value="${role}">${role}</option>`).join('')}
        </select>
        <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
      </div>

      <!-- Dynamic Custom Fields -->
      <div id="custom-fields-container">
        ${renderCustomFieldsHTML(selectedSociety.customFields || [])}
      </div>

      <div class="form-group" id="group-whyyou">
        <label for="input-whyyou" class="form-label">Why are you a good fit? (Statement of Purpose)</label>
        <textarea id="input-whyyou" class="form-textarea" placeholder="Explain your interests, skills, or prior projects relevant to this role..." required></textarea>
        <span class="error-msg"><i data-lucide="alert-circle" style="width: 14px; height: 14px;"></i> <span class="error-text"></span></span>
      </div>

      <!-- Server error banner (hidden by default) -->
      <div id="server-error-banner" class="error-msg" style="display: none; background: rgba(var(--error-rgb), 0.08); padding: 12px 16px; border-radius: var(--radius); border: 1px solid rgba(var(--error-rgb), 0.2);">
        <i data-lucide="wifi-off" style="width: 14px; height: 14px;"></i>
        <span class="error-text" id="server-error-text"></span>
      </div>

      <div class="drawer-footer" style="padding-top: 16px;">
        <button type="button" class="btn btn-secondary" id="form-back-btn">
          <i data-lucide="chevron-left"></i>
          <span>Back</span>
        </button>
        <button type="submit" class="btn btn-primary" id="submit-btn" style="flex-grow: 1;">
          <i data-lucide="send"></i>
          <span>Submit Application</span>
        </button>
      </div>
    </form>
  `;

  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
  document.getElementById('form-back-btn').addEventListener('click', () => {
    drawerViewMode = 'details';
    renderDrawerContent();
  });

  const form = document.getElementById('apply-form');
  setupFormValidation(form);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit(form);
  });
}

// ─── Inline Form Validation ─────────────────────────────────────────────────
function setupFormValidation(form) {
  const inputs = {
    name: { el: document.getElementById('input-name'), validator: validator.validateName, group: document.getElementById('group-name') },
    year: { el: document.getElementById('input-year'), validator: validator.validateYear, group: document.getElementById('group-year') },
    branch: { el: document.getElementById('input-branch'), validator: validator.validateBranch, group: document.getElementById('group-branch') },
    role: { el: document.getElementById('input-role'), validator: validator.validateRole, group: document.getElementById('group-role') },
    whyyou: { el: document.getElementById('input-whyyou'), validator: validator.validateWhyYou, group: document.getElementById('group-whyyou') }
  };

  Object.keys(inputs).forEach(key => {
    const item = inputs[key];
    const triggerValidation = () => {
      const error = item.validator(item.el.value);
      if (error) {
        item.group.classList.add('has-error');
        item.group.querySelector('.error-text').textContent = error;
      } else {
        item.group.classList.remove('has-error');
      }
    };

    item.el.addEventListener('blur', triggerValidation);
    item.el.addEventListener('input', triggerValidation);
  });

  // Dynamic Custom Fields Validation
  const customGroups = form.querySelectorAll('.custom-field-group');
  customGroups.forEach(group => {
    const fieldId = group.dataset.fieldId;
    const fieldType = group.dataset.fieldType;
    const isRequired = group.dataset.fieldRequired === 'true';
    const label = group.dataset.fieldLabel;

    const triggerCustomValidation = () => {
      const error = validateCustomField(group, fieldType, isRequired, label);
      if (error) {
        group.classList.add('has-error');
        group.querySelector('.error-text').textContent = error;
      } else {
        group.classList.remove('has-error');
      }
    };

    if (fieldType === 'text' || fieldType === 'url') {
      const el = group.querySelector('.form-input');
      if (el) {
        el.addEventListener('blur', triggerCustomValidation);
        el.addEventListener('input', triggerCustomValidation);
      }
    } else if (fieldType === 'textarea') {
      const el = group.querySelector('.form-textarea');
      if (el) {
        el.addEventListener('blur', triggerCustomValidation);
        el.addEventListener('input', triggerCustomValidation);
      }
    } else if (fieldType === 'select') {
      const el = group.querySelector('.form-select');
      if (el) {
        el.addEventListener('change', triggerCustomValidation);
        el.addEventListener('blur', triggerCustomValidation);
      }
    } else if (fieldType === 'checkbox-group') {
      const checkboxes = group.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach(cb => {
        cb.addEventListener('change', triggerCustomValidation);
      });
    } else if (fieldType === 'radio-group') {
      const radios = group.querySelectorAll('input[type="radio"]');
      radios.forEach(r => {
        r.addEventListener('change', triggerCustomValidation);
      });
    }
  });
}

// ─── Form Submission (Dynamic API POST) ─────────────────────────────────────
async function handleFormSubmit(form) {
  if (isSubmitting) return; // Guard against double-clicks

  const values = {
    name: document.getElementById('input-name').value,
    year: document.getElementById('input-year').value,
    branch: document.getElementById('input-branch').value,
    role: document.getElementById('input-role').value,
    whyyou: document.getElementById('input-whyyou').value
  };

  // Client-side validation
  const errors = {
    name: validator.validateName(values.name),
    year: validator.validateYear(values.year),
    branch: validator.validateBranch(values.branch),
    role: validator.validateRole(values.role),
    whyyou: validator.validateWhyYou(values.whyyou)
  };

  let hasErrors = false;

  Object.keys(errors).forEach(key => {
    const errorMsg = errors[key];
    const groupEl = document.getElementById(`group-${key}`);
    if (errorMsg) {
      hasErrors = true;
      groupEl.classList.add('has-error');
      groupEl.querySelector('.error-text').textContent = errorMsg;
    } else {
      groupEl.classList.remove('has-error');
    }
  });

  // Collect and validate custom fields
  const customFieldsData = {};
  const customGroups = form.querySelectorAll('.custom-field-group');
  let hasCustomErrors = false;

  customGroups.forEach(group => {
    const fieldId = group.dataset.fieldId;
    const fieldType = group.dataset.fieldType;
    const isRequired = group.dataset.fieldRequired === 'true';
    const label = group.dataset.fieldLabel;

    let val = null;
    if (fieldType === 'text' || fieldType === 'url') {
      const el = group.querySelector('input');
      val = el ? el.value.trim() : '';
    } else if (fieldType === 'textarea') {
      const el = group.querySelector('textarea');
      val = el ? el.value.trim() : '';
    } else if (fieldType === 'select') {
      const el = group.querySelector('select');
      val = el ? el.value : '';
    } else if (fieldType === 'checkbox-group') {
      val = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
    } else if (fieldType === 'radio-group') {
      const checked = group.querySelector('input[type="radio"]:checked');
      val = checked ? checked.value : '';
    }

    const error = validateCustomField(group, fieldType, isRequired, label);
    if (error) {
      hasCustomErrors = true;
      group.classList.add('has-error');
      group.querySelector('.error-text').textContent = error;
    } else {
      group.classList.remove('has-error');
      customFieldsData[label] = val;
    }
  });

  if (hasErrors || hasCustomErrors) {
    const firstError = detailsDrawer.querySelector('.has-error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  // Prepare payload for the backend
  const payload = {
    societyId: selectedSociety.id,
    name: values.name.trim(),
    year: values.year,
    branch: values.branch.trim(),
    role: values.role.trim(),
    whyyou: values.whyyou.trim(),
    additionalFields: customFieldsData
  };

  // Set loading state on submit button
  const submitBtn = document.getElementById('submit-btn');
  const serverErrorBanner = document.getElementById('server-error-banner');
  serverErrorBanner.style.display = 'none';

  isSubmitting = true;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 1s linear infinite;">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
    <span>Submitting…</span>
  `;

  try {
    // POST to Render backend API
    const result = await submitApplication(payload);

    console.log('✅ Application submitted to backend:', result);

    // Close drawer and show success dialog
    closeDrawer();

    const textEl = document.getElementById('success-dialog-text');
    textEl.innerHTML = `Hey <strong>${values.name}</strong>, your application to join <strong>${selectedSociety.name}</strong> as a <strong>${values.role}</strong> has been saved successfully. Our recruitment coordinators will contact you shortly!`;

    if (window.lucide) window.lucide.createIcons();
    successDialog.classList.add('active');

  } catch (err) {
    console.error('❌ Failed to submit application:', err.message);

    // Show inline server error banner
    serverErrorBanner.style.display = 'flex';
    document.getElementById('server-error-text').textContent = `Submission failed: ${err.message}. Please try again.`;

    // Restore submit button
    submitBtn.innerHTML = `
      <i data-lucide="send"></i>
      <span>Retry Submission</span>
    `;
    if (window.lucide) window.lucide.createIcons();

  } finally {
    isSubmitting = false;
    submitBtn.disabled = false;
  }
}

// ─── Recommendation Quiz ────────────────────────────────────────────────────
function openQuiz() {
  currentQuizQuestionIndex = 0;
  quizAnswers = [];
  quizOverlay.classList.add('active');
  renderQuizContent();
}

function closeQuiz() {
  quizOverlay.classList.remove('active');
}

function renderQuizContent() {
  quizOverlay.innerHTML = '';

  const totalQuestions = quizQuestions.length;

  if (currentQuizQuestionIndex < totalQuestions) {
    const q = quizQuestions[currentQuizQuestionIndex];
    const progressPercent = ((currentQuizQuestionIndex) / totalQuestions) * 100;

    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-progress-bar" style="transform: scaleX(${progressPercent / 100});"></div>
      <div class="quiz-header">
        <span class="quiz-step-indicator">Question ${currentQuizQuestionIndex + 1} of ${totalQuestions}</span>
        <button class="close-btn" id="quiz-close-btn"><i data-lucide="x"></i></button>
      </div>
      <h3 class="quiz-question-title">${q.question}</h3>
      <div class="quiz-options-list">
        ${q.options.map((opt, idx) => `
          <button class="quiz-option-btn" data-index="${idx}">
            <span>${opt.text}</span>
            <div class="quiz-option-bullet"></div>
          </button>
        `).join('')}
      </div>
    `;

    card.querySelectorAll('.quiz-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const optionIdx = parseInt(btn.dataset.index, 10);
        quizAnswers.push(optionIdx);
        currentQuizQuestionIndex++;
        renderQuizContent();
      });
    });

    card.querySelector('#quiz-close-btn').addEventListener('click', closeQuiz);
    quizOverlay.appendChild(card);
  } else {
    // Quiz uses the live societies array (from API) for recommendations
    const recommended = getRecommendation(quizAnswers);

    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-progress-bar" style="transform: scaleX(1);"></div>
      <div class="quiz-results-container">
        <div class="quiz-results-sparkle">✨</div>
        <span class="quiz-results-headline">Your Best Match Is</span>
        <div class="quiz-recommended-card">
          <h2 class="quiz-recommended-name">${recommended.name}</h2>
          <p class="quiz-recommended-tagline">${recommended.tagline}</p>
        </div>
        <p class="drawer-body-text" style="font-size: 14px;">Based on your inputs, we highly recommend looking into ${recommended.name}. They align perfectly with your interests and aspirations.</p>

        <div class="quiz-actions">
          <button class="btn btn-secondary" id="quiz-retry-btn">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i>
            <span>Retake Quiz</span>
          </button>
          <button class="btn btn-primary" id="quiz-apply-recommended-btn">
            <span>Apply Now</span>
            <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
        <button class="btn btn-secondary" id="quiz-results-close-btn" style="width: 100%; border: none; background: transparent;">
          Back to Explorer
        </button>
      </div>
    `;

    card.querySelector('#quiz-retry-btn').addEventListener('click', openQuiz);
    card.querySelector('#quiz-results-close-btn').addEventListener('click', closeQuiz);
    card.querySelector('#quiz-apply-recommended-btn').addEventListener('click', () => {
      closeQuiz();
      openDrawer(recommended, 'apply');
    });

    quizOverlay.appendChild(card);
  }

  if (window.lucide) window.lucide.createIcons();
}

// ─── Application Records View ──────────────────────────────────────────────
async function renderRecordsView() {
  let records = getSavedApplications();
  
  // 1. Initial render using local storage data for fast responsiveness
  renderHTML(records);
  
  // 2. Fetch latest status from backend API
  try {
    const response = await fetch(`${API_BASE_URL}/api/applications`);
    if (response.ok) {
      const apiApps = await response.json();
      
      let changed = false;
      records = records.map(rec => {
        const matched = apiApps.find(a => 
          a.id === rec.id || 
          (a.name === rec.name && a.role === rec.role && a.societyId === rec.societyId)
        );
        if (matched && matched.status !== rec.status) {
          changed = true;
          return { ...rec, status: matched.status, id: matched.id };
        }
        return rec;
      });
      
      if (changed) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
        // Re-render immediately on status update
        renderHTML(records);
      }
    }
  } catch (err) {
    console.warn("Could not sync applications status from backend API:", err.message);
  }
  
  function renderHTML(recordsList) {
    let recordsHTML = '';
    if (recordsList.length === 0) {
      recordsHTML = `
        <div style="text-align: center; padding: 48px 0; color: var(--text-secondary);">
          <i data-lucide="clipboard-x" style="width: 48px; height: 48px; margin-bottom: 16px; color: var(--text-muted);"></i>
          <p style="font-family: var(--font-mono); font-size: 13px; text-transform: uppercase;">No Applications Found</p>
          <p style="font-size: 12px; margin-top: 8px;">Your application submissions will be listed here.</p>
        </div>
      `;
    } else {
      recordsHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
          <span style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--text-secondary);">${recordsList.length} Application(s)</span>
          <button id="clear-all-records-btn" class="btn btn-secondary" style="padding: 4px 10px; font-size: 10px; border-color: var(--error); color: var(--error);">Clear All</button>
        </div>
        <div class="records-list-wrapper">
          ${recordsList.map(rec => {
            const dateStr = new Date(rec.submittedAt).toLocaleString();
            
            let statusClass = 'status-pending';
            let statusLabel = 'Pending Review';
            
            if (rec.status === 'approved') {
              statusClass = 'status-approved';
              statusLabel = 'Approved';
            } else if (rec.status === 'rejected') {
              statusClass = 'status-rejected';
              statusLabel = 'Rejected';
            } else if (rec.status === 'saved_locally') {
              statusClass = 'status-pending';
              statusLabel = 'Offline Fallback';
            }
            
            const statusBadge = `<span class="status-badge ${statusClass}">${statusLabel}</span>`;
            
            return `
              <div class="record-card">
                <button class="delete-record-btn close-btn" data-id="${rec.id}" aria-label="Delete record" style="position: absolute; top: 12px; right: 12px; width: 24px; height: 24px; font-size: 10px;">
                  <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i>
                </button>
                <div style="display: flex; align-items: center; gap: 8px; justify-content: space-between; padding-right: 24px;">
                  <h4>${rec.societyName}</h4>
                  ${statusBadge}
                </div>
                <div class="record-details-grid">
                  <span class="record-details-label">Applicant:</span>
                  <span class="record-details-val"><strong>${rec.name}</strong> (Year ${rec.year}, ${rec.branch})</span>
                  <span class="record-details-label">Role:</span>
                  <span class="record-details-val">${rec.role}</span>
                  ${rec.additionalFields && Object.keys(rec.additionalFields).length > 0 ? 
                    Object.entries(rec.additionalFields).map(([key, val]) => `
                      <span class="record-details-label">${key}:</span>
                      <span class="record-details-val">${Array.isArray(val) ? val.join(', ') : val}</span>
                    `).join('') : ''
                  }
                  <span class="record-details-label">SOP:</span>
                  <span class="record-details-val-sop">"${rec.whyyou}"</span>
                  <span class="record-details-label">Submitted:</span>
                  <span class="record-details-val">${dateStr}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }

    detailsDrawer.innerHTML = `
      <div class="drawer-header">
        <div class="drawer-title-group">
          <span class="category-tag" style="align-self: flex-start; margin-bottom: 6px;">Application Records</span>
          <h2>My Applications</h2>
          <p class="drawer-tagline">Track your recruitment submissions across campus societies</p>
        </div>
        <button class="close-btn" id="drawer-close-btn" aria-label="Close panel">
          <i data-lucide="x"></i>
        </button>
      </div>
      <div class="drawer-body" style="flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column;">
        ${recordsHTML}
      </div>
    `;

    document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);

    const clearAllBtn = document.getElementById('clear-all-records-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all application records?')) {
          localStorage.removeItem(STORAGE_KEY);
          renderHTML([]);
        }
      });
    }

    const deleteButtons = detailsDrawer.querySelectorAll('.delete-record-btn');
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.dataset.id;
        if (id) {
          deleteApplication(id);
          const updated = getSavedApplications();
          renderHTML(updated);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  }
}

// ─── Role-Based View Routing ────────────────────────────────────────────────
function handleAuthViewSwitch(user) {
  const explorerView = document.getElementById('explorer-view');
  const recruiterView = document.getElementById('recruiter-view');
  const recordsBtn = document.getElementById('records-toggle-btn');
  const quizBtn = document.getElementById('quiz-toggle-btn');

  if (user && user.role === 'recruiter') {
    // Recruiter logged in: hide explorer, show dashboard
    explorerView.style.display = 'none';
    recruiterView.style.display = 'block';
    if (recordsBtn) recordsBtn.style.display = 'none';
    if (quizBtn) quizBtn.style.display = 'none';
    renderRecruiterDashboard(user);
  } else {
    // Student or logged out: show explorer, hide dashboard
    explorerView.style.display = 'block';
    recruiterView.style.display = 'none';
    
    // Only show "My Applications" if logged in as a student
    if (recordsBtn) {
      if (user && user.role === 'student') {
        recordsBtn.style.display = '';
      } else {
        recordsBtn.style.display = 'none';
      }
    }
    if (quizBtn) quizBtn.style.display = '';
  }
}

// ─── Recruiter Dashboard ────────────────────────────────────────────────────
async function renderRecruiterDashboard(user) {
  const recruiterView = document.getElementById('recruiter-view');
  if (!recruiterView) return;

  const societyId = user.society;
  const societyObj = societies.find(s => s.id === societyId);
  const societyName = societyObj ? societyObj.name : societyId;

  // Show loading state
  recruiterView.innerHTML = `
    <div class="dashboard-header">
      <p class="dashboard-tagline">Recruiter Dashboard</p>
      <h2 class="dashboard-title">${societyName}</h2>
      <p class="dashboard-subtitle">Welcome, ${user.name}. Review and manage incoming applications.</p>
    </div>
    <div style="text-align: center; padding: 48px 0; color: var(--text-secondary);">
      <p style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase;">Loading Applications...</p>
    </div>
  `;

  // Fetch applications for this society
  let applications = [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/applications?societyId=${societyId}`);
    if (response.ok) {
      applications = await response.json();
    }
  } catch (err) {
    console.warn('Could not fetch applications from backend:', err.message);
  }

  // Also check localStorage for locally-saved applications
  const localRecords = getSavedApplications().filter(r => r.societyId === societyId || (societyObj && r.societyName === societyObj.name));
  // Merge local records that don't exist in API results
  localRecords.forEach(lr => {
    const exists = applications.some(a => a.id === lr.id);
    if (!exists) {
      applications.push({
        id: lr.id,
        societyId: lr.societyId || societyId,
        name: lr.name,
        year: lr.year,
        branch: lr.branch,
        role: lr.role,
        whyyou: lr.whyyou,
        additionalFields: lr.additionalFields,
        status: lr.status || 'pending',
        submittedAt: lr.submittedAt
      });
    }
  });

  // Compute metrics
  const total = applications.length;
  const approved = applications.filter(a => a.status === 'approved').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;
  const pending = applications.filter(a => !a.status || a.status === 'pending' || a.status === 'submitted' || a.status === 'saved_locally').length;

  // Build applications list HTML
  let appsHTML = '';
  if (applications.length === 0) {
    appsHTML = `
      <div style="text-align: center; padding: 48px 0; color: var(--text-secondary);">
        <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 16px; color: var(--text-muted);"></i>
        <p style="font-family: var(--font-mono); font-size: 13px; text-transform: uppercase;">No Applications Yet</p>
        <p style="font-size: 12px; margin-top: 8px;">Applications submitted by students to ${societyName} will appear here.</p>
      </div>
    `;
  } else {
    appsHTML = `<div class="recruiter-apps-list">
      ${applications.map(app => {
        const statusClass = app.status === 'approved' ? 'status-approved' 
          : app.status === 'rejected' ? 'status-rejected' 
          : 'status-pending';
        const statusLabel = app.status === 'approved' ? 'Approved'
          : app.status === 'rejected' ? 'Rejected'
          : 'Pending Review';
        const dateStr = app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A';
        const showActions = app.status !== 'approved' && app.status !== 'rejected';

        return `
          <div class="recruiter-app-card" data-app-id="${app.id}">
            <div class="recruiter-app-header">
              <div>
                <h4 class="recruiter-app-title">${app.name}</h4>
                <p class="recruiter-app-meta">Year ${app.year} · ${app.branch} · Applied for: <strong>${app.role}</strong></p>
                <p class="recruiter-app-meta">Submitted: ${dateStr}</p>
              </div>
              <span class="status-badge ${statusClass}">${statusLabel}</span>
            </div>
            ${app.additionalFields && Object.keys(app.additionalFields).length > 0 ? `
              <div class="recruiter-app-additional-fields">
                ${Object.entries(app.additionalFields).map(([key, val]) => `
                  <div class="app-field-item">
                    <span class="app-field-label">${key}</span>
                    <span class="app-field-value">${Array.isArray(val) ? val.join(', ') : val}</span>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            <div class="recruiter-app-sop">"${app.whyyou}"</div>
            ${showActions ? `
              <div class="recruiter-app-actions">
                <button class="btn btn-reject recruiter-reject-btn" data-id="${app.id}">
                  <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                  <span>Reject</span>
                </button>
                <button class="btn btn-approve recruiter-approve-btn" data-id="${app.id}">
                  <i data-lucide="check" style="width: 14px; height: 14px;"></i>
                  <span>Approve</span>
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('')}
    </div>`;
  }

  recruiterView.innerHTML = `
    <div class="dashboard-header">
      <p class="dashboard-tagline">Recruiter Dashboard</p>
      <h2 class="dashboard-title">${societyName}</h2>
      <p class="dashboard-subtitle">Welcome, ${user.name}. Review and manage incoming applications.</p>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">Total Applications</span>
        <span class="metric-val">${total}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Pending Review</span>
        <span class="metric-val">${pending}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Approved</span>
        <span class="metric-val" style="color: var(--success);">${approved}</span>
      </div>
      <div class="metric-card">
        <span class="metric-label">Rejected</span>
        <span class="metric-val" style="color: var(--error);">${rejected}</span>
      </div>
    </div>

    <h3 class="recruiter-apps-section-title">Candidate Applications</h3>
    ${appsHTML}
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind approve/reject actions
  recruiterView.querySelectorAll('.recruiter-approve-btn').forEach(btn => {
    btn.addEventListener('click', () => updateApplicationStatus(btn.dataset.id, 'approved', user));
  });
  recruiterView.querySelectorAll('.recruiter-reject-btn').forEach(btn => {
    btn.addEventListener('click', () => updateApplicationStatus(btn.dataset.id, 'rejected', user));
  });
}

async function updateApplicationStatus(applicationId, status, user) {
  try {
    await fetch(`${API_BASE_URL}/api/applications/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId, status })
    });
  } catch (err) {
    console.warn('Backend status update failed, updating locally:', err.message);
  }

  // Also update in localStorage records
  const records = getSavedApplications();
  const idx = records.findIndex(r => r.id === applicationId);
  if (idx !== -1) {
    records[idx].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  // Re-render dashboard
  renderRecruiterDashboard(user);
}
