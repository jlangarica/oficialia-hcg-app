// preview-confirm.js — Confirmación de estructura y re-escaneo
import { $ } from './helpers.js';
import { AppState } from './state.js';
import { resetWizard } from './wizard.js';

function restoreConfirmBtn() {
  const confirmBtn = $('confirmStructureBtn');
  if (confirmBtn && AppState.pages.length > 0) {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Confirmar Estructura';
  }
}

function handleConfirmStructure() {
  if (!Array.isArray(AppState.pages) || AppState.pages.length === 0 || AppState.isSaving) return;

  AppState.isSaving = true;
  const confirmBtn = $('confirmStructureBtn');
  if (confirmBtn) {
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<span class="material-symbols-outlined" style="animation:spin 1s linear infinite;font-size:16px;">sync</span> Aplicando cambios...';
  }

  // Pre-allocar el array de operaciones con capacidad exacta
  const pages = AppState.pages;
  const operations = new Array(pages.length);
  for (let i = 0; i < pages.length; i++) {
    operations[i] = {
      source_index: pages[i].pageIndex,
      rotation: pages[i].rotation
    };
  }

  let sent = false;
  try {
    if (AppState.wsStatus === 'CONNECTED' && typeof window.sendScannerCommand === 'function') {
      sent = window.sendScannerCommand('APPLY_EDITS', {
        operations: operations
      }) === true;
    }
  } catch (e) {
    console.error('[preview-confirm] Fallo al confirmar estructura:', e);
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Error de comunicación durante confirmación.', type: 'error' }
    }));
    sent = false;
  }



  if (!sent) {
    // En modo demo, avanzar directamente al paso de IA
    setTimeout(function () {
      AppState.isSaving = false;
      restoreConfirmBtn();
      window.dispatchEvent(new CustomEvent('wizard:navigate', {
        detail: { targetStep: 3 }
      }));
    }, 400);
  }
}

function handleReScan() {
  resetWizard();
}

function initPreviewConfirm() {
  // El ws-bridge escucha este evento para enviar el comando real al agente
  // Este módulo solo despacha; no importa ws-bridge
}

export { handleConfirmStructure, handleReScan, restoreConfirmBtn, initPreviewConfirm };
