# MealMind – Recipe & Meal Prep Tracker
A vanilla HTML/CSS/JavaScript web app (ES modules, no frameworks).

## Features
- Search recipes by dish or ingredient and filter by meal type (TheMealDB API)
- Save favorites (localStorage)
- Recipe details with serving-size scaling
- Nutrition lookup per ingredient (Open Food Facts API)
- Weekly meal planner and combined, checkable grocery list
- Fallback sample recipes if the recipe API is unreachable
- CSS animation and transitions (respects reduced-motion settings)

## Third-party APIs (no keys needed)
1. TheMealDB – https://www.themealdb.com/api.php
2. Open Food Facts – https://world.openfoodfacts.org

## Structure
- `js/api.js` – API calls and data normalizing
- `js/app.js` – home and detail page logic
- `js/planner.js` – planner, grocery list, serving scaling
- `js/storage.js` – localStorage helpers
- `js/utils.js` – shared helpers

## Run locally
ES modules need a server: `python3 -m http.server`, then open http://localhost:8000
