import { escapeHtml } from '../core/utils.js';
import { renderIcon } from './icons.js';

let eventsBound = false;

export function closeCustomSelects(exceptElement = null) {
  document.querySelectorAll('.custom-select.is-open').forEach((wrapper) => {
    if (exceptElement && (wrapper === exceptElement || wrapper.contains(exceptElement))) return;
    wrapper.classList.remove('is-open');
    wrapper.querySelector('.custom-select__trigger')?.setAttribute('aria-expanded', 'false');
  });
}

export function upgradeCustomSelects(scope = document) {
  if (!scope?.querySelectorAll) return;

  scope.querySelectorAll('select').forEach((select) => {
    if (select.dataset.customized === 'true') return;
    select.dataset.customized = 'true';
    select.classList.add('native-select-hidden');

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-select__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const menu = document.createElement('div');
    menu.className = 'custom-select__menu';
    menu.setAttribute('role', 'listbox');

    select.insertAdjacentElement('afterend', wrapper);
    wrapper.appendChild(select);
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    const sync = () => {
      const selected = select.options[select.selectedIndex] || select.options[0];
      trigger.innerHTML = `<span class="custom-select__label">${escapeHtml(selected ? selected.textContent.trim() : '')}</span>${renderIcon('chevron', 'ui-icon ui-icon--xs')}`;
      menu.innerHTML = Array.from(select.options).map((option, index) => {
        const selectedClass = option.selected ? ' is-selected' : '';
        return `<button type="button" class="custom-select__option${selectedClass}" data-option-index="${index}" role="option" aria-selected="${option.selected ? 'true' : 'false'}">${escapeHtml(option.textContent.trim())}</button>`;
      }).join('');
      trigger.disabled = select.disabled;

      menu.querySelectorAll('[data-option-index]').forEach((button) => {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          const optionIndex = Number(button.dataset.optionIndex);
          if (!select.options[optionIndex]) return;
          select.selectedIndex = optionIndex;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          sync();
          closeCustomSelects();
        });
      });
    };

    trigger.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const willOpen = !wrapper.classList.contains('is-open');
      closeCustomSelects(wrapper);
      wrapper.classList.toggle('is-open', willOpen);
      trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });

    select.addEventListener('change', sync);
    sync();
  });

  if (!eventsBound) {
    eventsBound = true;
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.custom-select')) closeCustomSelects();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeCustomSelects();
    });
  }
}
