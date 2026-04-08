import { escapeAttribute, escapeHtml } from '../core/utils.js';

const ICONS = {
  sheet: '<path d="M8 3.5h6l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5Z"/><path d="M14 3.5V8h4"/><path d="M9 12h6"/><path d="M9 16h6"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01"/><path d="M15 9h.01"/><path d="M9 15h.01"/><path d="M15 15h.01"/>',
  export: '<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M5 20h14"/>',
  order: '<path d="M8 6h11"/><path d="M8 12h11"/><path d="M8 18h11"/><path d="M4 6h.01"/><path d="M4 12h.01"/><path d="M4 18h.01"/>',
  book: '<path d="M5 4.5h11a2.5 2.5 0 0 1 2.5 2.5v12.5a2 2 0 0 0-2-2H5Z"/><path d="M5 4.5A2.5 2.5 0 0 0 2.5 7v12.5A2 2 0 0 1 5 17.5h11"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z"/>',
  save: '<path d="M5 4.5h12l2 2V19.5A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5Z"/><path d="M8 4.5v5h8v-5"/><path d="M9 16h6"/>',
  tag: '<path d="m20 10.5-8.8 8.8a2 2 0 0 1-2.8 0L3 14V4h10l7 6.5Z"/><path d="M7.5 8.5h.01"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  close: '<path d="M6 6l12 12"/><path d="M18 6 6 18"/>',
  upload: '<path d="M12 16V5"/><path d="m7 10 5-5 5 5"/><path d="M4 19h16"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  sword: '<path d="M14 5 19 10"/><path d="m13 6 5 5"/><path d="m5 19 7-7"/><path d="m4 20 2.5-6.5L11 18Z"/>',
  spark: '<path d="M13 2 4 14h6l-1 8 9-12h-6Z"/>',
  shield: '<path d="M12 3 5 6v5c0 5 3.5 8 7 10 3.5-2 7-5 7-10V6Z"/>',
  seal: '<circle cx="12" cy="12" r="8"/><path d="M12 7v10"/><path d="M7 12h10"/>',
  bag: '<path d="M7 8V7a5 5 0 0 1 10 0v1"/><path d="M5 8h14l-1 11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2Z"/>',
  copy: '<rect x="9" y="9" width="10" height="10" rx="2"/><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2"/><circle cx="9.5" cy="7" r="3.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a3.5 3.5 0 0 1 0 6.74"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  hp: '<path d="M12 20s-6.5-4.2-8.5-8.3A5 5 0 0 1 12 6a5 5 0 0 1 8.5 5.7C18.5 15.8 12 20 12 20Z"/>',
  energy: '<path d="M13 2 5 13h5l-1 9 8-11h-5Z"/>',
  sanity: '<path d="M12 3a7 7 0 0 0-7 7c0 2.3 1.1 4.3 2.8 5.5L8 21l4-2 4 2 .2-5.5A7 7 0 1 0 12 3Z"/><path d="M9.5 11.5c1.2-1.8 3.8-1.8 5 0"/><path d="M9.5 8.5h.01"/><path d="M14.5 8.5h.01"/>',
  download: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M4 21h16"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'
};

export function renderIcon(name, className = 'ui-icon', label = '') {
  const svg = ICONS[name] || ICONS.spark;
  const aria = label ? ` aria-label="${escapeAttribute(label)}"` : ' aria-hidden="true"';
  return `<span class="${className}"${aria}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">${svg}</svg></span>`;
}

export function renderButtonLabel(iconName, label, options = {}) {
  if (options.iconOnly) {
    return `<span class="button-content button-content--icon-only">${renderIcon(iconName, 'ui-icon', label)}</span>`;
  }

  return `<span class="button-content">${renderIcon(iconName)}<span class="button-text">${escapeHtml(label)}</span></span>`;
}
