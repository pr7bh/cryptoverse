import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import CryptoContext from './CryptoContext';
import { ThemeProvider } from './theme/ThemeProvider';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <CryptoContext>
        <App />
      </CryptoContext>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
