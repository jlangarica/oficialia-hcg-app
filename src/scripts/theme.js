// theme.js — Toggle de tema claro/oscuro con persistencia

function toggleTheme() {
  const html = document.documentElement;
  if (html) {
    const next = html.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('oficialia-theme', next);
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
