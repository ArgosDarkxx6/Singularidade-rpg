import type { ExternalReferenceCard } from '@/types/domain';

function buildFallbackCards(query: string): ExternalReferenceCard[] {
  const encoded = encodeURIComponent(query.trim());
  if (!encoded) return [];

  return [
    {
      id: `fallback-lore-${encoded}`,
      title: `Wiki: ${query}`,
      category: 'Lore / Wiki',
      summary: 'Busca direta na wiki de Jujutsu Kaisen para aprofundar a referencia consultada no compendio.',
      source: 'Jujutsu Kaisen Wiki',
      provider: 'lore',
      url: `https://jujutsu-kaisen.fandom.com/wiki/Special:Search?query=${encoded}`,
      meta: 'Fallback local'
    },
    {
      id: `fallback-media-${encoded}`,
      title: `AniList: ${query}`,
      category: 'Anime / Manga',
      summary: 'Busca direta no AniList para localizar episodio, arco, personagem ou tecnica associada.',
      source: 'AniList',
      provider: 'media',
      url: `https://anilist.co/search/anime?search=${encoded}`,
      meta: 'Fallback local'
    }
  ];
}

export async function searchReferenceCards(query: string, scope: 'all' | 'lore' | 'media' = 'all'): Promise<ExternalReferenceCard[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  try {
    const response = await fetch(`/api/references?q=${encodeURIComponent(cleanQuery)}&scope=${encodeURIComponent(scope)}`);
    if (!response.ok) throw new Error('Falha ao consultar referencias.');
    const payload = (await response.json()) as { cards?: ExternalReferenceCard[] };
    const cards = payload.cards || [];
    if (cards.length) return cards;
  } catch {
    return buildFallbackCards(cleanQuery).filter((card) => scope === 'all' || card.provider === scope);
  }

  return buildFallbackCards(cleanQuery).filter((card) => scope === 'all' || card.provider === scope);
}

