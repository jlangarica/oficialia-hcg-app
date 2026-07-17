// src/scripts/wizard.js
/**
 * Controlador de navegación y flujo del Wizard (pasos 1-5).
 */

import { $ } from './helpers.js';
import { AppState } from './state.js';

/**
 * Navega a un paso específico del wizard.
 * @param {number} stepNumber - Número del paso (1-5)
 */
function goToStep(stepNumber) {
  // Ocultar todos los pasos
  document.querySelectorAll('.wizard-step').forEach((step) =&gt; {
    step.classList.remove('active');
    step.setAttribute('aria-hidden', 'true');
  });

  // Mostrar paso objetivo
  const target = $(`step-${stepNumber}`);
  if (target) {
    target.classList.add('active');
    target.setAttribute('aria-hidden', 'false');
    
    // Disparar evento para animaciones o inicializaciones específicas
    window.dispatchEvent(new CustomEvent('wizard:stepChanged', { 
      detail: { step: stepNumber } 
    }));
  }

  // Actualizar barra de progreso lateral si existe
  updateSidebarProgress(stepNumber);
}

/**
 * Resetea completamente el wizard al estado inicial.
 * Limpia AppState, formularios, badge, y vuelve al paso 1.
 *
 * Se usa desde:
 *   - Paso 5: "Escanear Siguiente Documento"
 *   - Paso 2: "Re-escanear" (antes handleReScan)
 */
function resetWizard() {
  // 1. Limpiar estado global (reutiliza la lógica de handleReScan)
  const pages = AppState.pages || [];
  for (let i = 0; i &lt; pages.length; i++) {
    if (pages[i]) {
      pages[i].base64 = null;   // Liberar memoria del base64
      pages[i].mime = null;
    }
  }

  // 2. Resetear AppState a valores iniciales
  AppState.pages = [];
  AppState.rawPdfPath = null;
  AppState.isScanning = false;
  AppState.scanProgress = 0;
  AppState.draggedIndex = null;
  AppState.isSaving = false;
  AppState.lastSavedFolio = null;

  // 3. Limpiar badge del sidebar
  const badge = $('pageBadge');
  if (badge) badge.textContent = '0';

  // 4. Limpiar campos del formulario del Paso 4
  const classSelect = $('classSelect');
  if (classSelect) classSelect.selectedIndex = 0;

  const remitenteInput = $('shake-input');
  if (remitenteInput) {
    remitenteInput.value = '';
    remitenteInput.classList.remove('warning');
  }

  const fechaInput = $('fechaInput');
  if (fechaInput) fechaInput.value = '';

  const asuntoInput = $('asuntoInput');
  if (asuntoInput) asuntoInput.value = '';

  const folioInput = $('folioInput');
  if (folioInput) folioInput.value = '';

  // 5. Limpiar warn badge si existe
  const warnEl = $('shake-warn');
  if (warnEl) warnEl.style.display = 'none';

  // 6. Limpiar confidence badge
  const confBadge = document.querySelector('.confidence-badge');
  if (confBadge) {
    confBadge.style.display = '';
  }

  // 7. Resetear Paso 5 a su estado placeholder
  const successFolio = document.querySelector('.folio-value');
  if (successFolio) successFolio.textContent = 'OF-?????-?????';

  const checklist = document.querySelector('.checklist');
  if (checklist) checklist.innerHTML = '';

  // 8. Resetear progreso del anillo de escaneo (Paso 1)
  const progressFill = $('progressFill');
  if (progressFill) progressFill.style.strokeDashoffset = '283';
  const progressPct = $('progressPct');
  if (progressPct) progressPct.textContent = '0%';

  // 9. Notificar a otros módulos
  window.dispatchEvent(new CustomEvent('capture:updateUI'));
  window.dispatchEvent(new CustomEvent('preview:render'));
  window.dispatchEvent(new CustomEvent('wizard:navigate', {
    detail: { targetStep: 1 }
  }));

  console.log('[wizard] Wizard reseteado completamente.');
}

function updateSidebarProgress(currentStep) {
  // Lógica opcional para actualizar indicadores visuales laterales
  const indicators = document.querySelectorAll('.step-indicator');
  indicators.forEach((ind, idx) =&gt; {
    if (idx + 1 &lt;= currentStep) {
      ind.classList.add('completed');
    } else {
      ind.classList.remove('completed');
    }
  });
}

function initWizard() {
  // Escuchar eventos de navegación interna
  window.addEventListener('wizard:navigate', (e) =&gt; {
    if (e.detail?.targetStep) {
      goToStep(e.detail.targetStep);
    }
  });

  // Iniciar en paso 1
  goToStep(1);
}

export { initWizard, goToStep, resetWizard };   