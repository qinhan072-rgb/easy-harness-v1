import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { OpsAccessProvider } from './context/OpsAccessContext';
import { PrototypeProvider } from './context/PrototypeContext';
import { RequestSessionProvider } from './context/RequestSessionContext';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OpsAccessProvider>
      <RequestSessionProvider>
        <PrototypeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </PrototypeProvider>
      </RequestSessionProvider>
    </OpsAccessProvider>
  </React.StrictMode>,
);
