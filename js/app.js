// app.js – page logic. One module serves both index.html and recipe-details.html.
import { getCategories, searchRecipes, filterByCategory, getRecipe,
         getFallbackRecipes, getFallbackRecipe } from "./api.js";
import { addToPlan, scaleMeasure, BASE_SERVINGS } from "./planner.js";
import { DAYS, getFavorites, isFavorite, toggleFavorite } from "./storage.js";

const $ = (sel) => document.querySelector(sel);
const status = (msg) => { const el = $("#status"); if (el) el.textContent = msg; };
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

let current = [];
let showingFavs = false;

/* ---------- Home page ---------- */
function renderCards(recipes) {
  $("#recipe-grid").innerHTML = recipes.map((r) => {
    const saved = isFavorite(r.id);
    return `
    <article class="card">
      <img src="${esc(r.image)}" alt="${esc(r.title)}" loading="lazy">
      <div class="card-body">
        <h2>${esc(r.title)}</h2>
        <p class="meta">${esc([r.category, r.area].filter(Boolean).join(" • ")) || "&nbsp;"}</p>
        <div class="actions">
          <button type="button" class="save ${saved ? "on" : ""}" data-id="${esc(r.id)}"
                  aria-pressed="${saved}">${saved ? "Saved" : "Save"}</button>
          <a class="view" href="recipe-details.html?id=${encodeURIComponent(r.id)}">View</a>
        </div>
      </div>
    </article>`;
  }).join("");
}

async function run(task, label) {
  status("Loading recipes...");
  showingFavs = false;
  $("#favorites-toggle").setAttribute("aria-pressed", "false");
  try {
    current = await task();
  } catch {
    current = await getFallbackRecipes();
    renderCards(current);
    status("Could not reach the recipe service. Showing sample recipes instead.");
    return;
  }
  renderCards(current);
  status(current.length ? `${current.length} recipes for ${label}.`
                        : `No recipes found for ${label}. Try another dish or ingredient.`);
}

function updateFavCount() { $("#fav-count").textContent = getFavorites().length; }

function showFavorites() {
  showingFavs = true;
  $("#favorites-toggle").setAttribute("aria-pressed", "true");
  const favs = getFavorites();
  renderCards(favs);
  status(favs.length ? `${favs.length} saved recipes.` : "No favorites yet. Press Save on a recipe to add it.");
}

async function initHome() {
  const select = $("#category-filter");
  (await getCategories()).forEach((c) => select.add(new Option(c, c)));
  updateFavCount();

  $("#search-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const term = $("#search-input").value.trim();
    if (!term) { status("Type a dish or ingredient to search."); return; }
    select.value = "";
    run(() => searchRecipes(term), `"${term}"`);
  });

  select.addEventListener("change", () => {
    if (select.value) run(() => filterByCategory(select.value), select.value);
  });

  $("#recipe-grid").addEventListener("click", (e) => {
    const btn = e.target.closest(".save");
    if (!btn) return;
    const recipe = [...current, ...getFavorites()].find((r) => r.id === btn.dataset.id);
    toggleFavorite(recipe);
    updateFavCount();
    showingFavs ? showFavorites() : renderCards(current);
  });

  $("#favorites-toggle").addEventListener("click", () => {
    showingFavs ? run(() => searchRecipes("chicken"), '"chicken"') : showFavorites();
  });

  run(() => searchRecipes("chicken"), '"chicken"');
}

/* ---------- Detail page ---------- */
function renderIngredients(r, servings) {
  const factor = servings / BASE_SERVINGS;
  $("#ingredient-list").innerHTML = r.ingredients.map((i) =>
    `<li>${esc(scaleMeasure(i.measure, factor))} ${esc(i.name)}</li>`).join("")
    || "<li>Ingredient details not available.</li>";
}

async function initDetail() {
  const id = new URLSearchParams(location.search).get("id");
  if (!id) { status("No recipe selected. Go back to search and pick one."); return; }
  status("Loading recipe...");
  let r;
  try { r = await getRecipe(id); } catch { r = await getFallbackRecipe(id); }
  if (!r) { status("That recipe could not be found."); return; }
  document.title = `${r.title} – MealMind`;
  status("");
  $("#recipe-detail").innerHTML = `
    <img src="${esc(r.image)}" alt="${esc(r.title)}">
    <div>
      <h1>${esc(r.title)}</h1>
      <p class="meta">${esc([r.category, r.area].filter(Boolean).join(" • "))}</p>
      <div class="controls">
        <label>Servings <input id="servings" type="number" min="1" max="20" value="${BASE_SERVINGS}"></label>
        <label>Day <select id="plan-day">${DAYS.map((d) => `<option>${d}</option>`).join("")}</select></label>
        <button type="button" id="add-plan" class="view">Add to meal plan</button>
      </div>
      <h2>Ingredients</h2>
      <ul id="ingredient-list"></ul>
    </div>
    <div class="instructions">
      <h2>Instructions</h2>
      ${r.instructions.split(/\r?\n+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("") || "<p>Instructions not available.</p>"}
    </div>`;
  const servingsInput = $("#servings");
  const getServings = () => Math.min(20, Math.max(1, parseInt(servingsInput.value, 10) || BASE_SERVINGS));
  renderIngredients(r, getServings());
  servingsInput.addEventListener("input", () => renderIngredients(r, getServings()));
  $("#add-plan").addEventListener("click", () => {
    addToPlan($("#plan-day").value, r, getServings());
    status(`Added ${r.title} to ${$("#plan-day").value}. View it in the meal planner.`);
  });
}

$("#recipe-grid") ? initHome() : initDetail();
