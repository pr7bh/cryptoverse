import { createContext, useContext } from 'react';

export const ThemeContext = createContext({
  preference: 'dark',
  theme: 'dark',
  setPreference: () => {},
});

export const useTheme = () => useContext(ThemeContext);
