const KEY = 'cv_watchlist';

export const getWatchlist = () => {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
};

export const toggleWatchlist = (id) => {
  const list = getWatchlist();
  const idx = list.indexOf(id);
  const next = idx > -1 ? list.filter(i => i !== id) : [...list, id];
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

export const isWatchlisted = (id) => getWatchlist().includes(id);
