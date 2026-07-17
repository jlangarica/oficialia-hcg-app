// wizard.js — Navegación del wizard con transiciones atómicas
import { $ } from './helpers.js';
import { AppState } from './state.js';

let currentStep = 1;
let isAnimating = false;

/**
 * Transición atómica: el lock `isAnimating` cubre TODO el ciclo
 * (fade-out + fade-in) mediante un único encadenamiento de timeouts.
 */
function goToStep(target) {
  if (isAnimating || target === currentStep || target < 1 || target > 5) return false;
  const oldStep = $('step-' + currentStep);
  const newStep = $('step-' + target);

  if (!oldStep || !newStep) {
    console.warn('[wizard] Intento de navegar a un paso inexistente del DOM');
    return false;
  }

  isAnimating = true;

  const direction = target > currentStep ? 1 : -1;
  const offsetOut = -direction * 16;
  const offsetIn = direction * 16;

  // Fade out current
  oldStep.style.transition = 'opacity 0.4s var(--spring-ios), transform 0.4s var(--spring-ios)';
  oldStep.style.opacity = '0';
  oldStep.style.transform = `translateY(${offsetOut}px) scale(0.97)`;

  setTimeout(function swapSteps() {
    oldStep.classList.remove('active');
    oldStep.style.transition = '';
    oldStep.style.opacity = '';
    oldStep.style.transform = '';

    newStep.style.opacity = '0';
    newStep.style.transform = `translateY(${offsetIn}px) scale(0.97)`;
    newStep.classList.add('active');

    // Force reflow (single layout flush)
    void newStep.offsetHeight;

    newStep.style.transition = 'opacity 0.5s var(--spring-ios), transform 0.6s var(--spring-bounce)';
    newStep.style.opacity = '1';
    newStep.style.transform = 'translateY(0) scale(1)';

    currentStep = target;
    updateStepper();

    // Despachar eventos específicos por paso (desacoplado)
    window.dispatchEvent(new CustomEvent('wizard:stepChanged', {
      detail: { to: target, from: currentStep }
    }));

    if (target === 2) window.dispatchEvent(new CustomEvent('preview:render'));

    // CORREGIDO: Solo iniciar simulación IA si se navega HACIA ADELANTE al paso 3
    // (no si se vuelve desde pasos posteriores con ←)
    if (target === 3 && target > currentStep) {
      window.dispatchEvent(new CustomEvent('ai:startProgress'));
    }

    if (target === 5) window.dispatchEvent(new CustomEvent('particles:spawn'));

    setTimeout(function releaseLock() { isAnimating = false; }, 600);
  }, 400);

  return true;
}

// Iconos pre-computados para el stepper
const STEP_ICONS = {
  3: '<span class="material-symbols-outlined">auto_awesome</span>',
  5: '<span class="material-symbols-outlined">check</span>'
};
const STEP_CHECK_ICON = '<span class="material-symbols-outlined">check</span>';

function updateStepper() {
  for (let i = 1; i <= 5; i++) {
    const dot = $('dot-' + i);
    const line = $('line-' + i);
    if (!dot) continue;

    dot.className = 'step-dot';
    if (line) line.classList.remove('completed');

    const icon = STEP_ICONS[i] || i;

    if (i < currentStep) {
      dot.classList.add('completed');
      dot.innerHTML = STEP_CHECK_ICON;
      if (line) line.classList.add('completed');
    } else if (i === currentStep) {
      dot.classList.add('active');
      dot.innerHTML = icon;
    } else {
      dot.innerHTML = icon;
    }
  }
}

/**
 * Inicialización: registrar listeners de eventos entrantes y comportamiento
 * del stepper y sidebar.
 */
function initWizard() {
  // Escuchar solicitudes de navegación desde cualquier módulo
  window.addEventListener('wizard:navigate', (e) => {
    goToStep(e.detail.targetStep);
  });

  // Listener para cambio de módulo - pausar actividades si se navega fuera
  window.addEventListener('module:changed', ({ detail: { to } }) => {
    if (to !== 'wizard') {
      // Pausar cualquier escaneo activo si se navega fuera del wizard
      // En producción: wsBridge.disconnect() o similar si aplica
      console.log('[Wizard] Navegando fuera, pausando actividades...');
    }
  });

  // Stepper click navigation
  document.querySelectorAll('.step-dot').forEach(function (dot) {
    dot.addEventListener('click', function () {
      const idx = parseInt(dot.dataset.step, 10);
      if (Number.isInteger(idx) && idx <= currentStep) goToStep(idx);
    });
  });

  // Sidebar nav active state with haptic feedback
  document.querySelectorAll('.nav-item:not(.locked)').forEach(function (item) {
    item.addEventListener('click', function () {
      document.querySelectorAll('.nav-item').forEach(function (n) {
        n.classList.remove('active');
        n.style.animation = 'none';
      });
      item.classList.add('active');
      void item.offsetWidth;
      item.style.animation = 'nav-haptic 0.35s var(--spring-bounce)';
      if (navigator.vibrate) navigator.vibrate(10);
    });
  });

  // Sidebar collapse/expand toggle
  let sidebarCollapsed = false;
  function toggleSidebar() {
    const sidebar = $('sidebar');
    const sidebarToggle = $('sidebarToggle');
    const appWindow = document.querySelector('.app-window');
    if (!sidebar || !appWindow || !sidebarToggle) return;
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
    appWindow.classList.toggle('sidebar-is-collapsed', sidebarCollapsed);
    sidebarToggle.setAttribute('aria-label', sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú');
  }

  const sidebarToggleBtn = $('sidebarToggle');
  if (sidebarToggleBtn) {
    sidebarToggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleSidebar();
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function (e) {
    if (!e) return;
    if (e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      toggleSidebar();
      return;
    }
    // CORREGIDO: Las flechas solo permiten retroceder (igual que el click en stepper).
    // Para avanzar, el usuario debe usar los botones de acción de cada paso.
    if (e.key === 'ArrowLeft' && currentStep > 1) {
      goToStep(currentStep - 1);
    }
    // CORREGIDO: ArrowRight no avanza automáticamente — requiere interacción deliberada
    // con los botones de acción (Confirmar Estructura, Guardar Registro, etc.)
  });
}

export { initWizard, goToStep, updateStepper };
