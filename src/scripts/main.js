/ src/scripts/main.js
/**
 * Punto de entrada principal del frontend.
 * Inicializa módulos y expone APIs globales necesarias para HTML inline.
 */

import { initCapture } from './capture.js';
import { initPreviewConfirm } from './preview-confirm.js';
import { initWizard, goToStep, resetWizard } from './wizard.js';
import { initWsBridge } from './ws-bridge.js';
import { initSaveDocument, handleSaveDocument } from './save-document.js';
import { initToast } from './toast.js';

document.addEventListener('DOMContentLoaded', () =&gt; {
  console.log('🚀 Inicializando Oficialía Digital...');

  // Inicializar módulos base
  initToast();
  initWsBridge();
  initCapture();
  initPreviewConfirm();
  initSaveDocument();
  initWizard();

  // Exponer funciones globales para handlers inline en HTML
  window.goToStep = goToStep;
  window.resetWizard = resetWizard;
  window.handleSaveDocument = handleSaveDocument;
  
  // Exposición existente para re-escaneo desde botones inline
  window.handleReScan = () =&gt; resetWizard(); 
});