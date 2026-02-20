/* ========================================
   The Gem Framework — script.js
   ======================================== */

(() => {
  'use strict';

  // --- Constants ---
  const STORAGE_KEY = 'gem-framework-checks';
  const STEP_IDS = ['step0','step1','step1a','step2','step3','step4'];

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

  function initCheckboxes() {
    const state = loadChecks();
    document.querySelectorAll('.check-box[data-id]').forEach(box => {
      if (state[box.dataset.id]) box.classList.add('checked');
      box.addEventListener('click', () => {
        box.classList.toggle('checked');
        const s = loadChecks();
        s[box.dataset.id] = box.classList.contains('checked');
        saveChecks(s);
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
      step0: 'Step 0 - Problem + Role',
      step1: 'Step 1 - Resources',
      step1a: 'Step 1A - Deep Research',
      step2: 'Step 2 - Draft Prompt',
      step3: 'Step 3 - Test the Gem',
      step4: 'Step 4 - Iterate'
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

    // Teaser card click scrolls to showcase
    const teaser = document.querySelector('.teaser-card');
    if (teaser) {
      teaser.addEventListener('click', e => {
        e.preventDefault();
        const showcase = document.getElementById('showcase');
        if (showcase) showcase.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  // ===================================================
  // Init everything on DOM ready
  // ===================================================
  document.addEventListener('DOMContentLoaded', () => {
    initCheckboxes();
    initScrollSpy();
    initGuidedMode();
    initSidebarNav();
  });

  // Expose needed functions globally
  window.expandAll = expandAll;
  window.collapseAll = collapseAll;
  window.copyPrompt = copyPrompt;
  window.guidedPrev = guidedPrev;
  window.guidedNext = guidedNext;

})();
