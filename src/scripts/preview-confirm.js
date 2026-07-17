// src/scripts/preview-confirm.js
/**
 * Maneja la vista previa y confirmación de páginas escaneadas (Paso 2/3).
 */

import { AppState } from './state.js';
import { resetWizard } from './wizard.js';

/**
 * Refactorizado para delegar el reseteo completo a wizard.js
 */
function handleReScan() {
  resetWizard();
}

function handleConfirmStructure() {
  // Lógica existente para confirmar estructura y avanzar
  window.dispatchEvent(new CustomEvent('wizard:navigate', {
    detail: { targetStep: 3 } // O el siguiente paso correspondiente
  }));
}

function restoreConfirmBtn() {
  // Lógica existente para restaurar estado del botón
  const btn = document.querySelector('#step-2 .confirm-btn');
  if (btn) {
    btn.disabled = false;
    btn.textContent = 'Confirmar';
  }
}

function initPreviewConfirm() {
  // Listeners existentes
  window.addEventListener('preview:reScan', () =&gt; {
    // Acciones específicas de re-escaneo si las hubiera
  });
}

export { handleConfirmStructure, handleReScan, restoreConfirmBtn, initPreviewConfirm };