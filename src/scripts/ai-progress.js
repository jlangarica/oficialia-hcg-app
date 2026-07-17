// src/scripts/ai-progress.js
import { $ } from './helpers.js';
import { AppState } from './state.js';

function requestRealAiExtraction() {
  const progressFill = $('aiProgressFill');
  const progressPct = $('aiProgressPct');
  if (!progressFill || !progressPct) return;

  progressFill.style.width = '0%';
  progressPct.textContent = '0%';

  if (AppState.wsStatus !== 'CONNECTED' || typeof window.sendScannerCommand !== 'function') {
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Servidor no disponible para extracción de metadatos.', type: 'error' }
    }));
    return;
  }

  // Disparamos el comando real al backend por el WebSocket
  window.sendScannerCommand('EXTRACT_METADATA');
}

export function initAiProgress() {
  window.addEventListener('ai:startProgress', requestRealAiExtraction);

  // Escuchamos la respuesta final del agente físico para poblar el paso 4
  window.addEventListener('ws:metadataReady', (e) => {
    const meta = e.detail.metadata;

    // Asignar los valores reales extraídos por Gemini al DOM del Paso 4
    const classSelect = $('classSelect');
    const folioInput = $('folioInput');
    const shakeInput = $('shake-input');
    const shakeWarn = $('shake-warn');
    const fechaInput = $('fechaInput');
    const asuntoInput = $('asuntoInput');

    if (classSelect && meta.classification) {
      classSelect.value = meta.classification.value;
    }
    if (folioInput && meta.folio) {
      folioInput.value = meta.folio.value;
    }
    if (shakeInput && meta.sender) {
      shakeInput.value = meta.sender.value;

      // Si la confianza es menor al 80%, activar la alerta visual de UI
      if (meta.sender.confidence < 0.80) {
        shakeInput.classList.add('warning');
        if (shakeWarn) shakeWarn.style.display = 'flex';
      } else {
        shakeInput.classList.remove('warning');
        if (shakeWarn) shakeWarn.style.display = 'none';
      }
    }
    if (fechaInput && meta.date) {
      fechaInput.value = meta.date.value;
    }
    if (asuntoInput && meta.subject) {
      asuntoInput.value = meta.subject.value;
    }

    // Avanzar al paso de validación humana automáticamente
    window.dispatchEvent(new CustomEvent('wizard:navigate', {
      detail: { targetStep: 4 }
    }));
  });

  // También detener simulación si navegamos fuera del paso 3 manualmente
  window.addEventListener('wizard:stepChanged', (e) => {
    if (e.detail.to !== 3) {
      // Limpiar cualquier estado pendiente
    }
  });
}
