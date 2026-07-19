import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { bootstrapDesktop } from '../desktop/main';

// Root entry point for the Native SDK shell
const rootElement = document.getElementById('root');
if (rootElement) {
  void bootstrapDesktop()
    .then((desktop) => {
      ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
          <App desktop={desktop} />
        </React.StrictMode>
      );
    })
    .catch((error: unknown) => {
      ReactDOM.createRoot(rootElement).render(
        <main role="alert">Creature OS could not start: {error instanceof Error ? error.message : 'Unknown error'}</main>
      );
    });
}
