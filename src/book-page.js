import { mountStandaloneBook } from './views/compendium.js';

function initBookPage() {
  mountStandaloneBook(document.getElementById('bookPageRoot'));
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', initBookPage, { once: true });
} else {
  initBookPage();
}
