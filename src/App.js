import React from 'react';
import { BrowserRouter, Route } from 'react-router-dom';
import Header from './components/Header/Header';
import Homepage from './Pages/HomePage';
import CoinPage from './Pages/CoinPage';
import { useLenis } from './hooks/useLenis';
import './App.css';

function App() {
  useLenis();
  return (
    <BrowserRouter>
      <div>
        <Header />
        <Route path="/" component={Homepage} exact />
        <Route path="/coins/:id" component={CoinPage} exact />
      </div>
    </BrowserRouter>
  );
}

export default App;
