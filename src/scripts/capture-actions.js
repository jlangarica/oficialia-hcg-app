// src/scripts/capture-actions.js
import { $ } from './helpers.js';
import { AppState } from './state.js';

export function handleStartScan() {
  if (AppState.isScanning || !AppState.scannerOnline) return;

  const duplex = $('duplexSwitch') ? $('duplexSwitch').checked : false;
  const resolution = $('dpiSelect') ? parseInt($('dpiSelect').value, 10) : 300;

  AppState.isScanning = true;
  AppState.scanProgress = 10;
  AppState.pages = [];
  window.dispatchEvent(new CustomEvent('capture:scanStarted'));

  let sent = false;
  if (AppState.wsStatus === 'CONNECTED' && typeof window.sendScannerCommand === 'function') {
    sent = window.sendScannerCommand('START_SCAN', { duplex, resolution });
  }
  
  if (!sent) {
    handleCaptureFailure('El servidor local de escaneo no se encuentra disponible.');
  }
}

export function handleFileInject(event) {
  if (!event || !event.target || !event.target.files) return;
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  if (AppState.isScanning) return;

  AppState.isScanning = true;
  AppState.scanProgress = 15;
  AppState.pages = [];
  window.dispatchEvent(new CustomEvent('capture:scanStarted'));

  const reader = new FileReader();
  reader.onload = function () {
    let sent = false;
    if (AppState.wsStatus === 'CONNECTED' && typeof window.sendScannerCommand === 'function') {
      sent = window.sendScannerCommand('LOAD_LOCAL_PDF', { base64_data: reader.result });
    }
    if (!sent) {
      handleCaptureFailure('Error al transmitir el documento binario al servidor.');
    }
  };
  
  reader.onerror = () => handleCaptureFailure('Error crítico leyendo el archivo del sistema local.');
  reader.readAsDataURL(file);
}

function handleCaptureFailure(errorMsg) {
  window.dispatchEvent(new CustomEvent('capture:scanError', { detail: { message: errorMsg } }));
  window.dispatchEvent(new CustomEvent('toast:show', { detail: { message: errorMsg, type: 'error' } }));
}

export function initCaptureActions() {
  const fileInput = $('fileUploadInput');
  if (fileInput) fileInput.addEventListener('change', handleFileInject);
}
