// helpers.js — Utilidades compartidas, sin efectos colaterales

function $(id) { return document.getElementById(id); }

/**
 * Sanitización Anti-XSS para inyecciones HTML directas.
 * Cualquier dato dinámico que se inserte en innerHTML
 * DEBE pasar por esta función antes.
 */
function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[&<>'"]/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
}

// Pre-computed constants (evita recalcular en cada frame/hot-path)
const SCAN_RING_CIRCUMFERENCE = 2 * Math.PI * 32; // ~201.06

function generateId() {
  return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

export { $, escapeHTML, SCAN_RING_CIRCUMFERENCE, generateId };
