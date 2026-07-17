// reveal.js — Sistema de stagger reveal para elementos [data-stagger]

function revealChildren(parent) {
  if (!parent) return;
  parent.querySelectorAll('[data-stagger]').forEach(function (el, i) {
    const delay = (i * 0.05).toFixed(2);
    el.style.transition = 'none';
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    void el.offsetHeight;
    el.style.transition = `opacity 0.45s ease ${delay}s, transform 0.5s var(--spring-bounce) ${delay}s`;
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });
}

function initRevealObserver() {
  // Revelar sidebar al cargar
  setTimeout(function () {
    document.querySelectorAll('.sidebar [data-stagger]').forEach(function (el, i) {
      const delay = (i * 0.05 + 0.1).toFixed(2);
      el.style.transition = `opacity 0.4s ease ${delay}s, transform 0.45s var(--spring-bounce) ${delay}s`;
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    });
    const step1 = document.getElementById('step-1');
    if (step1) revealChildren(step1);
  }, 150);
}

export { revealChildren, initRevealObserver };
