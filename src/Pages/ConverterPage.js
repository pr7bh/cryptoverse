import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { CryptoState } from '../CryptoContext';
import { numberWithCommas } from '../utils/format';
import './ConverterPage.css';

var BASE = process.env.NODE_ENV === 'production' ? '/api/cg' : 'https://api.coingecko.com/api/v3';

var FIATS = [
  { id: 'usd', symbol: 'USD', label: 'US Dollar', sign: '$' },
  { id: 'eur', symbol: 'EUR', label: 'Euro', sign: '€' },
  { id: 'gbp', symbol: 'GBP', label: 'British Pound', sign: '£' },
  { id: 'inr', symbol: 'INR', label: 'Indian Rupee', sign: '₹' },
  { id: 'jpy', symbol: 'JPY', label: 'Japanese Yen', sign: '¥' },
  { id: 'cad', symbol: 'CAD', label: 'Canadian Dollar', sign: 'CA$' },
  { id: 'aud', symbol: 'AUD', label: 'Australian Dollar', sign: 'A$' },
];

function fmtResult(n) {
  if (n == null) return '—';
  if (n < 0.000001) return n.toExponential(4);
  if (n < 0.01) return n.toFixed(8).replace(/0+$/, '');
  if (n < 1) return n.toFixed(6).replace(/0+$/, '');
  return numberWithCommas(n.toFixed(2));
}

