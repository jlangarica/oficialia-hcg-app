// src/scripts/save-document.js
// Orquesta el guardado real del documento y llena dinámicamente el Paso 5.

import { $, escapeHTML } from './helpers.js';
import { AppState } from './state.js';

/**
 * Lee los campos del formulario del Paso 4 y envía SAVE_DOCUMENT al backend.
 * Si no hay conexión WS, cae a modo demo con folio simulado.
 */
function handleSaveDocument() {
  if (AppState.isSaving) return;
  AppState.isSaving = true;

  // Recopilar datos del formulario (Paso 4)
  const classSelect = $('classSelect');
  const remitenteInput = $('shake-input');
  const fechaInput = $('fechaInput');
  const asuntoInput = $('asuntoInput');

  const payload = {
    command: 'SAVE_DOCUMENT',
    clasificacion: classSelect ? classSelect.value : '',
    remitente: remitenteInput ? remitenteInput.value : '',
    fecha_doc: fechaInput ? fechaInput.value : '',
    asunto: asuntoInput ? asuntoInput.value : '',
    total_paginas: Array.isArray(AppState.pages) ? AppState.pages.length : 0,
  };

  // Validación mínima
  if (!payload.clasificacion || !payload.remitente || !payload.fecha_doc || !payload.asunto) {
    AppState.isSaving = false;
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Todos los campos son obligatorios antes de guardar.', type: 'error' }
    }));
    return;
  }

  // Deshabilitar botón mientras guarda
  const saveBtn = document.querySelector('#step-4 .glass-btn.primary');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '&lt;span class="material-symbols-outlined" style="animation:spin 1s linear infinite"&gt;sync&lt;/span&gt; Guardando...';
  }

  let sent = false;
  try {
    if (AppState.wsStatus === 'CONNECTED' && typeof window.sendScannerCommand === 'function') {
      sent = window.sendScannerCommand('SAVE_DOCUMENT', {
        clasificacion: payload.clasificacion,
        remitente: payload.remitente,
        fecha_doc: payload.fecha_doc,
        asunto: payload.asunto,
        total_paginas: payload.total_paginas,
      });
    }
  } catch (e) {
    console.error('[save-document] Error al enviar SAVE_DOCUMENT:', e);
    sent = false;
  }

  if (!sent) {
    // Modo demo: generar folio simulado y avanzar
    console.warn('[save-document] WS no disponible — modo demo');
    setTimeout(() =&gt; {
      const demoFolio = generateDemoFolio();
      const demoResult = {
        folio: demoFolio,
        estatus: 'procesado',
        total_paginas: payload.total_paginas,
      };
      onDocumentSaved(demoResult);
    }, 800);
  }
  // Si sí se envió, ws-bridge.js escuchará DOCUMENT_SAVED y llamará onDocumentSaved
}

/**
 * Callback que se ejecuta al recibir DOCUMENT_SAVED del backend,
 * o al simular en modo demo.
 */
function onDocumentSaved(result) {
  AppState.isSaving = false;
  AppState.lastSavedFolio = result.folio;

  // Restaurar botón del Paso 4
  const saveBtn = document.querySelector('#step-4 .glass-btn.primary');
  if (saveBtn) {
    saveBtn.disabled = false;
    saveBtn.innerHTML = '&lt;span class="material-symbols-outlined"&gt;save&lt;/span&gt; Guardar Registro';
  }

  // Actualizar el Paso 5 con datos reales
  updateStepSuccess(result);

  // Navegar al Paso 5
  window.dispatchEvent(new CustomEvent('wizard:navigate', {
    detail: { targetStep: 5 }
  }));
}

/**
 * Llena dinámicamente el Paso 5 (StepSuccess) con los datos reales del guardado.
 */
function updateStepSuccess(result) {
  const folioValue = document.querySelector('.folio-value');
  if (folioValue) {
    folioValue.textContent = result.folio || 'OF-?????-?????';
  }

  // Actualizar el folio también en el campo del Paso 4 (si lo hay)
  const folioInput = $('folioInput');
  if (folioInput) {
    folioInput.value = result.folio || '';
  }

  // Construir checklist dinámico
  const checklist = document.querySelector('.checklist');
  if (!checklist) return;

  const items = [];

  // 1. Siempre: subido al storage
  items.push({
    icon: 'cloud_upload',
    text: `PDF archivado como ${result.folio}.pdf`,
    done: true,
  });

  // 2. Si hay paginas, mention count
  if (result.total_paginas &gt; 0) {
    items.push({
      icon: 'description',
      text: `${result.total_paginas} página${result.total_paginas &gt; 1 ? 's' : ''} procesada${result.total_paginas &gt; 1 ? 's' : ''}`,
      done: true,
    });
  }

  // 3. Registro asentado (siempre)
  items.push({
    icon: 'menu_book',
    text: 'Asentado en Archivo Documental',
    done: true,
  });

  // Construir HTML con sanitización
  const fragment = document.createDocumentFragment();
  for (let i = 0; i &lt; items.length; i++) {
    const item = items[i];
    const div = document.createElement('div');
    div.className = 'checklist-item';
    div.innerHTML = `&lt;span class="material-symbols-outlined"&gt;${escapeHTML(item.icon)}&lt;/span&gt;` +
      `&lt;span&gt;${escapeHTML(item.text)}&lt;/span&gt;`;
    fragment.appendChild(div);
  }

  checklist.innerHTML = '';
  checklist.appendChild(fragment);
}

/**
 * Genera un folio demo cuando no hay backend conectado.
 * Formato: OF-{AÑO_ACTUAL}-{5 dígitos random}
 */
function generateDemoFolio() {
  const year = new Date().getFullYear();
  const seq = String(Math.floor(Math.random() * 90000) + 10000);
  return `OF-${year}-${seq}`;
}

function initSaveDocument() {
  // Escuchar el evento DOCUMENT_SAVED que llega desde ws-bridge.js
  window.addEventListener('ws:documentSaved', (e) =&gt; {
    const detail = e.detail || {};
    onDocumentSaved({
      folio: detail.folio,
      estatus: detail.estatus,
      total_paginas: detail.total_paginas,
    });
  });
}

export { handleSaveDocument, onDocumentSaved, initSaveDocument, generateDemoFolio };