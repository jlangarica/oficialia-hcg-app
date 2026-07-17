// validate-pdf-viewer.js — Visor de PDF real con pdf.js y highlights dinámicos
import { $ } from './helpers.js';
import { AppState } from './state.js';

// Importar pdf.js desde node_modules (Vite resolverá la ruta)
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de pdf.js desde CDN para evitar problemas de build
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.59/pdf.worker.min.js';

/**
 * Estado interno del visor
 */
let pdfDoc = null;
let currentPage = 1;
let currentZoom = 100;
let extractedFields = []; // [{page, x, y, width, height, fieldName, confidence}]

/**
 * Renderiza una página específica del PDF en un canvas
 * @param {number} pageNum - Número de página (1-based)
 * @param {HTMLCanvasElement} canvas - Elemento canvas donde renderizar
 * @param {number} scale - Factor de escala (zoom)
 */
async function renderPage(pageNum, canvas, scale) {
  if (!pdfDoc) return;

  try {
    const page = await pdfDoc.getPage(pageNum);
    
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport
    };

    await page.render(renderContext).promise;
    
    return page;
  } catch (error) {
    console.error('[PDF Viewer] Error al renderizar página:', error);
    throw error;
  }
}

/**
 * Crea un elemento highlight para un campo extraído
 * @param {Object} field - Campo con coordenadas y metadatos
 * @param {number} scale - Factor de escala actual
 * @returns {HTMLDivElement} Elemento highlight
 */
function createHighlight(field, scale) {
  const highlight = document.createElement('div');
  highlight.className = 'ai-highlight-dynamic';
  highlight.dataset.fieldName = field.fieldName || 'unknown';
  highlight.dataset.confidence = field.confidence || 0;
  
  // Las coordenadas vienen del backend (normalizadas 0-1 o en puntos PDF)
  // Asumimos formato: {x, y, width, height} en unidades de puntos PDF (72 DPI)
  // pdf.js usa viewport que puede tener scale aplicado
  
  // Posicionamiento absoluto relativo al canvas
  const x = field.x * scale;
  const y = field.y * scale;
  const w = field.width * scale;
  const h = field.height * scale;
  
  highlight.style.left = `${x}px`;
  highlight.style.top = `${y}px`;
  highlight.style.width = `${w}px`;
  highlight.style.height = `${h}px`;
  
  // Color según confianza
  const confidence = field.confidence || 0;
  if (confidence < 0.5) {
    highlight.style.borderColor = 'var(--orange)';
    highlight.style.backgroundColor = 'rgba(255, 159, 10, 0.15)';
  } else if (confidence < 0.8) {
    highlight.style.borderColor = 'var(--blue)';
    highlight.style.backgroundColor = 'rgba(10, 132, 255, 0.12)';
  } else {
    highlight.style.borderColor = 'var(--green)';
    highlight.style.backgroundColor = 'rgba(52, 199, 89, 0.12)';
  }
  
  // Tooltip con información del campo
  highlight.title = `${field.fieldName || 'Campo'}\nConfianza: ${(confidence * 100).toFixed(0)}%`;
  
  return highlight;
}

/**
 * Carga y renderiza el PDF completo en el contenedor
 * @param {string} pdfPath - Ruta o URL del PDF a cargar
 * @param {Array} fields - Campos extraídos con coordenadas
 */
