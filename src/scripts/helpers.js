// helpers.js — Utilidades compartidas, sin efectos colaterales

function $(id) { return document.getElementById(id); }

/**
 * Sanitización Anti-XSS para inyecciones HTML directas.
 * Cualquier dato dinámico que se inserte en innerHTML
 * DEBE pasar por esta función antes.
 */
// CORREGIDO: Mapa de reemplazo declarado UNA VEZ en scope de módulo,
// no re-creado en cada invocación del callback de replace.
var _ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;'
};
var _ESCAPE_REGEX = /[&<>'"]/g;

function escapeHTML(str) {
  if (typeof str !== 'string') return '';
  return str.replace(_ESCAPE_REGEX, function(tag) {
    return _ESCAPE_MAP[tag] || tag;
  });
}

// Pre-computed constants (evita recalcular en cada frame/hot-path)
var SCAN_RING_CIRCUMFERENCE = 2 * Math.PI * 32; // ~201.06

export { $, escapeHTML, SCAN_RING_CIRCUMFERENCE };
