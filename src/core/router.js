const VIEW_TO_PATH = {
  sheet: '/fichas',
  rolls: '/rolagens',
  order: '/ordem',
  compendium: '/livro',
  mesa: '/mesa'
};

export const DEFAULT_ROUTE_VIEW = 'sheet';

export function isKnownView(view) {
  return Object.prototype.hasOwnProperty.call(VIEW_TO_PATH, view);
}

export function getPathForView(view, options = {}) {
  const normalizedView = isKnownView(view) ? view : DEFAULT_ROUTE_VIEW;
  if (normalizedView === 'mesa' && options.tableSlug) {
    return `/mesa/${encodeURIComponent(String(options.tableSlug).trim())}`;
  }
  return VIEW_TO_PATH[normalizedView];
}

export function buildAppUrl(view, options = {}) {
  const path = getPathForView(view, options);
  const url = new URL(options.origin || globalThis.location?.origin || 'https://example.invalid');
  url.pathname = path;
  url.search = '';
  url.hash = '';

  const query = options.query && typeof options.query === 'object' ? options.query : {};
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    url.searchParams.set(key, String(value));
  });

  return url;
}

export function parseAppLocation(locationLike = globalThis.location) {
  const pathname = String(locationLike?.pathname || '/');
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const mesaMatch = cleanPath.match(/^\/mesa\/([^/]+)$/);

  if (cleanPath === '/' || cleanPath === '/index.html') {
    return {
      view: DEFAULT_ROUTE_VIEW,
      tableSlug: '',
      redirectTo: getPathForView(DEFAULT_ROUTE_VIEW),
      pathname: cleanPath
    };
  }

  if (cleanPath === '/fichas') return { view: 'sheet', tableSlug: '', redirectTo: '', pathname: cleanPath };
  if (cleanPath === '/rolagens') return { view: 'rolls', tableSlug: '', redirectTo: '', pathname: cleanPath };
  if (cleanPath === '/ordem') return { view: 'order', tableSlug: '', redirectTo: '', pathname: cleanPath };
  if (cleanPath === '/livro') return { view: 'compendium', tableSlug: '', redirectTo: '', pathname: cleanPath };
  if (cleanPath === '/mesa') return { view: 'mesa', tableSlug: '', redirectTo: '', pathname: cleanPath };
  if (mesaMatch) {
    return {
      view: 'mesa',
      tableSlug: decodeURIComponent(mesaMatch[1]),
      redirectTo: '',
      pathname: cleanPath
    };
  }

  return {
    view: DEFAULT_ROUTE_VIEW,
    tableSlug: '',
    redirectTo: getPathForView(DEFAULT_ROUTE_VIEW),
    pathname: cleanPath
  };
}

export function isCanonicalAppPath(pathname = '') {
  const cleanPath = String(pathname || '').replace(/\/+$/, '') || '/';
  if (cleanPath === '/' || cleanPath === '/fichas' || cleanPath === '/rolagens' || cleanPath === '/ordem' || cleanPath === '/livro' || cleanPath === '/mesa') {
    return true;
  }
  return /^\/mesa\/[^/]+$/.test(cleanPath);
}