var ConverterPage = function() {
  var cryptoCtx = CryptoState();
  var currency = cryptoCtx.currency;

  var defaultFiat = FIATS.find(function(f) { return f.symbol === (currency || 'USD'); }) || FIATS[0];

  var coinsState = useState([]);
  var coins = coinsState[0];
  var setCoins = coinsState[1];

  var fromTypeState = useState('crypto');
  var fromType = fromTypeState[0];
  var setFromType = fromTypeState[1];

  var fromCoinState = useState(null);
  var fromCoin = fromCoinState[0];
  var setFromCoin = fromCoinState[1];

  var fromFiatState = useState(defaultFiat);
  var fromFiat = fromFiatState[0];
  var setFromFiat = fromFiatState[1];

  var toTypeState = useState('fiat');
  var toType = toTypeState[0];
  var setToType = toTypeState[1];

  var toCoinState = useState(null);
  var toCoin = toCoinState[0];
  var setToCoin = toCoinState[1];

  var toFiatState = useState(FIATS[0]);
  var toFiat = toFiatState[0];
  var setToFiat = toFiatState[1];

  var amountState = useState('1');
  var amount = amountState[0];
  var setAmount = amountState[1];

  var pricesState = useState({});
  var prices = pricesState[0];
  var setPrices = pricesState[1];

  var fiatRatesState = useState({});
  var fiatRates = fiatRatesState[0];
  var setFiatRates = fiatRatesState[1];

  var loadState = useState(true);
  var loading = loadState[0];
  var setLoading = loadState[1];

  var updatedState = useState(null);
  var lastUpdated = updatedState[0];
  var setLastUpdated = updatedState[1];

  var cs1State = useState('');
  var coinSearch = cs1State[0];
  var setCoinSearch = cs1State[1];

  var cs2State = useState('');
  var coinSearch2 = cs2State[0];
  var setCoinSearch2 = cs2State[1];

  useEffect(function() {
    setLoading(true);
    axios.get(BASE + '/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false')
      .then(function(res) {
        var data = res.data || [];
        setCoins(data);
        var bitcoin = data.find(function(c) { return c.id === 'bitcoin'; }) || data[0];
        if (bitcoin) setFromCoin(bitcoin);
        var ethereum = data.find(function(c) { return c.id === 'ethereum'; }) || data[1];
        if (ethereum) setToCoin(ethereum);
        setLoading(false);
      })
      .catch(function() { setLoading(false); });
  }, []);

  useEffect(function() {
    if (coins.length === 0) return;
    var ids = coins.slice(0, 20).map(function(c) { return c.id; }).join(',');
    var fiatIds = FIATS.map(function(f) { return f.id; }).join(',');
    axios.get(BASE + '/simple/price?ids=' + ids + '&vs_currencies=' + fiatIds)
      .then(function(res) {
        var data = res.data || {};
        setPrices(data);
        var btc = data['bitcoin'];
        if (btc) {
          var rates = {};
          FIATS.forEach(function(f) { if (btc[f.id]) rates[f.id] = btc[f.id]; });
          setFiatRates(rates);
        }
        setLastUpdated(new Date().toLocaleTimeString());
      })
      .catch(function() {});
  }, [coins]);

  var getValueInUSD = useCallback(function(type, coin, fiat, qty) {
    if (!qty || isNaN(qty)) return 0;
    if (type === 'crypto' && coin) {
      var p = prices[coin.id];
      if (!p || !p['usd']) return 0;
      return p['usd'] * parseFloat(qty);
    }
    if (type === 'fiat' && fiat) {
      var r = fiatRates[fiat.id];
      if (!r) return 0;
      return parseFloat(qty) / r;
    }
    return 0;
  }, [prices, fiatRates]);

  var convertResult = function() {
    var fromUSD = getValueInUSD(fromType, fromCoin, fromFiat, amount);
    if (!fromUSD) return null;
    if (toType === 'crypto' && toCoin) {
      var p = prices[toCoin.id];
      if (!p || !p['usd'] || p['usd'] === 0) return null;
      return fromUSD / p['usd'];
    }
    if (toType === 'fiat' && toFiat) {
      var r = fiatRates[toFiat.id];
      if (!r) return null;
      return fromUSD * r;
    }
    return null;
  };

  var result = convertResult();

  var swap = function() {
    var tmpType = fromType, tmpCoin = fromCoin, tmpFiat = fromFiat;
    setFromType(toType); setFromCoin(toCoin); setFromFiat(toFiat);
    setToType(tmpType); setToCoin(tmpCoin); setToFiat(tmpFiat);
  };

  var filteredCoins = function(srch) {
    if (!srch) return coins.slice(0, 20);
    return coins.filter(function(c) {
      return c.name.toLowerCase().includes(srch.toLowerCase()) || (c.symbol || '').toLowerCase().includes(srch.toLowerCase());
    }).slice(0, 10);
  };

  var renderSelector = function(type, setType, coin, setCoin, fiat, setFiat, srch, setSrch) {
    return (
      <div className="cv-selector">
        <div className="cv-type-tabs">
          <button className={'cv-type-tab' + (type === 'crypto' ? ' active' : '')} onClick={function() { setType('crypto'); }}>Crypto</button>
          <button className={'cv-type-tab' + (type === 'fiat' ? ' active' : '')} onClick={function() { setType('fiat'); }}>Fiat</button>
        </div>
        {type === 'crypto' ? (
          <div className="cv-coin-sel">
            <input className="cv-sel-input" type="text" placeholder="Search crypto..." value={srch} onChange={function(e) { setSrch(e.target.value); }} />
            <div className="cv-coin-list">
              {filteredCoins(srch).map(function(c) {
                return (
                  <button key={c.id} className={'cv-coin-opt' + (coin && coin.id === c.id ? ' active' : '')} onClick={function() { setCoin(c); setSrch(''); }}>
                    <img src={c.image} alt={c.name} className="cv-coin-opt-img" />
                    <span className="cv-coin-opt-sym">{(c.symbol || '').toUpperCase()}</span>
                    <span className="cv-coin-opt-name">{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="cv-fiat-list">
            {FIATS.map(function(f) {
              return (
                <button key={f.id} className={'cv-fiat-opt' + (fiat && fiat.id === f.id ? ' active' : '')} onClick={function() { setFiat(f); }}>
                  <span className="cv-fiat-sign">{f.sign}</span>
                  <span className="cv-fiat-sym">{f.symbol}</span>
                  <span className="cv-fiat-name">{f.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  var fromLabel = fromType === 'crypto' ? (fromCoin ? (fromCoin.symbol || '').toUpperCase() : '—') : (fromFiat ? fromFiat.symbol : '—');
  var toLabel = toType === 'crypto' ? (toCoin ? (toCoin.symbol || '').toUpperCase() : '—') : (toFiat ? toFiat.symbol : '—');

  return (
    <div className="cv-page">
      <div className="cv-header">
        <div className="cv-header__inner">
          <div className="cv-eyebrow">Converter</div>
          <h1 className="cv-title">Crypto Converter</h1>
          <p className="cv-sub">Convert between cryptocurrencies and fiat currencies in real time.</p>
          {lastUpdated && <div className="cv-updated">Updated {lastUpdated}</div>}
        </div>
      </div>

      {loading ? (
        <div className="cv-loading">Loading market data...</div>
      ) : (
        <div className="cv-body">
          <div className="cv-main-card">
            <div className="cv-amount-row">
              <div className="cv-amount-wrap">
                <label className="cv-label">Amount</label>
                <input
                  className="cv-amount-input"
                  type="number"
                  min="0"
                  step="any"
                  value={amount}
                  onChange={function(e) { setAmount(e.target.value); }}
                  placeholder="1"
                />
                <span className="cv-amount-label">{fromLabel}</span>
              </div>
              <div className="cv-eq">=</div>
              <div className="cv-result-wrap">
                <label className="cv-label">Result</label>
                <div className="cv-result">
                  {fmtResult(result)}
                  <span className="cv-result-unit">{toLabel}</span>
                </div>
              </div>
            </div>

            <div className="cv-swap-row">
              <button className="cv-swap-btn" onClick={swap}>⇄ Swap</button>
              {result != null && (
                <div className="cv-rate">
                  1 {fromLabel} = {fmtResult(result / (parseFloat(amount) || 1))} {toLabel}
                </div>
              )}
            </div>

            <div className="cv-selectors">
              <div className="cv-sel-col">
                <div className="cv-sel-heading">From</div>
                {renderSelector(fromType, setFromType, fromCoin, setFromCoin, fromFiat, setFromFiat, coinSearch, setCoinSearch)}
              </div>
              <div className="cv-sel-divider" />
              <div className="cv-sel-col">
                <div className="cv-sel-heading">To</div>
                {renderSelector(toType, setToType, toCoin, setToCoin, toFiat, setToFiat, coinSearch2, setCoinSearch2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConverterPage;
