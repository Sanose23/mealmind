// utils.js – small helpers shared by every page module.

// Escape text before putting it into innerHTML so API data can never inject markup.
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
  ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
