// src/scripts/archivo.js

/**
 * Módulo Archivo Documental — Orquestador principal.
 * Inicializa todos los sub-módulos del archivo cuando se activa la vista.
 */
import { initArchivoGrid } from './archivo-grid.js';
import { initArchivoFilters } from './archivo-filters.js';
import { initArchivoDrawer } from './archivo-drawer.js';

let isInitialized = false;

function initArchivoModule() {
  if (isInitialized) return;
  
  // Inicializar componentes
  initArchivoGrid();
  initArchivoFilters();
  initArchivoDrawer();
  
  isInitialized = true;
  
  console.log('[Archivo] Módulo inicializado');
}

// Escuchar evento de activación desde el router
window.addEventListener('archivo:activated', () => {
  initArchivoModule();
});

export { initArchivoModule };
