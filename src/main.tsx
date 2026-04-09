import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@app/app';
import { AppProviders } from '@app/providers';
import '@styles/global.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Elemento raiz nao encontrado.');
}

createRoot(rootElement).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>
);
