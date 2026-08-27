import { societies } from './data.js';
import { quizQuestions, getRecommendation } from './quiz.js';
import * as validator from './validation.js';

// Application State
let currentCategory = 'All';
let searchQuery = '';
let selectedSociety = null;
let drawerViewMode = 'details'; // 'details' or 'apply'
let currentQuizQuestionIndex = 0;
let quizAnswers = [];

// DOM Elements Cache
const societiesGrid = document.getElementById('societies-grid');
const searchBar = document.getElementById('search-bar');
const filtersContainer = document.getElementById('filters-container');
const emptyState = document.getElementById('empty-state');
const clearSearchBtn = document.getElementById('clear-search-btn');

const drawerOverlay = document.getElementById('drawer-overlay');
const detailsDrawer = document.getElementById('details-drawer');

const quizOverlay = document.getElementById('quiz-overlay');
const quizToggleBtn = document.getElementById('quiz-toggle-btn');

const themeToggleBtn = document.getElementById('theme-toggle-btn');
const successDialog = document.getElementById('success-dialog');
const successDialogCloseBtn = document.getElementById('success-dialog-close-btn');

// Initialize the Application
window.addEventListener('DOMContentLoaded', () => {
  // Retrieve saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    toggleThemeIcons(true);
  }

  // Setup Event Listeners
  setupEventListeners();

  // Simulate premium skeleton loading transition for 800ms
  setTimeout(() => {
    renderFilters();
    renderSocieties();
  }, 800);
});

// Event Listeners Configuration
function setupEventListeners() {
  // Theme Toggle
  themeToggleBtn.addEventListener('click', toggleTheme);

  // Search input with dynamic filtering
  searchBar.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderSocieties();
  });

  // Clear filters empty state button
  clearSearchBtn.addEventListener('click', resetFilters);

  // Close overlays when clicking outside
  drawerOverlay.addEventListener('click', () => {
    closeDrawer();
    closeQuiz();
  });

  // Quiz toggler
  quizToggleBtn.addEventListener('click', openQuiz);

  // Close success modal
  successDialogCloseBtn.addEventListener('click', () => {
    successDialog.classList.remove('active');
  });

  // Handle escape key to close overlays
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      closeQuiz();
      successDialog.classList.remove('active');
    }
  });
}

// Theme Management
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

// Render Filter Buttons
function renderFilters() {
  // Extract unique categories and add 'All'
  const categories = ['All', ...new Set(societies.map(s => s.category))];
  
  filtersContainer.innerHTML = '';
  categories.forEach(cat => {
    const badge = document.createElement('button');
    badge.className = `filter-badge ${cat === currentCategory ? 'active' : ''}`;
    badge.textContent = cat;
    badge.addEventListener('click', () => {
      currentCategory = cat;
      // Update active badge styling
      document.querySelectorAll('.filter-badge').forEach(b => b.classList.remove('active'));
      badge.classList.add('active');
      renderSocieties();
    });
    filtersContainer.appendChild(badge);
  });
}

// Reset Search & Filters
function resetFilters() {
  currentCategory = 'All';
  searchQuery = '';
  searchBar.value = '';
  renderFilters();
  renderSocieties();
}

