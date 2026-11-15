import React, { createContext, useContext, useReducer } from 'react';
import { loadPortfolios, savePortfolios, DEFAULT_STATE } from './portfolioUtils';

const PortfolioContext = createContext(null);

function reducer(state, action) {
  let next;
  switch (action.type) {
    case 'ADD_TRANSACTION': {
      const portfolios = state.portfolios.map(p =>
        p.id === state.activeId
          ? { ...p, transactions: [...p.transactions, action.tx] }
          : p
      );
      next = { ...state, portfolios };
      break;
    }
    case 'DELETE_TRANSACTION': {
      const portfolios = state.portfolios.map(p =>
        p.id === state.activeId
          ? { ...p, transactions: p.transactions.filter(t => t.id !== action.id) }
          : p
      );
      next = { ...state, portfolios };
      break;
    }
    case 'ADD_PORTFOLIO': {
      next = { ...state, portfolios: [...state.portfolios, action.portfolio], activeId: action.portfolio.id };
      break;
    }
    case 'DELETE_PORTFOLIO': {
      const portfolios = state.portfolios.filter(p => p.id !== action.id);
      const activeId = portfolios.length > 0
        ? (state.activeId === action.id ? portfolios[0].id : state.activeId)
        : null;
      next = { ...state, portfolios, activeId };
      break;
    }
    case 'SWITCH_PORTFOLIO':
      next = { ...state, activeId: action.id };
      break;
    case 'RENAME_PORTFOLIO': {
      const portfolios = state.portfolios.map(p =>
        p.id === action.id ? { ...p, name: action.name } : p
      );
      next = { ...state, portfolios };
      break;
    }
    default:
      return state;
  }
  savePortfolios(next);
  return next;
}

export const PortfolioProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, null, () => {
    const saved = loadPortfolios();
    return saved || DEFAULT_STATE();
  });

  const activePortfolio = state.portfolios.find(p => p.id === state.activeId) || state.portfolios[0];

  return (
    <PortfolioContext.Provider value={{ state, dispatch, activePortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => useContext(PortfolioContext);
