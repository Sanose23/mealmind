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

// ---- Meal plan + grocery checklist ----
const PLAN_KEY = "mealmind:plan";
const CHECK_KEY = "mealmind:grocery-checked";
export const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export function getPlan() {
  const plan = read(PLAN_KEY, {});
  DAYS.forEach((d) => { if (!Array.isArray(plan[d])) plan[d] = []; });
  return plan;
}
export const savePlan = (plan) => write(PLAN_KEY, plan);
export const getChecked = () => read(CHECK_KEY, []);
export const saveChecked = (list) => write(CHECK_KEY, list);
