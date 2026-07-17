// src/scripts/archivo-filters.js

/**
 * Gestión de búsqueda, filtros y paginación del Archivo Documental.
 * Orquesta las interacciones del usuario con el servicio de datos.
 */
import { ArchivoService } from './archivo-data.js';
import { renderGrid, renderPagination, GRID_PER_PAGE } from './archivo-grid.js';

let currentPage = 1;
let currentFilters = {
  search: '',
  fechaDesde: '',
  fechaHasta: '',
  estatus: ''
};

function applyFilters() {
  const filtered = ArchivoService.filter(currentFilters);
  const paginated = ArchivoService.paginate(filtered, currentPage, GRID_PER_PAGE);
  
  renderGrid(paginated.rows);
  renderPagination({
    page: paginated.page,
    totalPages: paginated.totalPages,
    total: paginated.total,
    perPage: paginated.perPage
  });
}

function resetFilters() {
  currentPage = 1;
  currentFilters = {
    search: '',
    fechaDesde: '',
    fechaHasta: '',
    estatus: ''
  };
  
  // Reset UI inputs
  const searchInput = document.getElementById('archivoSearchInput');
  const fechaDesde = document.getElementById('archivoFechaDesde');
  const fechaHasta = document.getElementById('archivoFechaHasta');
  const estatusSelect = document.getElementById('archivoEstatus');
  
  if (searchInput) searchInput.value = '';
  if (fechaDesde) fechaDesde.value = '';
  if (fechaHasta) fechaHasta.value = '';
  if (estatusSelect) estatusSelect.value = '';
  
  applyFilters();
}

export function initArchivoFilters() {
  // Búsqueda con debounce
  let searchTimeout;
  const searchInput = document.getElementById('archivoSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = e.target.value.trim();
        currentPage = 1;
        applyFilters();
      }, 300);
    });
  }
  
  // Filtro fecha desde
  const fechaDesde = document.getElementById('archivoFechaDesde');
  if (fechaDesde) {
    fechaDesde.addEventListener('change', (e) => {
      currentFilters.fechaDesde = e.target.value;
      currentPage = 1;
      applyFilters();
    });
  }
  
  // Filtro fecha hasta
  const fechaHasta = document.getElementById('archivoFechaHasta');
  if (fechaHasta) {
    fechaHasta.addEventListener('change', (e) => {
      currentFilters.fechaHasta = e.target.value;
      currentPage = 1;
      applyFilters();
    });
  }
  
  // Filtro estatus
  const estatusSelect = document.getElementById('archivoEstatus');
  if (estatusSelect) {
    estatusSelect.addEventListener('change', (e) => {
      currentFilters.estatus = e.target.value;
      currentPage = 1;
      applyFilters();
    });
  }
  
  // Botón reset
  const resetBtn = document.getElementById('archivoResetFilters');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }
  
  // Listener para cambio de página desde grid
  window.addEventListener('archivo:changePage', (e) => {
    currentPage = e.detail.page;
    applyFilters();
  });
  
  window.addEventListener('archivo:prevPage', () => {
    if (currentPage > 1) {
      currentPage--;
      applyFilters();
    }
  });
  
  window.addEventListener('archivo:nextPage', () => {
    const filtered = ArchivoService.filter(currentFilters);
    const paginated = ArchivoService.paginate(filtered, currentPage, GRID_PER_PAGE);
    if (currentPage < paginated.totalPages) {
      currentPage++;
      applyFilters();
    }
  });
  
  // Carga inicial
  applyFilters();
}

export { applyFilters, resetFilters };