async function loadPDF(pdfPath, fields = []) {
  const container = $('.pdf-canvas');
  if (!container) {
    console.error('[PDF Viewer] Contenedor .pdf-canvas no encontrado');
    return;
  }

  // Limpiar contenido previo
  container.innerHTML = '';
  extractedFields = fields || [];

  try {
    // Determinar la fuente del PDF
    let pdfSource = pdfPath;
    
    // Si es una ruta local absoluta del sistema de archivos, necesitamos servirla via backend
    // En desarrollo, asumimos que el backend expone el PDF en /api/pdf/raw o similar
    if (pdfPath && typeof pdfPath === 'string') {
      // Detectar si es ruta absoluta de filesystem (Windows o Unix)
      if (pdfPath.startsWith('/') || pdfPath.match(/^[A-Z]:\\/i)) {
        // Usar endpoint del backend para servir el archivo
        // El backend debe exponer un endpoint estático o streaming
        pdfSource = `/api/pdf/raw?path=${encodeURIComponent(pdfPath)}`;
      }
    } else if (AppState.rawPdfPath) {
      pdfSource = `/api/pdf/raw?path=${encodeURIComponent(AppState.rawPdfPath)}`;
    } else {
      console.warn('[PDF Viewer] No hay ruta de PDF disponible, usando demo');
      return;
    }

    // Cargar documento con pdf.js
    const loadingTask = pdfjsLib.getDocument(pdfSource);
    pdfDoc = await loadingTask.promise;
    
    console.log('[PDF Viewer] PDF cargado:', pdfDoc.numPages, 'páginas');

    // Crear contenedor para todas las páginas
    const pagesContainer = document.createElement('div');
    pagesContainer.className = 'pdf-pages-container';
    pagesContainer.style.display = 'flex';
    pagesContainer.style.flexDirection = 'column';
    pagesContainer.style.alignItems = 'center';
    pagesContainer.style.gap = '20px';
    pagesContainer.style.padding = '20px';

    // Renderizar cada página
    const scale = currentZoom / 100;
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      // Contenedor de página individual
      const pageWrapper = document.createElement('div');
      pageWrapper.className = 'pdf-page-wrapper';
      pageWrapper.style.position = 'relative';
      pageWrapper.style.boxShadow = 'var(--shadow-lg)';
      pageWrapper.style.borderRadius = 'var(--r-sm)';
      pageWrapper.style.overflow = 'hidden';
      
      // Canvas para renderizar la página
      const canvas = document.createElement('canvas');
      canvas.id = `pdfCanvas-page-${pageNum}`;
      canvas.className = 'pdf-render-canvas';
      
      pageWrapper.appendChild(canvas);
      
      // Renderizar la página
      await renderPage(pageNum, canvas, scale);
      
      // Añadir highlights para esta página
      const pageFields = extractedFields.filter(f => f.page === pageNum || f.page === pageNum - 1);
      pageFields.forEach(field => {
        const highlight = createHighlight(field, scale);
        pageWrapper.appendChild(highlight);
      });
      
      pagesContainer.appendChild(pageWrapper);
    }

    container.appendChild(pagesContainer);
    
    // Actualizar UI de zoom
    updateZoomUI();
    
    window.dispatchEvent(new CustomEvent('pdfviewer:loaded', {
      detail: { pages: pdfDoc.numPages, path: pdfPath }
    }));
    
  } catch (error) {
    console.error('[PDF Viewer] Error al cargar PDF:', error);
    
    // Fallback: mostrar mensaje de error amigable
    container.innerHTML = `
      <div class="pdf-error-state">
        <span class="material-symbols-outlined">error_outline</span>
        <p>No se pudo cargar el documento PDF</p>
        <small>${error.message}</small>
      </div>
    `;
    
    window.dispatchEvent(new CustomEvent('pdfviewer:error', {
      detail: { error: error.message }
    }));
  }
}

/**
 * Actualiza el zoom de todas las páginas renderizadas
 * @param {number} newZoom - Nuevo porcentaje de zoom
 */
