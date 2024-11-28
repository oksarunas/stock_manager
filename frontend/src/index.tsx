// src/index.tsx
import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './routes/App';
import { UserProvider } from './contexts/UserContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { ThemeProvider, CssBaseline } from '@mui/material'; // Import CssBaseline for global Material UI resets
import theme from './styles/theme'; // Import your custom Material UI theme

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}> {/* Wrap in ThemeProvider for Material UI theme */}
      <CssBaseline /> {/* Apply Material UI's default CSS baseline reset */}
      <UserProvider>
        <RefreshProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RefreshProvider>
      </UserProvider>
    </ThemeProvider>
  </React.StrictMode>
);
