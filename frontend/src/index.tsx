// src/index.tsx
import './styles/index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './routes/App';
import { UserProvider } from './contexts/UserContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './styles/theme';
import { Box } from '@mui/system';
import Snowflakes from './components/christmas/Snowflakes'; // Import the Snowflakes component

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserProvider>
        <RefreshProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RefreshProvider>
      </UserProvider>
      {/* Festive Christmas Banner at the Bottom */}
      <Box
        sx={{
          backgroundColor: "#e57373", // Softer red
          color: "#fff",
          textAlign: "center",
          padding: "10px",
          fontSize: "1.25rem",
          fontWeight: "bold",
          zIndex: 1200,
          position: "fixed",
          width: "100%",
          bottom: 0, // Position the banner at the bottom
        }}
      >
        🎄 Happy Holidays! Enjoy the Festive Season! 🎅
      </Box>
      {/* Snowflake Animation */}
      <Snowflakes />
    </ThemeProvider>
  </React.StrictMode>
);