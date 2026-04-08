import { renderMobileCompendiumView, bindMobileCompendiumView } from './compendium.js';
import { renderMobileMesaView, bindMobileMesaView } from './mesa.js';
import { renderMobileOrderView, bindMobileOrderView } from './order.js';
import { renderMobileRollsView, bindMobileRollsView } from './rolls.js';
import { renderMobileSheetView, bindMobileSheetView } from './sheet.js';

const VIEW_RENDERERS = {
  sheet: {
    render: renderMobileSheetView,
    bind: bindMobileSheetView
  },
  rolls: {
    render: renderMobileRollsView,
    bind: bindMobileRollsView
  },
  order: {
    render: renderMobileOrderView,
    bind: bindMobileOrderView
  },
  compendium: {
    render: renderMobileCompendiumView,
    bind: bindMobileCompendiumView
  },
  mesa: {
    render: renderMobileMesaView,
    bind: bindMobileMesaView
  }
};

export function renderMobileCurrentView(ctx) {
  const key = ctx.runtime.ui.currentView;
  return (VIEW_RENDERERS[key] || VIEW_RENDERERS.sheet).render(ctx);
}

export function bindMobileCurrentView(ctx) {
  const key = ctx.runtime.ui.currentView;
  const binder = (VIEW_RENDERERS[key] || VIEW_RENDERERS.sheet).bind;
  if (!ctx.dom.mobileViewHost || typeof binder !== 'function') return;
  binder(ctx, ctx.dom.mobileViewHost);
}
