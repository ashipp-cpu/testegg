const inputs = Array.from(document.querySelectorAll('.stat-input'));
const remainingEl = document.getElementById('points-remaining');
const pool = Number(inputs[0]?.dataset.pool || 0);

function updateRemaining() {
  const total = inputs.reduce((sum, input) => sum + (parseInt(input.value, 10) || 0), 0);
  remainingEl.textContent = pool - total;
}

inputs.forEach((input) => input.addEventListener('input', updateRemaining));
updateRemaining();
