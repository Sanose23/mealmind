// api.js – talks to TheMealDB (free, no API key) and normalizes the JSON
// so the rest of the app always sees the same recipe shape.
const BASE = "https://www.themealdb.com/api/json/v1/1";

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

// Turn TheMealDB's strIngredient1..20 / strMeasure1..20 into a clean array.
function normalize(m) {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const name = (m[`strIngredient${i}`] || "").trim();
    if (name) ingredients.push({ name, measure: (m[`strMeasure${i}`] || "").trim() });
  }
  return {
    id: m.idMeal,
    title: m.strMeal,
    image: m.strMealThumb,
    category: m.strCategory || "",
    area: m.strArea || "",
    instructions: m.strInstructions || "",
    ingredients,
  };
}

const clean = (data) => (data.meals || []).map(normalize);
const brief = (m, category = "") => ({
  id: m.idMeal, title: m.strMeal, image: m.strMealThumb,
  category, area: "", instructions: "", ingredients: [],
});

async function loadMock() {
  const data = await getJSON("data/mock-recipes.json");
  return data.recipes;
}

export async function getCategories() {
  try {
    const data = await getJSON(`${BASE}/list.php?c=list`);
    return data.meals.map((c) => c.strCategory);
  } catch {
    return ["Chicken", "Pasta", "Vegetarian"];
  }
}

// Name search first; if nothing matches, try it as an ingredient.
export async function searchRecipes(term) {
  const q = encodeURIComponent(term.trim());
  const byName = clean(await getJSON(`${BASE}/search.php?s=${q}`));
  if (byName.length) return byName;
  const byIng = await getJSON(`${BASE}/filter.php?i=${q}`);
  return (byIng.meals || []).map((m) => brief(m));
}

export async function filterByCategory(category) {
  const data = await getJSON(`${BASE}/filter.php?c=${encodeURIComponent(category)}`);
  return (data.meals || []).map((m) => brief(m, category));
}

export async function getRecipe(id) {
  const data = await getJSON(`${BASE}/lookup.php?i=${encodeURIComponent(id)}`);
  return clean(data)[0] || null;
}

// Used when the API is unreachable so the app still shows something.
export const getFallbackRecipes = () => loadMock();
export async function getFallbackRecipe(id) {
  return (await loadMock()).find((r) => r.id === String(id)) || null;
}

// ---- Second third-party API: Open Food Facts (free, no key) ----
// Returns nutrition per 100 g for an ingredient, or null if nothing useful is found.
const OFF = "https://world.openfoodfacts.org/cgi/search.pl";

export async function getNutrition(ingredient) {
  const q = encodeURIComponent(ingredient.trim());
  const data = await getJSON(
    `${OFF}?search_terms=${q}&search_simple=1&action=process&json=1&page_size=10&fields=product_name,nutriments`
  );
  const product = (data.products || []).find(
    (p) => p.nutriments && p.nutriments["energy-kcal_100g"] !== undefined
  );
  if (!product) return null;
  const n = product.nutriments;
  return {
    name: product.product_name || ingredient,
    calories: n["energy-kcal_100g"],
    protein: n.proteins_100g ?? 0,
    fat: n.fat_100g ?? 0,
    carbs: n.carbohydrates_100g ?? 0,
  };
}
