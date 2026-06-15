import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@labyrinth/editor-ui/styles.css';

import { App } from './App.js';

const root = document.getElementById('root');

if (root === null) {
  throw new Error('Root element #root was not found.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
