// src/scripts/archivo-grid.js

/**
 * Renderizado del data grid del Archivo Documental.
 * Usa DocumentFragment para rendimiento y CustomEvent para comunicación.
 */
import { escapeHTML } from './helpers.js';

const GRID_PER_PAGE = 7;

const ESTATUS_CONFIG = {
  pendiente: { label: 'Pendiente', class: 'estatus-pendiente' },
  revision: { label: 'En Revisión', class: 'estatus-revision' },
  procesado: { label: 'Procesado', class: 'estatus-procesado' }
};

function renderStatusBadge(estatus) {
  const config = ESTATUS_CONFIG[estatus] || { label: estatus, class: '' };
  return `<span class="archivo-estatus-badge ${escapeHTML(config.class)}">${escapeHTML(config.label)}</span>`;
}

function renderRow(item) {
  const tr = document.createElement('tr');
  tr.dataset.folio = item.folio;
  
  tr.innerHTML = `
    <td class="archivo-cell-folio"><span class="archivo-folio-code">${escapeHTML(item.folio)}</span></td>
    <td class="archivo-cell-fecha">${escapeHTML(item.fecha)}</td>
    <td class="archivo-cell-remitente">${escapeHTML(item.remitente)}</td>
    <td class="archivo-cell-asunto">${escapeHTML(item.asunto)}</td>
    <td class="archivo-cell-estatus">${renderStatusBadge(item.estatus)}</td>
    <td class="archivo-cell-acciones">
      <button class="archivo-action-btn archivo-view-btn" title="Ver documento" aria-label="Ver ${escapeHTML(item.folio)}">
        <span class="material-symbols-outlined">visibility</span>
      </button>
      <button class="archivo-action-btn archivo-download-btn" title="Descargar PDF" aria-label="Descargar ${escapeHTML(item.folio)}">
        <span class="material-symbols-outlined">download</span>
      </button>
    </td>
  `;
  
  return tr;
}

function renderGrid(rows) {
  const tbody = document.getElementById('archivoGridBody');
  const emptyState = document.getElementById('archivoEmptyState');
  const gridTable = document.getElementById('archivoGrid');
  
  if (!tbody) return;
  
  // Limpiar tbody usando DocumentFragment
  tbody.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  if (rows.length === 0) {
    gridTable?.classList.add('hidden');
    emptyState?.classList.remove('hidden');
  } else {
    gridTable?.classList.remove('hidden');
    emptyState?.classList.add('hidden');
    
    rows.forEach(item => {
      fragment.appendChild(renderRow(item));
    });
    
    tbody.appendChild(fragment);
  }
}

function renderPagination(paginationInfo) {
  const infoEl = document.getElementById('archivoPaginationInfo');
  const pagesEl = document.getElementById('archivoPaginationPages');
  const prevBtn = document.getElementById('archivoPrevPage');
  const nextBtn = document.getElementById('archivoNextPage');
  
  if (!infoEl || !pagesEl || !prevBtn || !nextBtn) return;
  
  const { page, totalPages, total, perPage } = paginationInfo;
  const start = total === 0 ? 0 : (page - 1) * perPage + 1;
  const end = Math.min(page * perPage, total);
  
  infoEl.textContent = `${start} - ${end} de ${total}`;
  
  // Renderizar números de página
  pagesEl.innerHTML = '';
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  
  // Ajustar si estamos cerca del final
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.className = `archivo-page-num ${i === page ? 'active' : ''}`;
    btn.textContent = i;
    btn.dataset.page = i;
    pagesEl.appendChild(btn);
  }
  
  // Botones prev/next
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
}

export function initArchivoGrid() {
  // Delegación de eventos para acciones en la tabla
  const gridBody = document.getElementById('archivoGridBody');
  if (gridBody) {
    gridBody.addEventListener('click', (e) => {
      const viewBtn = e.target.closest('.archivo-view-btn');
      const downloadBtn = e.target.closest('.archivo-download-btn');
      const row = e.target.closest('tr[data-folio]');
      
      if (!row) return;
      const folio = row.dataset.folio;
      
      if (viewBtn) {
        window.dispatchEvent(new CustomEvent('archivo:viewDocument', { detail: { folio } }));
      } else if (downloadBtn) {
        window.dispatchEvent(new CustomEvent('archivo:downloadDocument', { detail: { folio } }));
      }
    });
  }
  
  // Paginación click delegation
  const pagesContainer = document.getElementById('archivoPaginationPages');
  const prevBtn = document.getElementById('archivoPrevPage');
  const nextBtn = document.getElementById('archivoNextPage');
  
  if (pagesContainer) {
    pagesContainer.addEventListener('click', (e) => {
      const pageBtn = e.target.closest('.archivo-page-num');
      if (pageBtn) {
        const page = parseInt(pageBtn.dataset.page, 10);
        window.dispatchEvent(new CustomEvent('archivo:changePage', { detail: { page } }));
      }
    });
  }
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('archivo:prevPage'));
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('archivo:nextPage'));
    });
  }
}

export { renderGrid, renderPagination, GRID_PER_PAGE };
