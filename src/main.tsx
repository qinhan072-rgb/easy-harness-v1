import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { PrototypeProvider } from './context/PrototypeContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <PrototypeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </PrototypeProvider>
  </React.StrictMode>,
);
