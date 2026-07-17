// preview-actions.js — Manipulación de páginas: rotar, eliminar, reordenar
import { AppState } from './state.js';

function isValidPageIndex(index) {
  return Number.isInteger(index) &&
         Array.isArray(AppState.pages) &&
         index >= 0 &&
         index < AppState.pages.length &&
         AppState.pages[index] !== undefined;
}

function rotatePage(index) {
  if (!isValidPageIndex(index)) {
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Error del sistema: Índice de página inválido', type: 'error' }
    }));
    return;
  }
  try {
    AppState.pages[index].rotation = (AppState.pages[index].rotation + 90) % 360;
    window.dispatchEvent(new CustomEvent('preview:render'));
  } catch(e) {
    console.error('[preview-actions] Fallo al aplicar rotación:', e);
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'No se pudo aplicar la rotación a la página.', type: 'error' }
    }));
  }
}

function deletePage(index) {
  if (!isValidPageIndex(index)) {
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Error del sistema: Intento de eliminar página inexistente', type: 'error' }
    }));
    return;
  }
  try {
    // Romper referencias pesadas ANTES de splice para facilitar GC del string Base64
    const removed = AppState.pages[index];
    if (removed) {
      removed.base64 = null;
      removed.mime = null;
    }
    AppState.pages.splice(index, 1);
    window.dispatchEvent(new CustomEvent('preview:render'));
  } catch (e) {
    console.error('[preview-actions] Fallo al eliminar página:', e);
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Fallo crítico al eliminar la página de la memoria.', type: 'error' }
    }));
  }
}

function reorderPages(fromIndex, toIndex) {
  if (!isValidPageIndex(fromIndex) || !isValidPageIndex(toIndex) || fromIndex === toIndex) {
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Error: Índice de reordenamiento no permitido', type: 'error' }
    }));
    return;
  }
  try {
    const movedPage = AppState.pages.splice(fromIndex, 1)[0];
    AppState.pages.splice(toIndex, 0, movedPage);
    AppState.draggedIndex = null;
    window.dispatchEvent(new CustomEvent('preview:render'));
  } catch (e) {
    console.error('[preview-actions] Error en el reordenamiento:', e);
    window.dispatchEvent(new CustomEvent('toast:show', {
      detail: { message: 'Error lógico al reordenar las páginas.', type: 'error' }
    }));
  }
}

function initPreviewActions() {
  window.addEventListener('preview:rotatePage', (e) => rotatePage(e.detail.index));
  window.addEventListener('preview:deletePage', (e) => deletePage(e.detail.index));
  window.addEventListener('preview:reorderPages', (e) => reorderPages(e.detail.from, e.detail.to));
}

export { rotatePage, deletePage, reorderPages, initPreviewActions };
