// storage.js – localStorage helpers (wrapped so a blocked/full store never crashes the app)
const FAV_KEY = "mealmind:favorites";

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

export const getFavorites = () => read(FAV_KEY, []);
export const isFavorite = (id) => getFavorites().some((r) => r.id === id);

export function toggleFavorite(recipe) {
  const favs = getFavorites();
  const next = favs.some((r) => r.id === recipe.id)
    ? favs.filter((r) => r.id !== recipe.id)
    : [...favs, recipe];
  write(FAV_KEY, next);
  return next;
}