// Render Society Cards Grid
function renderSocieties() {
  // Filter societies based on category and search query
  const filtered = societies.filter(s => {
    const matchesCategory = currentCategory === 'All' || s.category.toLowerCase() === currentCategory.toLowerCase();
    
    const searchString = `${s.name} ${s.category} ${s.tagline} ${s.description}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Update DOM Grid
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

    // Click handler to open Details drawer
    card.addEventListener('click', () => {
      openDrawer(s, 'details');
    });

    societiesGrid.appendChild(card);
  });

  // Re-run Lucide parser to render injected icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Overlay Drawer Management
function openDrawer(society, mode = 'details') {
  selectedSociety = society;
  drawerViewMode = mode;
  drawerOverlay.classList.add('active');
  renderDrawerContent();
}

function closeDrawer() {
  drawerOverlay.classList.remove('active');
  selectedSociety = null;
}

function renderDrawerContent() {
  if (!selectedSociety) return;

  if (drawerViewMode === 'details') {
    renderDetailsView();
  } else if (drawerViewMode === 'apply') {
    renderApplyFormView();
  }

  // Refresh Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Drawer: Render Society Details Panel
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

  // Drawer Action Bindings
  document.getElementById('drawer-close-btn').addEventListener('click', closeDrawer);
  document.getElementById('drawer-apply-btn').addEventListener('click', () => {
    drawerViewMode = 'apply';
    renderDrawerContent();
  });
}

// Drawer: Render Application Form Panel
function renderApplyFormView() {
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
        <input type="text" id="input-name" class="form-input" placeholder="e.g. John Doe" required />
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

      <div class="drawer-footer" style="padding-top: 16px;">
        <button type="button" class="btn btn-secondary" id="form-back-btn">
          <i data-lucide="chevron-left"></i>
          <span>Back</span>
        </button>
        <button type="submit" class="btn btn-primary" style="flex-grow: 1;">
          <i data-lucide="send"></i>
          <span>Submit Application</span>
        </button>
      </div>
    </form>
  `;

  // Bind Form Actions
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

// Inline Form Validation Handlers
function setupFormValidation(form) {
  const inputs = {
    name: { el: document.getElementById('input-name'), validator: validator.validateName, group: document.getElementById('group-name') },
    year: { el: document.getElementById('input-year'), validator: validator.validateYear, group: document.getElementById('group-year') },
    branch: { el: document.getElementById('input-branch'), validator: validator.validateBranch, group: document.getElementById('group-branch') },
    role: { el: document.getElementById('input-role'), validator: validator.validateRole, group: document.getElementById('group-role') },
    whyyou: { el: document.getElementById('input-whyyou'), validator: validator.validateWhyYou, group: document.getElementById('group-whyyou') }
  };

  // Add validation triggers on blur and input change
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

// Handle Final Form Submission
function handleFormSubmit(form) {
  const values = {
    name: document.getElementById('input-name').value,
    year: document.getElementById('input-year').value,
    branch: document.getElementById('input-branch').value,
    role: document.getElementById('input-role').value,
    whyyou: document.getElementById('input-whyyou').value
  };

  // Compile final errors
  const errors = {
    name: validator.validateName(values.name),
    year: validator.validateYear(values.year),
    branch: validator.validateBranch(values.branch),
    role: validator.validateRole(values.role),
    whyyou: validator.validateWhyYou(values.whyyou)
  };

  let hasErrors = false;
  
  // Highlight fields that fail validation
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
    // Scroll the first error element into view inside the drawer
    const firstError = detailsDrawer.querySelector('.has-error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    return;
  }

  // Application Data compiles successfully (ready for Supabase migration!)
  const applicationPayload = {
    societyId: selectedSociety.id,
    societyName: selectedSociety.name,
    ...values,
    submittedAt: new Date().toISOString()
  };

  // Requirements: log application details to the console
  console.log("=== Recruitment Application Submitted ===");
  console.log(applicationPayload);
  console.log("=========================================");

  // Close Application drawer and trigger custom confirm dialog
  closeDrawer();
  
  // Update Success dialogue card text dynamically
  const textEl = document.getElementById('success-dialog-text');
  textEl.innerHTML = `Hey <strong>${values.name}</strong>, your application to join <strong>${selectedSociety.name}</strong> as a <strong>${values.role}</strong> has been logged. Our recruitment coordinators will contact you shortly!`;
  
  // Refresh Lucide in the confirmation dialog
  if (window.lucide) {
    window.lucide.createIcons();
  }
  
  successDialog.classList.add('active');
}

// Recommendation Quiz Management
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
    // Render active question step
    const q = quizQuestions[currentQuizQuestionIndex];
    const progressPercent = ((currentQuizQuestionIndex) / totalQuestions) * 100;
    
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-progress-bar" style="width: ${progressPercent}%;"></div>
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
    
    // Bind option click listeners with slide transition effect
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
    // Render results recommendation card
    const recommended = getRecommendation(quizAnswers);
    
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML = `
      <div class="quiz-progress-bar" style="width: 100%;"></div>
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
  
  // Refresh Lucide icons in Quiz
  if (window.lucide) {
    window.lucide.createIcons();
  }
}
