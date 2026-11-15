import React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Homepage from './Pages/HomePage';
import CoinPage from './Pages/CoinPage';
import PortfolioPage from './Pages/PortfolioPage';
import ComparePage from './Pages/ComparePage';
import ScreenerPage from './Pages/ScreenerPage';
import ConverterPage from './Pages/ConverterPage';
import HeatmapPage from './Pages/HeatmapPage';
import CommandPalette from './components/CommandPalette/CommandPalette';
import { useLenis } from './hooks/useLenis';
import './App.css';

function App() {
  useLenis();
  return (
    <BrowserRouter>
      <div>
        <Header />
        <CommandPalette />
        <Switch>
          <Route path="/" component={Homepage} exact />
          <Route path="/coins/:id" component={CoinPage} exact />
          <Route path="/portfolio" component={PortfolioPage} exact />
          <Route path="/compare" component={ComparePage} exact />
          <Route path="/screener" component={ScreenerPage} exact />
          <Route path="/converter" component={ConverterPage} exact />
          <Route path="/heatmap" component={HeatmapPage} exact />
        </Switch>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
