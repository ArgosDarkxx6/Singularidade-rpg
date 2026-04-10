import type { MesaSection } from '@/types/domain';
import { MESA_SECTION_LABELS } from '@lib/domain/constants';

export const MESA_NAV_ITEMS: Array<{ section: MesaSection; href: (slug: string) => string; label: string }> = [
  { section: 'overview', href: (slug) => `/mesa/${slug}`, label: MESA_SECTION_LABELS.overview },
  { section: 'fichas', href: (slug) => `/mesa/${slug}/fichas`, label: MESA_SECTION_LABELS.fichas },
  { section: 'rolagens', href: (slug) => `/mesa/${slug}/rolagens`, label: MESA_SECTION_LABELS.rolagens },
  { section: 'ordem', href: (slug) => `/mesa/${slug}/ordem`, label: MESA_SECTION_LABELS.ordem },
  { section: 'livro', href: (slug) => `/mesa/${slug}/livro`, label: MESA_SECTION_LABELS.livro },
  { section: 'membros', href: (slug) => `/mesa/${slug}/membros`, label: MESA_SECTION_LABELS.membros },
  { section: 'configuracoes', href: (slug) => `/mesa/${slug}/configuracoes`, label: MESA_SECTION_LABELS.configuracoes }
];

export function getMesaSectionFromPath(pathname: string): MesaSection {
  if (pathname.endsWith('/fichas')) return 'fichas';
  if (pathname.endsWith('/rolagens')) return 'rolagens';
  if (pathname.endsWith('/ordem')) return 'ordem';
  if (pathname.endsWith('/livro')) return 'livro';
  if (pathname.endsWith('/membros')) return 'membros';
  if (pathname.endsWith('/configuracoes')) return 'configuracoes';
  return 'overview';
}

export function buildMesaSectionPath(slug: string, section: MesaSection) {
  return MESA_NAV_ITEMS.find((item) => item.section === section)?.href(slug) ?? `/mesa/${slug}`;
}
