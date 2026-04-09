import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './config/i18n';
import './styles.css';
import { appTheme } from './theme/theme';
import { CssBaseline, ThemeProvider } from '@mui/material'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={appTheme}>
      <CssBaseline />
      <App /> 
    </ThemeProvider>
  </React.StrictMode>
)