import { escapeAttribute, escapeHtml } from '../../core/utils.js';
import { renderButtonLabel } from '../../ui/icons.js';

export function renderMobileHero({ eyebrow, title, body, actions = '' }) {
  return `
    <article class="mobile-hero-card">
      <div class="mobile-panel__header">
        <div>
          ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
          <h1>${escapeHtml(title)}</h1>
        </div>
      </div>
      <p>${escapeHtml(body)}</p>
      ${actions || ''}
    </article>
  `;
}

export function renderMobilePanel({ eyebrow, title, body, actions = '', className = '' }) {
  return `
    <section class="mobile-panel ${escapeHtml(className)}">
      <div class="mobile-panel__header">
        <div>
          ${eyebrow ? `<p class="eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
          <h2>${escapeHtml(title)}</h2>
        </div>
      </div>
      <div class="mobile-panel__body">
        ${body}
      </div>
      ${actions}
    </section>
  `;
}

export function renderMobileField({
  label,
  name,
  value = '',
  type = 'text',
  placeholder = '',
  rows = 4,
  wide = false,
  disabled = false,
  tag = 'input'
}) {
  const className = `mobile-form-field${wide ? ' mobile-form-field--wide' : ''}`;
  if (tag === 'textarea') {
    return `
      <label class="${className}">
        <span>${escapeHtml(label)}</span>
        <textarea name="${escapeAttribute(name)}" rows="${rows}" placeholder="${escapeAttribute(placeholder)}" ${disabled ? 'disabled' : ''}>${escapeHtml(value)}</textarea>
      </label>
    `;
  }

  return `
    <label class="${className}">
      <span>${escapeHtml(label)}</span>
      <input name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" value="${escapeAttribute(value)}" placeholder="${escapeAttribute(placeholder)}" ${disabled ? 'disabled' : ''} />
    </label>
  `;
}

export function renderMobileSelect({ label, name, value = '', options = [], wide = false, disabled = false }) {
  const className = `mobile-form-field${wide ? ' mobile-form-field--wide' : ''}`;
  return `
    <label class="${className}">
      <span>${escapeHtml(label)}</span>
      <select name="${escapeAttribute(name)}" ${disabled ? 'disabled' : ''}>
        ${options.map((option) => `<option value="${escapeAttribute(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>${escapeHtml(option.label)}</option>`).join('')}
      </select>
    </label>
  `;
}

export function renderMobileButton(icon, label, className = 'control-button control-button--primary', attributes = '') {
  return `<button type="button" class="${className}" ${attributes}>${renderButtonLabel(icon, label)}</button>`;
}

export function renderMobileEmptyState(title, body) {
  return `
    <div class="mobile-info-card">
      <span>${escapeHtml(title)}</span>
      <p>${escapeHtml(body)}</p>
    </div>
  `;
}

export function renderMobileMetric(label, value, detail = '') {
  return `
    <article class="mobile-metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      ${detail ? `<p>${escapeHtml(detail)}</p>` : ''}
    </article>
  `;
}

export function formEntries(form) {
  return Object.fromEntries(new FormData(form).entries());
}
