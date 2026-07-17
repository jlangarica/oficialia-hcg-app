// src/scripts/capture-ui.js
import { $, escapeHTML } from './helpers.js';
import { AppState } from './state.js';
import { updateScanRing } from './progress-zoom.js';

function updateConnectionIndicators() {
  const serverBadge = $('serverStatusBadge');
  const serverDot = $('serverStatusDot');
  const serverText = $('serverStatusText');

  if (!serverBadge || !serverDot || !serverText) return;

  // 1. Manejar visualmente el estado del software (WebSocket)
  if (AppState.wsStatus === 'CONNECTED') {
    serverDot.style.background = 'var(--green)';
    serverDot.style.boxShadow = '0 0 6px rgba(50,215,75,0.4)';
    serverText.textContent = 'Servidor: Activo';
  } else if (AppState.wsStatus === 'CONNECTING') {
    serverDot.style.background = 'var(--orange)';
    serverDot.style.boxShadow = '0 0 6px rgba(255,159,10,0.4)';
    serverText.textContent = 'Servidor: Conectando...';
  } else {
    serverDot.style.background = 'var(--red)';
    serverDot.style.boxShadow = '0 0 6px rgba(255,69,58,0.4)';
    serverText.textContent = 'Servidor: Offline';
    
    // Si el servidor cae, por defecto el hardware también está offline
    updateHardwareIndicator(false, 'Desconectado');
  }
}

function updateHardwareIndicator(online, modelName) {
  const hwBadge = $('hardwareStatusBadge');
  const hwDot = $('hardwareStatusDot');
  const hwText = $('hardwareStatusText');
  const modelTag = $('scannerModelTag');
  const activeName = $('activeScannerName');

  if (!hwBadge || !hwDot || !hwText || !modelTag || !activeName) return;

  if (online) {
    hwBadge.style.opacity = '1';
    hwDot.style.background = 'var(--green)';
    hwDot.style.boxShadow = '0 0 6px rgba(50,215,75,0.4)';
    hwText.textContent = 'Escáner: Listo';
    
    // Mostrar el tag del modelo real detectado a la derecha
    modelTag.style.display = 'flex';
    activeName.textContent = modelName;
  } else {
    hwBadge.style.opacity = '0.6';
    hwDot.style.background = 'var(--red)';
    hwDot.style.boxShadow = 'none';
    hwText.textContent = 'Escáner: Offline';
    
    modelTag.style.display = 'none';
  }
}

function updateCaptureUI() {
  const btn = $('scanActionButton');
  if (!btn) return;
  const icon = $('scanActionIcon');
  const label = $('scanActionLabel');
  const hint = $('scanActionHint');
  const progressTrack = $('scanProgressTrack');
  const progressFill = $('scanProgressFill');
  const fileLabel = $('fileUploadLabel');
  const duplexSwitch = $('duplexSwitch');
  const dpiSelect = $('dpiSelect');

  const isConnected = AppState.wsStatus === 'CONNECTED';
  const isScanning = AppState.isScanning;
  const progress = AppState.scanProgress;

  // Remover estados previos
  btn.classList.remove('is-scanning', 'is-disabled');
  btn.disabled = false;

  if (isScanning) {
    btn.classList.add('is-scanning');
    if (icon) icon.innerHTML = `<div class="scan-progress-ring"><svg viewBox="0 0 72 72"><circle class="ring-bg" cx="36" cy="36" r="32"></circle><circle class="ring-fg" id="scanRingFg" cx="36" cy="36" r="32"></circle></svg><span class="scan-progress-text" id="scanRingText">${progress}%</span></div>`;
    if (label) label.textContent = 'Ingestando Canal Físico...';
    if (hint) hint.textContent = `Progreso: ${progress}%`;
  } else {
    if (icon) icon.innerHTML = '<span class="material-symbols-outlined">scanner</span>';
    if (label) label.textContent = 'Iniciar Digitalización Física';
    
    // ════════════════════════════════════════════════════════════════
    // GUARDRAIL: Si no hay escáner físico detectado, deshabilitar botón
    // ════════════════════════════════════════════════════════════════
    if (!isConnected || !AppState.scannerOnline) {
      btn.classList.add('is-disabled');
      btn.disabled = true; 
      if (hint) hint.textContent = 'Hardware no disponible. Conecte el escáner.';
    } else {
      if (hint) hint.textContent = 'Detección automática A4 / Letter';
    }
  }

  // Barra de progreso
  if (progressTrack) progressTrack.classList.toggle('visible', isScanning);
  if (progressFill) progressFill.style.width = isScanning ? progress + '%' : '0%';

  // Carga de archivo PDF: Habilitada si el servidor responde, sin importar el escáner físico
  if (fileLabel) {
    const canUpload = isConnected && !isScanning;
    fileLabel.classList.toggle('is-disabled', !canUpload);
  }
  
  if (duplexSwitch) duplexSwitch.disabled = isScanning || !AppState.scannerOnline;
  if (dpiSelect) dpiSelect.disabled = isScanning || !AppState.scannerOnline;
}

function initCaptureUI() {
  window.addEventListener('capture:updateUI', () => updateCaptureUI());
  window.addEventListener('capture:scanStarted', () => {
    AppState.isScanning = true;
    AppState.scanProgress = 10;
    updateCaptureUI();
  });
  window.addEventListener('capture:scanProgress', (e) => {
    if (e.detail && typeof e.detail.progress === 'number') {
      AppState.scanProgress = e.detail.progress;
      updateScanRing(e.detail.progress);
    }
    updateCaptureUI();
  });
  window.addEventListener('capture:scanError', (e) => {
    AppState.isScanning = false;
    AppState.scanProgress = 0;
    updateCaptureUI();
  });
  window.addEventListener('ws:statusChanged', () => {
    updateCaptureUI();
    updateConnectionIndicators();
  });
  window.addEventListener('hardware:statusChanged', (e) => {
    AppState.scannerOnline = e.detail.online;
    updateCaptureUI();
    updateHardwareIndicator(e.detail.online, e.detail.model);
  });
}

export { updateCaptureUI, initCaptureUI };
