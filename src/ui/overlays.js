import { escapeHtml } from '../core/utils.js';
import { renderButtonLabel, renderIcon } from './icons.js';

export function createUiLayer({ modalRoot, toastRoot, enhanceSelects }) {
  let activeModal = null;
  let activeLightbox = null;

  function closeLightbox() {
    if (activeLightbox?.parentNode) {
      activeLightbox.parentNode.removeChild(activeLightbox);
    }
    activeLightbox = null;
  }

  function closeModal() {
    if (activeModal?.parentNode) {
      activeModal.parentNode.removeChild(activeModal);
    }
    activeModal = null;
  }

  function handleEscape(event) {
    if (event.key !== 'Escape') return;
    if (activeLightbox) {
      closeLightbox();
      return;
    }
    if (activeModal) closeModal();
  }

  window.addEventListener('keydown', handleEscape);

  function toast(title, text, tone = 'success') {
    if (!toastRoot || !title) return;

    const element = document.createElement('div');
    element.className = `toast toast--${tone}`;
    element.innerHTML = `
      <div class="toast__title">${escapeHtml(title)}</div>
      <div class="toast__text">${escapeHtml(text || '')}</div>
    `;

    toastRoot.appendChild(element);
    window.setTimeout(() => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(12px)';
      window.setTimeout(() => element.remove(), 220);
    }, 2600);
  }

  function openModal({
    title,
    subtitle,
    eyebrow = 'Template estruturado',
    body,
    submitText = 'Confirmar',
    submitTone = 'primary',
    onSubmit
  }) {
    closeLightbox();
    closeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = `
      <div class="modal-card" role="dialog" aria-modal="true">
        <div class="modal-header">
          <div>
            <p class="eyebrow">${escapeHtml(eyebrow)}</p>
            <h2>${escapeHtml(title)}</h2>
            ${subtitle ? `<p class="item-card__meta modal-subtitle">${escapeHtml(subtitle)}</p>` : ''}
          </div>
          <button class="modal-close icon-button" type="button" aria-label="Fechar">${renderIcon('close')}</button>
        </div>
        <form class="modal-form">
          <div class="modal-body">${body}</div>
          <div class="modal-footer">
            <button type="button" class="ghost-button modal-cancel">${renderButtonLabel('close', 'Cancelar')}</button>
            <button type="submit" class="control-button control-button--${escapeHtml(submitTone)}">${escapeHtml(submitText)}</button>
          </div>
        </form>
      </div>
    `;

    modalRoot.appendChild(backdrop);
    activeModal = backdrop;
    enhanceSelects(backdrop);

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeModal();
    });
    backdrop.querySelector('.modal-close')?.addEventListener('click', closeModal);
    backdrop.querySelector('.modal-cancel')?.addEventListener('click', closeModal);
    backdrop.querySelector('.modal-form')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      onSubmit(formData, event.currentTarget);
    });
  }

  function openLightbox({ src, alt, caption = '' }) {
    if (!src) return;
    closeModal();
    closeLightbox();

    const backdrop = document.createElement('div');
    backdrop.className = 'image-lightbox';
    backdrop.innerHTML = `
      <button class="image-lightbox__close icon-button" type="button" aria-label="Fechar">${renderIcon('close')}</button>
      <div class="image-lightbox__dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(alt || 'Imagem ampliada')}">
        <div class="image-lightbox__frame">
          <img class="image-lightbox__image" src="${escapeHtml(src)}" alt="${escapeHtml(alt || 'Imagem ampliada')}" />
        </div>
        ${caption ? `<p class="image-lightbox__caption">${escapeHtml(caption)}</p>` : ''}
      </div>
    `;

    modalRoot.appendChild(backdrop);
    activeLightbox = backdrop;

    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) closeLightbox();
    });
    backdrop.querySelector('.image-lightbox__close')?.addEventListener('click', closeLightbox);
  }

  return {
    toast,
    openModal,
    closeModal,
    openLightbox,
    closeLightbox
  };
}
