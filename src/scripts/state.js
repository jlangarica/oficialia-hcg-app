// src/scripts/state.js
/**
 * Estado global reactivo de la aplicación.
 * Centraliza los datos compartidos entre componentes.
 */

const AppState = {
  wsStatus: 'DISCONNECTED',
  scannerOnline: false,
  isScanning: false,
  scanProgress: 0,
  pages: [],
  rawPdfPath: null,
  draggedIndex: null,
  isSaving: false,
  lastSavedFolio: null,    // ← NUEVO: folio del último documento guardado
};

export { AppState };
