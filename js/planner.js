// planner.js – weekly meal plan, grocery list, and serving-size scaling
import { DAYS, getPlan, savePlan, getChecked, saveChecked } from "./storage.js";

export const BASE_SERVINGS = 4;   // the API does not give servings, so recipes are treated as serving 4

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// "1 1/2 cups" scaled by 2 -> "3 cups". Text with no leading number is returned unchanged.
export function scaleMeasure(measure, factor) {
  const m = (measure || "").match(/^\s*(\d+\s+\d+\/\d+|\d+\/\d+|\d*\.?\d+)\s*(.*)$/);
  if (!m || factor === 1) return measure || "";
  let n;
  if (m[1].includes("/")) {
    const parts = m[1].trim().split(/\s+/);
    const [a, b] = parts[parts.length - 1].split("/").map(Number);
    n = (parts.length > 1 ? Number(parts[0]) : 0) + a / b;
  } else n = Number(m[1]);
  const out = Math.round(n * factor * 100) / 100;
  return `${out} ${m[2]}`.trim();
}

export function addToPlan(day, recipe, servings) {
  const plan = getPlan();
  plan[day].push({ id: recipe.id, title: recipe.title, image: recipe.image,
                   ingredients: recipe.ingredients, servings });
  savePlan(plan);
}

// Combine ingredients from every planned meal into one list.
export function buildGroceryList(plan) {
  const map = new Map();
  Object.values(plan).flat().forEach((meal) => {
    const factor = meal.servings / BASE_SERVINGS;
    meal.ingredients.forEach((ing) => {
      const key = ing.name.toLowerCase();
      if (!map.has(key)) map.set(key, { key, name: ing.name, measures: [] });
      const scaled = scaleMeasure(ing.measure, factor);
      if (scaled) map.get(key).measures.push(scaled);
    });
  });
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function render() {
  const plan = getPlan();
  document.querySelector("#plan-grid").innerHTML = DAYS.map((day) => `
    <section class="day">
      <h2>${day}</h2>
      ${plan[day].length ? "" : '<p class="empty">No meals yet</p>'}
      ${plan[day].map((m, i) => `
        <div class="planned">
          <a href="recipe-details.html?id=${encodeURIComponent(m.id)}">${esc(m.title)}</a>
          <span class="meta">${m.servings} servings</span>
          <button type="button" class="remove" data-day="${day}" data-i="${i}" aria-label="Remove ${esc(m.title)} from ${day}">Remove</button>
        </div>`).join("")}
    </section>`).join("");

  const items = buildGroceryList(plan);
  const checked = getChecked();
  document.querySelector("#grocery-list").innerHTML = items.length
    ? items.map((it) => `
      <li><label><input type="checkbox" data-key="${esc(it.key)}" ${checked.includes(it.key) ? "checked" : ""}>
        <span>${esc(it.name)}</span> <span class="meta">${esc(it.measures.join(" + "))}</span></label></li>`).join("")
    : '<li class="empty">Add meals to your plan and your grocery list will appear here.</li>';
}

if (document.querySelector("#plan-grid")) {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove");
    if (btn) {
      const plan = getPlan();
      plan[btn.dataset.day].splice(Number(btn.dataset.i), 1);
      savePlan(plan); render();
    }
    if (e.target.id === "clear-plan") {
      if (confirm("Clear the whole week?")) { savePlan({}); saveChecked([]); render(); }
    }
  });
  document.addEventListener("change", (e) => {
    if (e.target.matches("#grocery-list input")) {
      const set = new Set(getChecked());
      e.target.checked ? set.add(e.target.dataset.key) : set.delete(e.target.dataset.key);
      saveChecked([...set]);
    }
  });
  render();
}
