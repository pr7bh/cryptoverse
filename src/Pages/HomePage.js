import React from 'react';
import Hero from '../components/Hero/Hero';
import MarketOverview from '../components/MarketOverview/MarketOverview';
import TrendingCoins from '../components/TrendingCoins/TrendingCoins';
import CoinsTable from '../components/CoinsTable/CoinsTable';

const HomePage = () => (
  <>
    <Hero />
    <MarketOverview />
    <TrendingCoins />
    <CoinsTable />
  </>
);

export default HomePage;
