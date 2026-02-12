import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

console.log("TonMan v2: Iniciando Montagem do DOM...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("TonMan v2: Erro - Elemento #root não encontrado.");
  throw new Error("Could not find root element to mount to");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("TonMan v2: React Render disparado.");
} catch (err) {
  console.error("TonMan v2: Falha fatal no ReactDOM.render", err);
}