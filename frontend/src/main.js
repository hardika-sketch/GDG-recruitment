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
    console.log('Auth state initialized/changed:', user);
  });

  // Fetch societies from backend API dynamically
  await loadSocieties();
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
    societies = data.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      tagline: s.tagline,
      icon: s.icon,
      description: s.description,
      criteria: s.criteria,
      roles: s.roles
    }));

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
      <button class="btn btn-primary" id="drawer-apply-btn" style="flex-grow: 1;">
        <i data-lucide="edit-3"></i>
        <span>Apply for Recruitment</span>
      </button>
    </div>
  `;

  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
  document.getElementById('drawer-apply-btn').addEventListener('click', () => {
    drawerViewMode = 'apply';
    renderDrawerContent();
  });
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

  if (hasErrors) {
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
    whyyou: values.whyyou.trim()
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
function renderRecordsView() {
  const records = getSavedApplications();

  let recordsHTML = '';
  if (records.length === 0) {
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
        <span style="font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; color: var(--text-secondary);">${records.length} Application(s)</span>
        <button id="clear-all-records-btn" class="btn btn-secondary" style="padding: 4px 10px; font-size: 10px; border-color: var(--error); color: var(--error);">Clear All</button>
      </div>
      <div class="records-list-wrapper">
        ${records.map(rec => {
          const dateStr = new Date(rec.submittedAt).toLocaleString();
          const statusBadge = rec.status === 'submitted' 
            ? `<span class="record-card-status-active">Active</span>` 
            : `<span class="record-card-status-offline">Offline Fallback</span>`;
          
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
        renderRecordsView();
        if (window.lucide) window.lucide.createIcons();
      }
    });
  }

  const deleteButtons = detailsDrawer.querySelectorAll('.delete-record-btn');
  deleteButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.dataset.id;
      if (id) {
        deleteApplication(id);
        renderRecordsView();
        if (window.lucide) window.lucide.createIcons();
      }
    });
  });
}

