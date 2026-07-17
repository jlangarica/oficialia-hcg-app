// src/scripts/ws-bridge.js
/**
 * Gestiona la conexión WebSocket con el backend y enruta eventos.
 */

import { AppState } from './state.js';

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000;

/**
 * Establece la conexión WebSocket.
 */
function connect() {
  if (socket?.readyState === WebSocket.OPEN) return;

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/`;

  console.log('[WS] Conectando a', wsUrl);
  socket = new WebSocket(wsUrl);

  socket.onopen = () =&gt; {
    console.log('[WS] Conexión establecida');
    AppState.wsStatus = 'CONNECTED';
    reconnectAttempts = 0;
    window.dispatchEvent(new CustomEvent('ws:status', { detail: { status: 'CONNECTED' } }));
  };

  socket.onclose = () =&gt; {
    console.log('[WS] Conexión cerrada');
    AppState.wsStatus = 'DISCONNECTED';
    window.dispatchEvent(new CustomEvent('ws:status', { detail: { status: 'DISCONNECTED' } }));
    
    if (reconnectAttempts &lt; MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`[WS] Reintentando (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
      setTimeout(connect, RECONNECT_DELAY);
    }
  };

  socket.onerror = (err) =&gt; {
    console.error('[WS] Error:', err);
    AppState.wsStatus = 'ERROR';
  };

  socket.onmessage = (event) =&gt; {
    try {
      const msg = JSON.parse(event.data);
      routeEvent(msg);
    } catch (e) {
      console.error('[WS] Error parseando mensaje:', e);
    }
  };
}

/**
 * Enruta los eventos recibidos del backend a los handlers correspondientes.
 */
const agentEventHandlers = {
  'HARDWARE_STATUS': function (msg) {
    AppState.scannerOnline = msg.online || false;
    window.dispatchEvent(new CustomEvent('ws:hardwareStatus', { detail: msg }));
  },

  'SCAN_STARTED': function (msg) {
    AppState.isScanning = true;
    AppState.scanProgress = 0;
    window.dispatchEvent(new CustomEvent('ws:scanStarted'));
  },

  'SCAN_PROGRESS': function (msg) {
    AppState.scanProgress = msg.percent || 0;
    window.dispatchEvent(new CustomEvent('ws:scanProgress', { detail: { percent: AppState.scanProgress } }));
  },

  'SCAN_COMPLETED': function (msg) {
    AppState.isScanning = false;
    AppState.scanProgress = 100;
    AppState.rawPdfPath = msg.pdf_path;
    window.dispatchEvent(new CustomEvent('ws:scanCompleted', { detail: msg }));
  },

  'EDITS_APPLIED': function (msg) {
    window.dispatchEvent(new CustomEvent('ws:editsApplied', { detail: msg }));
  },

  'DOCUMENT_SAVED': function (msg) {
    AppState.isSaving = false;
    console.log('[WS] Documento guardado. Folio:', msg.folio);

    // Reenviar como evento interno para que save-document.js lo reciba
    window.dispatchEvent(new CustomEvent('ws:documentSaved', {
      detail: {
        folio: msg.folio || '',
        pdf_path: msg.pdf_path || '',
        estatus: msg.estatus || 'procesado',
        total_paginas: msg.total_paginas || 0,
      }
    }));
  },

  'ERROR': function (msg) {
    console.error('[WS] Error del servidor:', msg.message);
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: msg.message, type: 'error' }
    }));
  }
};

function routeEvent(msg) {
  const handler = agentEventHandlers[msg.type];
  if (handler) {
    handler(msg);
  } else {
    console.warn('[WS] Evento desconocido:', msg.type);
  }
}

/**
 * Envía un comando al backend.
 * @param {string} type - Tipo de comando (ej. 'START_SCAN')
 * @param {object} payload - Datos del comando
 * @returns {boolean} - True si se envió correctamente
 */
function sendCommand(type, payload = {}) {
  if (socket?.readyState !== WebSocket.OPEN) {
    console.warn('[WS] No hay conexión para enviar', type);
    return false;
  }

  const command = { command: type, ...payload };
  socket.send(JSON.stringify(command));
  console.log('[WS] Enviado:', command);
  return true;
}

function initWsBridge() {
  connect();
  // Exponer función globalmente para que otros módulos envíen comandos
  window.sendScannerCommand = sendCommand;
}

export { initWsBridge };