function updateZoom(newZoom) {
  currentZoom = Math.max(50, Math.min(200, newZoom));
  
  if (!pdfDoc) return;
  
  // Re-renderizar todas las páginas con el nuevo zoom
  const canvases = document.querySelectorAll('.pdf-render-canvas');
  const pageWrappers = document.querySelectorAll('.pdf-page-wrapper');
  
  const scale = currentZoom / 100;
  
  canvases.forEach((canvas, index) => {
    const pageNum = index + 1;
    renderPage(pageNum, canvas, scale).then(() => {
      // Actualizar posición de highlights
      const pageFields = extractedFields.filter(f => f.page === pageNum || f.page === pageNum - 1);
      
      // Eliminar highlights existentes
      const existingHighlights = pageWrappers[index].querySelectorAll('.ai-highlight-dynamic');
      existingHighlights.forEach(h => h.remove());
      
      // Añadir nuevos highlights con escala actualizada
      pageFields.forEach(field => {
        const highlight = createHighlight(field, scale);
        pageWrappers[index].appendChild(highlight);
      });
    });
  });
  
  updateZoomUI();
}

// Exponer globalmente para que progress-zoom.js pueda llamarlo
window.updatePDFZoom = updateZoom;

/**
 * Actualiza el indicador visual de zoom
 */
function updateZoomUI() {
  const zoomEl = $('zoomValue');
  if (zoomEl) {
    zoomEl.textContent = `${currentZoom}%`;
  }
}

/**
 * Obtiene los campos extraídos para una página específica
 * @param {number} pageNum - Número de página
 * @returns {Array} Campos de la página
 */
function getFieldsForPage(pageNum) {
  return extractedFields.filter(f => f.page === pageNum || f.page === pageNum - 1);
}

/**
 * Resalta un campo específico (para validación interactiva)
 * @param {string} fieldName - Nombre del campo a resaltar
 */
function highlightField(fieldName) {
  const highlights = document.querySelectorAll('.ai-highlight-dynamic');
  highlights.forEach(h => {
    if (h.dataset.fieldName === fieldName) {
      h.style.animation = 'pulse-highlight 1s ease-in-out infinite';
      h.style.opacity = '1';
    } else {
      h.style.animation = 'none';
      h.style.opacity = '0.6';
    }
  });
}

/**
 * Limpia todos los highlights
 */
function clearHighlights() {
  const highlights = document.querySelectorAll('.ai-highlight-dynamic');
  highlights.forEach(h => {
    h.style.animation = 'none';
    h.style.opacity = '1';
  });
}

/**
 * Inicializa el visor de PDF y escucha eventos de navegación
 */
function initValidatePDFViewer() {
  // Escuchar cuando se navega al paso 4 (Validar)
  window.addEventListener('wizard:stepChanged', async (e) => {
    if (e.detail.to === 4) {
      // Pequeño delay para asegurar que el DOM está listo
      setTimeout(async () => {
        const pdfPath = AppState.rawPdfPath;
        
        if (pdfPath) {
          // En producción, los campos vendrían del backend después del procesamiento IA
          // Por ahora, usamos datos simulados para demostración
          const mockFields = [
            { page: 1, x: 50, y: 78, width: 200, height: 20, fieldName: 'folio', confidence: 0.95 },
            { page: 1, x: 50, y: 120, width: 180, height: 20, fieldName: 'remitente', confidence: 0.45 },
            { page: 1, x: 50, y: 160, width: 150, height: 20, fieldName: 'fecha', confidence: 0.88 },
            { page: 1, x: 50, y: 200, width: 250, height: 40, fieldName: 'asunto', confidence: 0.92 }
          ];
          
          await loadPDF(pdfPath, mockFields);
        } else {
          console.warn('[PDF Viewer] No hay PDF disponible en AppState.rawPdfPath');
        }
      }, 100);
    }
  });
  
  // Escuchar actualización de campos desde el backend (cuando la IA termina)
  window.addEventListener('ai:extractionComplete', (e) => {
    if (e.detail && e.detail.fields) {
      extractedFields = e.detail.fields;
      // Re-renderizar highlights si el PDF ya está cargado
      if (pdfDoc) {
        loadPDF(AppState.rawPdfPath, extractedFields);
      }
    }
  });
}

export { initValidatePDFViewer, loadPDF, updateZoom, highlightField, clearHighlights, getFieldsForPage };
