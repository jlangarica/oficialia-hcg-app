// ws-bridge.js — WebSocket Local Bridge con reconexión exponencial
import { $, escapeHTML } from './helpers.js';
import { AppState } from './state.js';
import { restoreConfirmBtn } from './preview-confirm.js';

const WS_URL = 'ws://localhost:8000';
const BACKOFF_BASE_MS = 1000;
const BACKOFF_FACTOR = 2;
const BACKOFF_MAX_MS = 15000;
const JITTER_RATIO = 0.25;

let ws = null;
let reconnectTimer = null;
let reconnectAttempts = 0;

// Cache de referencias DOM corregido con los IDs reales de MainHeader.html
const domRef = {
  statusDot: null,
  statusText: null,
  statusBadge: null,
  _init: function () {
    if (!this.statusDot) {
      this._statusDot = $('serverStatusDot');
      this.statusText = $('serverStatusText');
      this.statusBadge = $('serverStatusBadge');
    }
  }
};

// La actualización de indicadores visuales (server badge, hardware badge)
// la gestiona capture-ui.js mediante los eventos ws:statusChanged y
// hardware:statusChanged. Aquí solo despachamos los eventos.

function syncConnectionUI() {
  window.dispatchEvent(new CustomEvent('capture:updateUI'));
}

function teardownSocket() {
  if (!ws) return;
  ws.onopen = null;
  ws.onmessage = null;
  ws.onclose = null;
  ws.onerror = null;
  try {
    if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
      ws.close();
    }
  } catch (e) { /* noop */ }
  ws = null;
}

function cancelReconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  const exponential = Math.min(BACKOFF_BASE_MS * Math.pow(BACKOFF_FACTOR, reconnectAttempts), BACKOFF_MAX_MS);
  const jitter = exponential * JITTER_RATIO * (Math.random() * 2 - 1);
  const delay = Math.max(250, Math.round(exponential + jitter));
  reconnectAttempts++;
  reconnectTimer = setTimeout(function () {
    reconnectTimer = null;
    connect();
  }, delay);
}

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
  cancelReconnect();
  teardownSocket();

  AppState.wsStatus = 'CONNECTING';
  window.dispatchEvent(new CustomEvent('ws:statusChanged', {
    detail: { status: 'CONNECTING' }
  }));

  try {
    ws = new WebSocket(WS_URL);
  } catch (e) {
    AppState.wsStatus = 'DISCONNECTED';
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Problema al inicializar conexión con agente de hardware.', type: 'error' }
    }));
    scheduleReconnect();
    return;
  }

  ws.onopen = function () {
    AppState.wsStatus = 'CONNECTED';
    reconnectAttempts = 0;
    cancelReconnect();
    window.dispatchEvent(new CustomEvent('ws:statusChanged', {
      detail: { status: 'CONNECTED' }
    }));
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Agente local conectado', type: 'success' }
    }));
  };

  ws.onmessage = function (event) {
    let msg;
    try {
      msg = JSON.parse(event.data);
    } catch (err) {
      console.error('[WS] Error al parsear mensaje:', err);
      return;
    }
    routeAgentEvent(msg);
  };

  ws.onclose = function () {
    ws = null;
    AppState.wsStatus = 'DISCONNECTED';
    AppState.scannerOnline = false; // ◄ Seguro: si no hay servidor, el hardware cae
    window.dispatchEvent(new CustomEvent('ws:statusChanged', { detail: { status: 'DISCONNECTED' } }));
    scheduleReconnect();
  };

  ws.onerror = function () {
    try { if (ws) ws.close(); } catch (e) { /* noop */ }
  };
}

