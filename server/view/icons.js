// Small hand-rolled icon set (stroke-based, 24x24 viewBox) used across the
// persistent game chrome. Kept as trusted server-side constants — safe to
// output unescaped in templates since none of it is user input.
function svg(inner, { fill = 'none' } = {}) {
  return `<svg viewBox="0 0 24 24" fill="${fill}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

module.exports = {
  camp: svg('<path d="M3 21h18M5 21V10l7-7 7 7v11M9 21v-6h6v6"/>'),
  tribe: svg('<path d="M5 21V4a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1h9a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H8v9"/>'),
  quest: svg('<circle cx="12" cy="12" r="9"/><path d="M9.3 9.2a2.7 2.7 0 0 1 5.3.7c0 1.6-2.6 2.1-2.6 3.9"/><path d="M12 17h.01"/>'),
  map: svg('<path d="M9 20l-6 2V6l6-2 6 2 6-2v16l-6 2-6-2z"/><path d="M9 4v16M15 6v16"/>'),
  hp: svg('<path d="M12 20.5S3.8 15 3.8 9.4C3.8 6.4 6.1 4 9 4c1.5 0 2.9.8 3 2 .1-1.2 1.5-2 3-2 2.9 0 5.2 2.4 5.2 5.4 0 5.6-8.2 11.1-8.2 11.1z"/>', { fill: 'currentColor' }),
  energy: svg('<path d="m13 2-8 12h6l-1 8 8-12h-6z"/>', { fill: 'currentColor' }),
  logout: svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>'),
  lock: svg('<rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
};
