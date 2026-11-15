import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import CryptoContext from './CryptoContext';
import { ThemeProvider } from './theme/ThemeProvider';
import { PortfolioProvider } from './features/portfolio/PortfolioContext';

ReactDOM.render(
  <React.StrictMode>
    <ThemeProvider>
      <CryptoContext>
        <PortfolioProvider>
          <App />
        </PortfolioProvider>
      </CryptoContext>
    </ThemeProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
