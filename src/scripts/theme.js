// theme.js — Toggle de tema claro/oscuro con persistencia

function toggleTheme() {
  const html = document.documentElement;
  if (html) {
    html.setAttribute('data-theme', html.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
  }
}

/**
 * Restaurar tema guardado al cargar.
 */
function initTheme() {
  const saved = localStorage.getItem('oficialia-theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  }
}

export { toggleTheme, initTheme };
