// state.js — Contrato inmutable de estado de la aplicación
const AppState = {
  wsStatus: 'DISCONNECTED',   // CONNECTING | CONNECTED | DISCONNECTED
  scannerOnline: false,       // ◄ CONTROL DE PRESENCIA FÍSICA DEL ESCÁNER
  isScanning: false,
  scanProgress: 0,
  pages: [],                   // [{pageIndex, mime, base64, rotation}]
  rawPdfPath: null,
  draggedIndex: null,
  isSaving: false,
  lastSavedFolio: null,        // ← NUEVO: folio del último documento guardado
};

export { AppState };
