import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { store } from './store';
import { AppProvider } from './context/AppContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--mantle)',
                color: 'var(--text)',
                border: '1px solid var(--surface0)',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
              },
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--mantle)' } },
              error: { iconTheme: { primary: 'var(--error)', secondary: 'var(--mantle)' } },
            }}
          />
        </BrowserRouter>
      </AppProvider>
    </Provider>
  </React.StrictMode>,
);

