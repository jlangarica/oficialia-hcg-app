// toast.js — Sistema de notificaciones toast
import { $ } from './helpers.js';

const TOAST_ICON_MAP = { success: 'check_circle', error: 'error', info: 'info' };

function showToast(message, type) {
  type = type || 'info';
  const container = $('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconSpan = document.createElement('span');
  iconSpan.className = 'material-symbols-outlined';
  iconSpan.textContent = TOAST_ICON_MAP[type] || 'info';

  const msgSpan = document.createElement('span');
  msgSpan.textContent = message; // textContent es seguro — no interpreta HTML

  toast.appendChild(iconSpan);
  toast.appendChild(msgSpan);
  container.appendChild(toast);

  setTimeout(function () {
    toast.classList.add('removing');
    setTimeout(function () { toast.remove(); }, 300);
  }, 4000);
}

function initToast() {
  window.addEventListener('toast:show', (e) => {
    showToast(e.detail.message, e.detail.type);
  });
}

export { showToast, initToast };
