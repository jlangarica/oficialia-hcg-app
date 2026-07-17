// src/scripts/archivo-drawer.js

/**
 * Drawer slide-over para visualizar documentos del Archivo.
 * Muestra PDF, metadatos y JSON Diff Viewer (si existe).
 */
import { ArchivoService } from './archivo-data.js';
import { escapeHTML } from './helpers.js';

let currentFolio = null;

function openDrawer(folio) {
  const doc = ArchivoService.getByFolio(folio);
  if (!doc) return;
  
  currentFolio = folio;
  
  const drawer = document.getElementById('archivoDrawer');
  const overlay = document.getElementById('archivoDrawerOverlay');
  const title = document.getElementById('archivoDrawerTitle');
  const pdfFrame = document.getElementById('archivoPdfFrame');
  const metadataList = document.getElementById('archivoMetadataList');
  const diffSection = document.getElementById('archivoDiffSection');
  const diffViewer = document.getElementById('archivoDiffViewer');
  
  if (!drawer || !overlay) return;
  
  // Actualizar título
  if (title) {
    title.textContent = `Detalle de ${escapeHTML(doc.folio)}`;
  }
  
  // Cargar PDF (en producción usar URL real)
  if (pdfFrame) {
    // Para demo: si no existe el PDF, mostrar placeholder
    pdfFrame.src = doc.pdfUrl || 'about:blank';
  }
  
  // Renderizar metadatos
  if (metadataList && doc.metadatos) {
    metadataList.innerHTML = '';
    const fragment = document.createDocumentFragment();
    
    const metaEntries = Object.entries(doc.metadatos);
    metaEntries.forEach(([key, value]) => {
      const dt = document.createElement('dt');
      dt.className = 'archivo-metadata-key';
      dt.textContent = formatKey(key);
      
      const dd = document.createElement('dd');
      dd.className = 'archivo-metadata-value';
      dd.textContent = formatValue(value);
      
      fragment.appendChild(dt);
      fragment.appendChild(dd);
    });
    
    metadataList.appendChild(fragment);
  }
  
  // Mostrar Diff Viewer si existe aiDiff
  if (diffSection && diffViewer && doc.aiDiff) {
    diffSection.classList.remove('hidden');
    renderDiffViewer(diffViewer, doc.aiDiff);
  } else if (diffSection) {
    diffSection.classList.add('hidden');
  }
  
  // Abrir drawer con animación
  overlay.classList.remove('hidden');
  drawer.classList.remove('closed');
  document.body.style.overflow = 'hidden';
}

function closeDrawer() {
  const drawer = document.getElementById('archivoDrawer');
  const overlay = document.getElementById('archivoDrawerOverlay');
  const pdfFrame = document.getElementById('archivoPdfFrame');
  
  if (drawer) {
    drawer.classList.add('closed');
  }
  if (overlay) {
    overlay.classList.add('hidden');
  }
  
  // Limpiar iframe para detener carga
  if (pdfFrame) {
    pdfFrame.src = 'about:blank';
  }
  
  document.body.style.overflow = '';
  currentFolio = null;
}

function formatKey(key) {
  // Convertir camelCase a Título Con Espacios
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
}

function formatValue(value) {
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === 'string' && value.includes('T')) {
    // Formato ISO date
    try {
      return new Date(value).toLocaleString('es-MX', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return value;
    }
  }
  return String(value);
}

function renderDiffViewer(container, aiDiff) {
  if (!container || !aiDiff) return;
  
  const { original, corregido, confidence } = aiDiff;
  
  container.innerHTML = `
    <div class="archivo-diff-grid">
      <div class="archivo-diff-column">
        <div class="archivo-diff-header archivo-diff-original">Original</div>
        <pre class="archivo-diff-content">${escapeHTML(JSON.stringify(original, null, 2))}</pre>
      </div>
      <div class="archivo-diff-column">
        <div class="archivo-diff-header archivo-diff-corregido">Corregido</div>
        <pre class="archivo-diff-content">${escapeHTML(JSON.stringify(corregido, null, 2))}</pre>
      </div>
    </div>
    <div class="archivo-diff-confidence">
      <span class="material-symbols-outlined">auto_awesome</span>
      <span>Confianza IA: ${(confidence * 100).toFixed(0)}%</span>
    </div>
  `;
}

export function initArchivoDrawer() {
  // Cerrar drawer con botón
  const closeBtn = document.getElementById('archivoDrawerClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeDrawer);
  }
  
  // Cerrar drawer con overlay click
  const overlay = document.getElementById('archivoDrawerOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeDrawer);
  }
  
  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && currentFolio) {
      closeDrawer();
    }
  });
  
  // Listener para abrir drawer desde grid
  window.addEventListener('archivo:viewDocument', (e) => {
    openDrawer(e.detail.folio);
  });
  
  // Listener para descargar documento
  window.addEventListener('archivo:downloadDocument', (e) => {
    const doc = ArchivoService.getByFolio(e.detail.folio);
    if (doc && doc.pdfUrl) {
      // En producción: window.open(doc.pdfUrl, '_blank');
      console.log('[Archivo] Descargando:', doc.folio, doc.pdfUrl);
      window.dispatchEvent(new CustomEvent('toast:show', {
        detail: {
          message: `Descargando ${doc.folio}...`,
          type: 'info'
        }
      }));
    }
  });
}

export { openDrawer, closeDrawer };