const agentEventHandlers = {
  'HARDWARE_STATUS': function (msg) {
    window.dispatchEvent(new CustomEvent('hardware:statusChanged', {
      detail: {
        online: msg.online,
        model: msg.model
      }
    }));
  },

  // CORREGIDO: Renombrado a 'SCAN_ACKNOWLEDGED' para evitar colisión
  // con el evento 'capture:scanStarted' despachado por el frontend.
  // El servidor solo confirma la recepción; NO re-inicia el estado.
  'SCAN_STARTED': function () {
    // Solo actualizamos el progreso si el servidor envía un valor
    // más alto que el actual (evitar retroceso visual).
    if (AppState.scanProgress < 25) {
      AppState.scanProgress = 25;
    }
    window.dispatchEvent(new CustomEvent('capture:scanProgress', {
      detail: { progress: AppState.scanProgress }
    }));
  },

  'scan_status': function (msg) {
    if (typeof msg.progress === 'number' && isFinite(msg.progress)) {
      // Solo avanzar el progreso, nunca retroceder
      const clamped = Math.max(0, Math.min(95, Math.round(msg.progress)));
      if (clamped > AppState.scanProgress) {
        AppState.scanProgress = clamped;
      }
    }
    window.dispatchEvent(new CustomEvent('capture:scanProgress', {
      detail: {
        progress: AppState.scanProgress,
        message: msg.message ? escapeHTML(msg.message) : undefined
      }
    }));
  },

  'SCAN_COMPLETED': function (msg) {
    AppState.scanProgress = 85;
    if (msg.output_path) AppState.rawPdfPath = msg.output_path;
    window.dispatchEvent(new CustomEvent('capture:scanCompleted', {
      detail: { output_path: msg.output_path ? escapeHTML(msg.output_path) : null }
    }));
  },

  'SCAN_ERROR': function (msg) { handleAgentError(msg); },
  'error': function (msg) { handleAgentError(msg); },

  'THUMBNAILS_READY': function (msg) {
    AppState.scanProgress = 100;
    if (Array.isArray(msg.pages)) {
      const validPages = [];
      const raw = msg.pages;
      for (let i = 0; i < raw.length; i++) {
        const p = raw[i];
        if (p && (p.base64 || p.mime)) {
          validPages.push({
            pageIndex: p.page_index != null ? p.page_index : (p.pageIndex != null ? p.pageIndex : 0),
            mime: p.mime || 'image/png',
            base64: p.base64 || '',
            rotation: 0
          });
        }
      }
      AppState.pages = validPages;
      const badge = $('pageBadge');
      if (badge) badge.textContent = AppState.pages.length;
    }
    window.dispatchEvent(new CustomEvent('capture:updateUI'));

    setTimeout(function () {
      AppState.isScanning = false;
      AppState.scanProgress = 0;
      window.dispatchEvent(new CustomEvent('capture:updateUI'));
      window.dispatchEvent(new CustomEvent('wizard:navigate', {
        detail: { targetStep: 2 }
      }));
    }, 500);
  },

  'EDITS_APPLIED': function (msg) {
    AppState.isSaving = false;
    if (msg.output_path) AppState.rawPdfPath = msg.output_path;
    restoreConfirmBtn();
    console.log('[WS] Estructura aplicada. PDF final en:', msg.output_path);
    window.dispatchEvent(new CustomEvent('wizard:navigate', {
      detail: { targetStep: 3 }
    }));
  },

  'scan-complete': function () {
    window.dispatchEvent(new CustomEvent('wizard:navigate', {
      detail: { targetStep: 2 }
    }));
  }
};

function handleAgentError(msg) {
  AppState.isScanning = false;
  AppState.scanProgress = 0;
  AppState.isSaving = false;
  restoreConfirmBtn();
  window.dispatchEvent(new CustomEvent('capture:updateUI'));
  const safeErrorMsg = escapeHTML(msg.message || 'Fallo en canal físico');
  window.dispatchEvent(new CustomEvent('toast:show', {
    detail: { message: `Error de Oficialía: ${safeErrorMsg}`, type: 'error' }
  }));
}

function routeAgentEvent(msg) {
  if (!msg || typeof msg !== 'object') return;
  const handler = agentEventHandlers[msg.event || ''];
  if (handler) {
    try {
      handler(msg);
    } catch (err) {
      console.error(`[WS] Excepción en handler de evento "${msg.event}":`, err);
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: { message: 'Se encontró un error procesando la respuesta del escáner.', type: 'error' }
      }));
    }
  } else {
    console.log('[WS] Evento no manejado:', msg.event, msg);
  }
}

function sendScannerCommand(command, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(Object.assign({ command: command }, payload || {})));
    console.log('[WS] Comando enviado:', command);
    return true;
  }
  console.warn('[WS] Agente Local fuera de línea. Comando no enviado:', command);
  return false;
}

function initWsBridge() {
  // ════════════════════════════════════════════════════════════════
  // VINCULACIÓN GLOBAL: Permitir que capture-actions.js encuentre la función
  // ════════════════════════════════════════════════════════════════
  window.sendScannerCommand = sendScannerCommand;


  connect();
}

export { connect, sendScannerCommand, initWsBridge };
