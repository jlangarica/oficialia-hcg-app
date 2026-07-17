// preview-grid.js — Renderizado del grid de miniaturas + Drag & Drop
import { $, escapeHTML } from './helpers.js';
import { AppState } from './state.js';

/* Limpieza centralizada del estado visual de DnD */
function clearDragVisualState(grid) {
  if (!grid) return;
  const cards = grid.querySelectorAll('.page-thumb-card.dragging, .page-thumb-card.drag-over');
  for (let i = 0; i < cards.length; i++) {
    cards[i].classList.remove('dragging', 'drag-over');
  }
}

/**
 * Construye el HTML de una tarjeta de miniatura con sanitización Anti-XSS.
 */
function buildThumbCardHTML(page, index) {
  const rotation = typeof page.rotation === 'number' ? page.rotation : 0;
  const rotClass = rotation !== 0 ? ' visible' : '';
  const safeMime = escapeHTML(page.mime || 'image/png');
  const safeBase64 = escapeHTML(page.base64 || '');
  const safeIndex = parseInt(index, 10);
  const safeDisplayIndex = escapeHTML(String((page.pageIndex !== undefined ? page.pageIndex : safeIndex) + 1));

  return `<div class="page-thumb-card" draggable="true" data-grid-index="${safeIndex}">
    <span class="page-seq-badge">${safeIndex + 1}</span>
    <div class="page-thumb-img-wrap">
      <img src="data:${safeMime};base64,${safeBase64}" alt="Pagina ${safeDisplayIndex}" style="transform:rotate(${rotation}deg)" draggable="false"/>
      <div class="page-controls-overlay">
        <button class="page-ctrl-btn-overlay" data-action="rotate" data-index="${safeIndex}" title="Rotar 90"><span class="material-symbols-outlined">rotate_right</span></button>
        <button class="page-ctrl-btn-overlay btn-delete-overlay" data-action="delete" data-index="${safeIndex}" title="Eliminar"><span class="material-symbols-outlined">delete</span></button>
      </div>
    </div>
    <div class="page-thumb-footer">
      <span class="page-orig-label">Orig: Pág.${safeDisplayIndex}</span>
      <span class="page-rotation-badge${rotClass}">${rotation}°</span>
    </div>
  </div>`;
}

function renderPageGrid() {
  const grid = $('pageGrid');
  const empty = $('emptyPreview');
  const subtext = $('previewSubtext');
  const confirmBtn = $('confirmStructureBtn');
  if (!grid) return;

  grid.innerHTML = '';

  if (!Array.isArray(AppState.pages) || AppState.pages.length === 0) {
    grid.style.display = 'none';
    if (empty) empty.style.display = 'flex';
    if (subtext) subtext.textContent = 'No hay páginas para mostrar.';
    if (confirmBtn) confirmBtn.disabled = true;
    return;
  }

  grid.style.display = 'grid';
  if (empty) empty.style.display = 'none';
  if (subtext) subtext.textContent = `Se capturaron ${AppState.pages.length} páginas. Arrastra para reordenar.`;
  if (confirmBtn && !AppState.isSaving) confirmBtn.disabled = false;

  // DocumentFragment: una sola inserción al DOM (1 reflow en vez de N)
  const frag = document.createDocumentFragment();
  const pages = AppState.pages;

  for (let i = 0; i < pages.length; i++) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildThumbCardHTML(pages[i], i);
    frag.appendChild(wrapper.firstElementChild);
  }

  grid.appendChild(frag);

  // Delegación de eventos DnD: attach UNA sola vez
  if (!grid._dndDelegated) {
    setupDnDDelegation(grid);
    grid._dndDelegated = true;
  }
}

/**
 * Delegación centralizada de todos los eventos DnD.
 * 6 listeners en el contenedor padre reemplazan 6×N listeners individuales.
 */
function setupDnDDelegation(grid) {
  // Acciones de botones (rotate/delete) vía delegación
  grid.addEventListener('click', function (e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    e.stopPropagation();
    const idx = parseInt(btn.dataset.index, 10);
    if (!Number.isInteger(idx)) return;
    if (btn.dataset.action === 'rotate') {
      window.dispatchEvent(new CustomEvent('preview:rotatePage', { detail: { index: idx } }));
    } else if (btn.dataset.action === 'delete') {
      window.dispatchEvent(new CustomEvent('preview:deletePage', { detail: { index: idx } }));
    }
  });

  grid.addEventListener('dragstart', function (e) {
    const card = e.target.closest('.page-thumb-card');
    if (!card) return;
    const idx = parseInt(card.dataset.gridIndex, 10);
    AppState.draggedIndex = idx;
    card.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  });

  grid.addEventListener('dragend', function () {
    AppState.draggedIndex = null;
    clearDragVisualState(grid);
  });

  grid.addEventListener('dragover', function (e) {
    if (e.target.closest('.page-thumb-card')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }
  });

  grid.addEventListener('dragenter', function (e) {
    const card = e.target.closest('.page-thumb-card');
    if (!card) return;
    e.preventDefault();
    const idx = parseInt(card.dataset.gridIndex, 10);
    if (AppState.draggedIndex !== null && AppState.draggedIndex !== idx) {
      card.classList.add('drag-over');
    }
  });

  grid.addEventListener('dragleave', function (e) {
    const card = e.target.closest('.page-thumb-card');
    if (card && !card.contains(e.relatedTarget)) {
      card.classList.remove('drag-over');
    }
  });

  grid.addEventListener('drop', function (e) {
    e.preventDefault();
    const card = e.target.closest('.page-thumb-card');
    if (!card) return;
    const toIdx = parseInt(card.dataset.gridIndex, 10);
    const fromIdx = AppState.draggedIndex !== null
      ? AppState.draggedIndex
      : parseInt(e.dataTransfer.getData('text/plain'), 10);
    clearDragVisualState(grid);
    if (Number.isInteger(fromIdx) && fromIdx !== toIdx) {
      window.dispatchEvent(new CustomEvent('preview:reorderPages', { detail: { from: fromIdx, to: toIdx } }));
    }
  });
}

function initPreviewGrid() {
  window.addEventListener('preview:render', function () {
    renderPageGrid();
  });
}

export { renderPageGrid, initPreviewGrid };
