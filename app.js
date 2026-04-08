import { initApp, publicApi } from './src/main.js';

window.SingularidadeApp = publicApi;

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
  initApp();
}
