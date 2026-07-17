// src/scripts/router.js

/**
 * Router de módulos — intercambia vistas completas en el <main>.
 * Sigue el mismo patrón de clases activas que wizard.js.
 */
const ModuleRouter = (() => {
  const modules = ['wizard', 'archivo'];
  let currentModule = 'wizard';

  const wizardViewport = () => document.getElementById('wizardViewport');
  const archivoView = () => document.getElementById('module-archivo');
  const headerStepper = () => document.querySelector('.stepper');

  function switchTo(moduleId) {
    if (moduleId === currentModule) return;
    if (!modules.includes(moduleId)) return;

    // Ocultar módulo actual
    if (currentModule === 'wizard') {
      wizardViewport()?.classList.add('hidden');
      headerStepper()?.classList.add('hidden');
    } else if (currentModule === 'archivo') {
      archivoView()?.classList.add('hidden');
    }

    // Mostrar módulo nuevo
    if (moduleId === 'wizard') {
      wizardViewport()?.classList.remove('hidden');
      headerStepper()?.classList.remove('hidden');
    } else if (moduleId === 'archivo') {
      archivoView()?.classList.remove('hidden');
      // Disparar evento para que el módulo archive se inicialice
      window.dispatchEvent(new CustomEvent('archivo:activated'));
    }

    // Actualizar nav items
    document.querySelectorAll('.nav-item[data-module]').forEach(item => {
      item.classList.toggle('active', item.dataset.module === moduleId);
    });

    // Actualizar badge del sidebar
    const pageBadge = document.getElementById('pageBadge');
    if (pageBadge) {
      pageBadge.style.display = moduleId === 'wizard' ? '' : 'none';
    }

    currentModule = moduleId;

    // Notificar al wizard que pausa/reanuda
    window.dispatchEvent(new CustomEvent('module:changed', { detail: { to: moduleId } }));
  }

  function init() {
    // Estado inicial: wizard visible, archivo oculto
    archivoView()?.classList.add('hidden');

    // Click en nav items
    document.querySelectorAll('.nav-item[data-module]').forEach(item => {
      item.addEventListener('click', () => {
        const moduleId = item.dataset.module;
        if (item.classList.contains('locked')) return;
        switchTo(moduleId);
      });
    });
  }

  return { init, switchTo, getCurrentModule: () => currentModule };
})();

export default ModuleRouter;
