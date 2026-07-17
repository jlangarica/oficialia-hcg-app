// main.js — Entry point: importa estilos y orquesta la inicialización

// ─── Importación de CSS (orden importa: tokens primero) ───
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/ambient.css';
import '../styles/app-window.css';
import '../styles/sidebar.css';
import '../styles/main-header.css';
import '../styles/glass-card.css';
import '../styles/step-capture.css';
import '../styles/step-preview.css';
import '../styles/step-ai.css';
import '../styles/step-validate.css';
import '../styles/step-success.css';
import '../styles/stagger.css';
import '../styles/toast.css';
import '../styles/scan-progress-ring.css';
import '../styles/page-controls.css';
import '../styles/responsive.css';
import '../styles/accessibility.css';

// ─── Importación de módulos de lógica ───
import { initWizard, goToStep } from './wizard.js';
import { initToast } from './toast.js';
import { adjustZoom } from './progress-zoom.js';
import { initCaptureUI } from './capture-ui.js';
import { initCaptureActions, handleStartScan, handleFileInject } from './capture-actions.js';
import { initPreviewGrid } from './preview-grid.js';
import { initPreviewActions } from './preview-actions.js';
import { initPreviewConfirm, handleConfirmStructure, handleReScan } from './preview-confirm.js';
import { toggleTheme, initTheme } from './theme.js';
import { initRevealObserver } from './reveal.js';
import { initWsBridge } from './ws-bridge.js';

// ─── Exponer funciones globales requeridas por onclick inline del HTML ───
window.goToStep = goToStep;
window.toggleTheme = toggleTheme;
window.handleStartScan = handleStartScan;
window.handleFileInject = handleFileInject;
window.handleConfirmStructure = handleConfirmStructure;
window.handleReScan = handleReScan;
window.adjustZoom = adjustZoom;

// ─── Inicialización de la aplicación ───
document.addEventListener('DOMContentLoaded', () => {
  // Restaurar tema persistido
  initTheme();

  // Inicializar sistema de reveal/stagger
  initRevealObserver();

  // Inicializar módulos (registra sus Custom Event listeners)
  initWizard();
  initToast();
  initCaptureUI();
  initCaptureActions();
  initPreviewGrid();
  initPreviewActions();
  initPreviewConfirm();

  // Conectar al agente local de escáner (último para que los demás módulos tengan sus listeners listos)
  initWsBridge();
});
