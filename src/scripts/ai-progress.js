// src/scripts/ai-progress.js
import { $ } from './helpers.js';

let aiProgressTimer = null;

function startAiSimulation() {
  stopAiSimulation(); // Ensure no multiple timers run

  const progressFill = $('aiProgressFill');
  const progressPct = $('aiProgressPct');
  if (!progressFill || !progressPct) return;

  let currentProgress = 0;
  progressFill.style.width = '0%';
  progressPct.textContent = '0%';

  aiProgressTimer = setInterval(() => {
    currentProgress += Math.random() * 15 + 5; // Increment progress
    if (currentProgress >= 100) {
      currentProgress = 100;
      stopAiSimulation();
      progressFill.style.width = '100%';
      progressPct.textContent = '100%';
      
      // Navigate to next step after a short delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('wizard:navigate', {
          detail: { targetStep: 4 }
        }));
      }, 500);
    } else {
      progressFill.style.width = `${currentProgress}%`;
      progressPct.textContent = `${Math.round(currentProgress)}%`;
    }
  }, 400);
}

function stopAiSimulation() {
  if (aiProgressTimer) {
    clearInterval(aiProgressTimer);
    aiProgressTimer = null;
  }
}

export function initAiProgress() {
  window.addEventListener('ai:startProgress', startAiSimulation);
  // Also stop simulation if we navigate away from step 3 manually
  window.addEventListener('wizard:stepChanged', (e) => {
    if (e.detail.to !== 3) {
      stopAiSimulation();
    }
  });
}
