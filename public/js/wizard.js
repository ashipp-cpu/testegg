// Drives the 4-screen character creation wizard (createCharacter.ejs).
// Every screen but the last is pure client-side state — nothing is sent
// to the server until "Let's go" on the final screen, which fires the
// existing POST /characters and POST /join-tribe endpoints back to back.
document.addEventListener('DOMContentLoaded', () => {
  const stage = document.querySelector('[data-wizard-stage]');
  const screens = Array.from(document.querySelectorAll('.wizard-screen'));
  const progressFill = document.querySelector('[data-progress-fill]');
  const progressDots = Array.from(document.querySelectorAll('[data-step-dot]'));
  const errorEl = document.querySelector('[data-wizard-error]');
  if (!stage || screens.length === 0) return;

  const state = {
    name: '', gender: '', description: '',
    background_key: '', background_name: '',
    tribe_key: '', tribe_name: '',
  };
  let currentStep = 0;
  let transitioning = false;

  function showError(message) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
  function clearError() {
    errorEl.hidden = true;
    errorEl.textContent = '';
  }

  function updateProgress() {
    progressDots.forEach((dot, i) => {
      dot.classList.toggle('active', i === currentStep);
      dot.classList.toggle('done', i < currentStep);
    });
    progressFill.style.width = (currentStep / (screens.length - 1)) * 100 + '%';
  }

  function updateSummary() {
    const summary = document.querySelector('[data-ready-summary]');
    if (!summary) return;
    summary.textContent = `${state.name} — ${state.background_name}, ${state.tribe_name}.`;
  }

  function goToStep(index) {
    if (transitioning || index === currentStep) return;
    clearError();
    transitioning = true;
    stage.classList.add('is-transitioning');
    setTimeout(() => {
      screens[currentStep].classList.remove('active');
      screens[index].classList.add('active');
      currentStep = index;
      updateProgress();
      if (index === 3) updateSummary();
      stage.classList.remove('is-transitioning');
      transitioning = false;
    }, 220);
  }

  // Screen 1 — identity
  const nameInput = document.querySelector('[data-field="name"]');
  const descriptionInput = document.querySelector('[data-field="description"]');
  nameInput.addEventListener('input', (e) => { state.name = e.target.value.trim(); });
  descriptionInput.addEventListener('input', (e) => { state.description = e.target.value.trim(); });

  document.querySelectorAll('[data-field-group="gender"] .pill-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-field-group="gender"] .pill-btn').forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.gender = btn.dataset.value;
    });
  });

  // Screen 2 — background
  document.querySelectorAll('[data-field-group="background_key"] .bg-card').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.bg-card').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      state.background_key = card.dataset.value;
      state.background_name = card.querySelector('.bg-card-name').textContent;
    });
  });

  // Screen 3 — tribe
  const tribeDetail = document.querySelector('[data-tribe-detail]');
  const tribeDetailName = document.querySelector('[data-tribe-detail-name]');
  const tribeDetailText = document.querySelector('[data-tribe-detail-text]');
  document.querySelectorAll('[data-field-group="tribe_key"] .tribe-card2').forEach((card) => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.tribe-card2').forEach((c) => c.classList.remove('selected'));
      card.classList.add('selected');
      state.tribe_key = card.dataset.value;
      state.tribe_name = card.dataset.name;
      tribeDetailName.textContent = card.dataset.name;
      tribeDetailText.textContent = card.dataset.detail;
      tribeDetail.hidden = false;
    });
  });

  // Next / back
  document.querySelectorAll('[data-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.closest('.wizard-screen').dataset.screen);
      if (step === 0) {
        if (state.name.length < 2 || state.name.length > 30) {
          return showError('Name must be between 2 and 30 characters.');
        }
        if (!state.gender) return showError('Pick a gender to continue.');
        if (state.description.length < 10) {
          return showError('Give a bit more description of your character.');
        }
      }
      if (step === 1 && !state.background_key) return showError('Pick a background to continue.');
      if (step === 2 && !state.tribe_key) return showError('Pick a tribe to continue.');
      goToStep(step + 1);
    });
  });
  document.querySelectorAll('[data-back]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const step = Number(btn.closest('.wizard-screen').dataset.screen);
      goToStep(step - 1);
    });
  });

  // Final submit — two sequential POSTs, both told to respond JSON.
  const submitBtn = document.querySelector('[data-submit]');
  submitBtn.addEventListener('click', async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Entering...';

    const jsonHeaders = { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' };

    try {
      const charRes = await fetch('/characters', {
        method: 'POST',
        headers: jsonHeaders,
        body: new URLSearchParams({
          name: state.name,
          gender: state.gender,
          description: state.description,
          background_key: state.background_key,
        }),
      });
      const charBody = await charRes.json();
      if (!charRes.ok) {
        goToStep(0);
        showError(charBody.error || 'Something went wrong. Try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = "Let's go";
        return;
      }

      const tribeRes = await fetch('/join-tribe', {
        method: 'POST',
        headers: jsonHeaders,
        body: new URLSearchParams({ tribe_key: state.tribe_key }),
      });
      const tribeBody = await tribeRes.json();
      if (!tribeRes.ok) {
        goToStep(2);
        showError(tribeBody.error || 'Something went wrong. Try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = "Let's go";
        return;
      }

      window.location.href = '/game';
    } catch (err) {
      showError('Network error — try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = "Let's go";
    }
  });

  updateProgress();
});
