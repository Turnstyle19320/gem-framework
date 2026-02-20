/* ========================================
   The Gem Framework — script.js
   ======================================== */

(() => {
  'use strict';

  // --- Constants ---
  const STORAGE_KEY = 'gem-framework-checks';
  const MIGRATION_KEY = 'gem-framework-migrated-v2';
  const PAGE = document.body.dataset.page; // 'landing' or 'framework'
  const STEP_IDS = ['step1','step2','step2a','step3','step4','step5'];

  // ===================================================
  // 0. One-time localStorage migration (old → new IDs)
  // ===================================================
  function migrateCheckboxKeys() {
    if (localStorage.getItem(MIGRATION_KEY)) return;

    const state = loadChecks();
    if (!Object.keys(state).length) {
      localStorage.setItem(MIGRATION_KEY, '1');
      return;
    }

    // Map old step prefixes to new ones (highest-first to avoid collisions)
    const migrations = [
      ['s4-', 's5-'],
      ['s3-', 's4-'],
      ['s2-', 's3-'],
      ['s1a-', 's2a-'],
      ['s1-', 's2-'],
      ['s0-', 's1-']
    ];

    const newState = {};
    for (const [key, val] of Object.entries(state)) {
      let newKey = key;
      for (const [oldPrefix, newPrefix] of migrations) {
        if (key.startsWith(oldPrefix)) {
          newKey = newPrefix + key.slice(oldPrefix.length);
          break;
        }
      }
      newState[newKey] = val;
    }

    saveChecks(newState);
    localStorage.setItem(MIGRATION_KEY, '1');
  }

  // ===================================================
  // 1. Checkbox persistence (localStorage)
  // ===================================================
  function loadChecks() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
    catch { return {}; }
  }

  function saveChecks(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function toggleCheckbox(box) {
    box.classList.toggle('checked');
    const isChecked = box.classList.contains('checked');
    box.setAttribute('aria-checked', String(isChecked));
    const s = loadChecks();
    s[box.dataset.id] = isChecked;
    saveChecks(s);
  }

  function initCheckboxes() {
    const state = loadChecks();
    document.querySelectorAll('.check-box[data-id]').forEach(box => {
      if (state[box.dataset.id]) {
        box.classList.add('checked');
        box.setAttribute('aria-checked', 'true');
      }
      box.addEventListener('click', () => toggleCheckbox(box));
      box.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          toggleCheckbox(box);
        }
      });
    });
  }

  // ===================================================
  // 2. Expand / Collapse all details
  // ===================================================
  function expandAll() {
    document.querySelectorAll('details').forEach(d => d.open = true);
  }

  function collapseAll() {
    document.querySelectorAll('details').forEach(d => d.open = false);
  }

  // ===================================================
  // 3. Copy prompt to clipboard
  // ===================================================
  function copyPrompt(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const pre = el.querySelector('pre') || el;
    const text = pre.innerText;
    navigator.clipboard.writeText(text).then(() => showToast('Copied to clipboard!'));
  }

  function showToast(msg) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.display = 'block';
    clearTimeout(toast._tid);
    toast._tid = setTimeout(() => { toast.style.display = 'none'; }, 2200);
  }

  // ===================================================
  // 4. Scroll-spy (sidebar + mobile progress bar)
  // ===================================================
  function initScrollSpy() {
    const sections = STEP_IDS.map(id => document.getElementById(id)).filter(Boolean);
    const sidebarLinks = document.querySelectorAll('.sidebar-nav a[data-step]');
    const progressFill = document.querySelector('.progress-fill');
    const progressLabel = document.querySelector('.progress-label');

    if (!sections.length) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          // Sidebar
          sidebarLinks.forEach(a => {
            a.classList.toggle('active', a.dataset.step === id);
          });
          // Mobile progress
          const idx = STEP_IDS.indexOf(id);
          if (idx !== -1) {
            const pct = ((idx + 1) / STEP_IDS.length) * 100;
            if (progressFill) progressFill.style.width = pct + '%';
            if (progressLabel) progressLabel.textContent = stepLabel(id);
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(s => observer.observe(s));
  }

  function stepLabel(id) {
    const map = {
      step1: 'Step 1 — Problem + Role',
      step2: 'Step 2 — Resources',
      step2a: 'Step 2A — Deep Research',
      step3: 'Step 3 — Draft Prompt',
      step4: 'Step 4 — Test the Gem',
      step5: 'Step 5 — Iterate'
    };
    return map[id] || '';
  }

  // ===================================================
  // 5. Guided mode
  // ===================================================
  let guidedIndex = 0;

  function initGuidedMode() {
    const toggle = document.getElementById('guided-toggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const active = document.body.classList.toggle('guided-mode');
      toggle.textContent = active ? 'Exit Guided Mode' : 'Guided Mode';
      if (active) {
        guidedIndex = 0;
        showGuidedStep(0);
      }
    });
  }

  function showGuidedStep(idx) {
    const sections = STEP_IDS.map(id => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return;

    guidedIndex = Math.max(0, Math.min(idx, sections.length - 1));

    sections.forEach((s, i) => {
      s.classList.toggle('guided-active', i === guidedIndex);
    });

    // Update counter
    document.querySelectorAll('.guided-counter').forEach(el => {
      el.textContent = `Step ${guidedIndex + 1} of ${sections.length}`;
    });

    // Disable buttons at boundaries
    document.querySelectorAll('.guided-prev').forEach(b => {
      b.disabled = guidedIndex === 0;
    });
    document.querySelectorAll('.guided-next').forEach(b => {
      b.disabled = guidedIndex === sections.length - 1;
    });

    // Scroll to top of section
    sections[guidedIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function guidedPrev() { showGuidedStep(guidedIndex - 1); }
  function guidedNext() { showGuidedStep(guidedIndex + 1); }

  // ===================================================
  // 6. Smooth scroll for sidebar links
  // ===================================================
  function initSidebarNav() {
    document.querySelectorAll('.sidebar-nav a[href^="#"]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  }

  // ===================================================
  // Init everything on DOM ready
  // ===================================================
  document.addEventListener('DOMContentLoaded', () => {
    // Migration runs on any page (one-time)
    migrateCheckboxKeys();

    // Checkboxes work on both pages
    initCheckboxes();

    // Framework-only features
    if (PAGE === 'framework') {
      initScrollSpy();
      initGuidedMode();
      initSidebarNav();
    }
  });

  // Expose needed functions globally (safe on both pages)
  window.expandAll = expandAll;
  window.collapseAll = collapseAll;
  window.copyPrompt = copyPrompt;
  window.guidedPrev = guidedPrev;
  window.guidedNext = guidedNext;

})();
