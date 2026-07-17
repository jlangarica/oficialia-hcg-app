// progress-zoom.js — Progress ring SVG y zoom del visor de PDF
import { $ } from './helpers.js';
import { SCAN_RING_CIRCUMFERENCE } from './helpers.js';

function updateScanRing(pct) {
  const ring = $('scanRingFg');
  const text = $('scanRingText');
  if (ring) {
    ring.style.strokeDashoffset = SCAN_RING_CIRCUMFERENCE - (pct / 100) * SCAN_RING_CIRCUMFERENCE;
  }
  if (text) text.textContent = Math.round(pct) + '%';
}

let currentZoom = 100;
function adjustZoom(delta) {
  currentZoom = Math.max(50, Math.min(200, currentZoom + delta));
  const zoomEl = $('zoomValue');
  const docEl = $('docPreview');
  if (zoomEl) zoomEl.textContent = currentZoom + '%';
  if (docEl) docEl.style.transform = `scale(${currentZoom / 100})`;
}

export { adjustZoom, updateScanRing };
