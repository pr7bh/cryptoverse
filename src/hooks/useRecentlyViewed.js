const KEY = 'cv_recently_viewed';
const MAX = 10;

export const getRecentlyViewed = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch (e) { return []; }
};

export const addRecentlyViewed = (coin) => {
  try {
    const list = getRecentlyViewed().filter(c => c.id !== coin.id);
    const img = coin.image || {};
    const next = [{
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      image: (typeof img === 'object' ? img.small : img) || '',
      thumb: (typeof img === 'object' ? img.thumb : img) || '',
    }, ...list].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch (e) { return []; }
};
