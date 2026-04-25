import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpenText, ExternalLink, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@components/ui/button';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { ScrollArea } from '@components/ui/scroll-area';
import { MesaPageLead, MesaSectionPanel } from '@features/mesa/components/mesa-page-primitives';
import { MesaRailCard } from '@features/mesa/components/mesa-section-primitives';
import { BOOK_CHAPTERS, CANON_PRESETS, GLOSSARY_GROUPS, filterGlossaryEntries } from '@features/compendium/data';
import type { BookBlock, BookChapter } from '@features/compendium/data';
import { useMesaCompendium } from '@features/workspace/hooks/use-workspace-segments';
import { searchReferenceCards } from '@services/references/reference-service';

type ReferenceScope = 'all' | 'lore' | 'media';

const GLOSSARY_GROUP_STYLES: Record<string, { badge: string; panel: string; accent: string }> = {
  ferramentas: {
    badge: 'from-sky-400/25 via-cyan-400/18 to-blue-500/14',
    panel: 'border-sky-300/14 bg-sky-500/7',
    accent: 'text-sky-200'
  },
  tecnicas: {
    badge: 'from-violet-400/22 via-indigo-400/16 to-sky-500/14',
    panel: 'border-violet-300/14 bg-violet-500/7',
    accent: 'text-violet-200'
  },
  objetos: {
    badge: 'from-emerald-400/22 via-teal-400/16 to-cyan-500/14',
    panel: 'border-emerald-300/14 bg-emerald-500/7',
    accent: 'text-emerald-200'
  },
  dominios: {
    badge: 'from-amber-400/22 via-orange-400/16 to-rose-500/14',
    panel: 'border-amber-300/14 bg-amber-500/7',
    accent: 'text-amber-200'
  }
};

function getGlossaryGroupStyle(groupKey: string) {
  return (
    GLOSSARY_GROUP_STYLES[groupKey] ?? {
      badge: 'from-white/12 via-white/8 to-white/4',
      panel: 'border-white/10 bg-white/5',
      accent: 'text-white/70'
    }
  );
}

function getGlossaryGroupMark(label: string) {
  return label
    .split(' ')
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

function filterChapters(chapters: readonly BookChapter[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return chapters;

  return chapters
    .map((chapter) => ({
      ...chapter,
      sections: chapter.sections.filter((section) => {
        const searchable = [
          chapter.title,
          chapter.summary,
          section.title,
          section.summary,
          ...section.blocks.flatMap((block) => {
            if (block.type === 'paragraph') return [block.text];
            if (block.type === 'list') return [block.title, ...block.items];
            if (block.type === 'table') return [block.title, ...block.columns, ...block.rows.flat()];
            if ('body' in block) return [block.title, block.body];
            if ('items' in block) return [block.title, ...block.items];
            return [];
          })
        ]
          .join(' ')
          .toLowerCase();

        return searchable.includes(normalized);
      })
    }))
    .filter((chapter) => chapter.sections.length > 0);
}

function toneClass(block: Extract<BookBlock, { type: 'rule' | 'example' | 'callout' | 'reference' }>) {
  if (block.type === 'rule') return 'border-sky-300/16 bg-sky-500/8';
  if (block.type === 'example') return 'border-amber-300/16 bg-amber-500/8';
  if (block.type === 'reference') return 'border-emerald-300/16 bg-emerald-500/8';
  if (block.tone === 'gold') return 'border-amber-300/16 bg-amber-500/8';
  if (block.tone === 'climax') return 'border-rose-300/16 bg-rose-500/8';
  return 'border-white/10 bg-white/5';
}

function BookBlockView({ block }: { block: BookBlock }) {
  if (block.type === 'paragraph') {
    return <p className="text-sm leading-7 text-soft">{block.text}</p>;
  }

  if (block.type === 'list') {
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{block.title}</p>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-soft">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{block.title}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.03] text-soft">
              <tr>
                {block.columns.map((column) => (
                  <th key={column} className="px-4 py-3 font-semibold">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={`${block.title}-${rowIndex}`} className="border-t border-white/6">
                  {row.map((cell, cellIndex) => (
                    <td key={`${block.title}-${rowIndex}-${cellIndex}`} className="px-4 py-3 text-soft">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const titledBlock = block as Extract<BookBlock, { title: string }>;

  return (
    <div className={`rounded-lg border p-4 ${toneClass(block)}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{'label' in block ? block.label || block.type : block.type}</p>
      <h4 className="mt-2 font-display text-2xl text-white">{titledBlock.title}</h4>
      {'body' in block ? <p className="mt-3 text-sm leading-7 text-soft">{block.body}</p> : null}
      {'items' in block ? (
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-soft">
          {block.items.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-300" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function MesaCompendiumPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { compendiumCategory, compendiumQuery, setCompendiumCategory, setCompendiumQuery } = useMesaCompendium();
  const [activeChapterId, setActiveChapterId] = useState(BOOK_CHAPTERS[0]?.id || '');
  const [referenceScope, setReferenceScope] = useState<ReferenceScope>('all');

  useEffect(() => {
    const routeQuery = searchParams.get('q') || '';
    if (routeQuery && routeQuery !== compendiumQuery) {
      setCompendiumQuery(routeQuery);
    }
  }, [compendiumQuery, searchParams, setCompendiumQuery]);

  const deferredQuery = useDeferredValue(compendiumQuery);
  const filteredChapters = useMemo(() => filterChapters(BOOK_CHAPTERS, deferredQuery), [deferredQuery]);
  const filteredGlossary = useMemo(() => filterGlossaryEntries(deferredQuery, compendiumCategory), [deferredQuery, compendiumCategory]);

  useEffect(() => {
    if (!filteredChapters.length) return;
    if (!filteredChapters.some((chapter) => chapter.id === activeChapterId)) {
      setActiveChapterId(filteredChapters[0].id);
    }
  }, [activeChapterId, filteredChapters]);

  const referencesQuery = useQuery({
    queryKey: ['references', deferredQuery, referenceScope],
    queryFn: () => searchReferenceCards(deferredQuery, referenceScope),
    enabled: deferredQuery.trim().length >= 3
  });

  const activeChapter = useMemo(
    () => filteredChapters.find((chapter) => chapter.id === activeChapterId) || filteredChapters[0] || null,
    [activeChapterId, filteredChapters]
  );

  const presetMatches = useMemo(() => {
    const pool = [...CANON_PRESETS.techniques, ...CANON_PRESETS.weapons, ...CANON_PRESETS.passives, ...CANON_PRESETS.inventory];

    if (!deferredQuery.trim()) return pool.slice(0, 6);

    return pool.filter((preset) =>
      [preset.name, preset.origin, preset.description, ...preset.tags]
        .join(' ')
        .toLowerCase()
        .includes(deferredQuery.toLowerCase())
    );
  }, [deferredQuery]);

  const glossaryCount = filteredGlossary.reduce((total, group) => total + group.entries.length, 0);

  return (
    <div className="page-shell pb-8">
      <MesaPageLead
        eyebrow="Livro"
        title="Livro"
        actions={
          <Button variant="secondary" onClick={() => window.open('/assets/Singularidade_Livro_de_Regras.pdf', '_blank', 'noopener,noreferrer')}>
            <BookOpenText className="size-4" />
            Abrir PDF
          </Button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(260px,0.38fr)_minmax(0,1fr)]">
        <MesaSectionPanel eyebrow="Navegação" title="Capítulos">
          <div className="mt-5 grid gap-4">
            <Field label="Buscar">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  value={compendiumQuery}
                  placeholder="Regra, técnica, domínio, SAN…"
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    startTransition(() => {
                      setCompendiumQuery(nextValue);
                      setSearchParams((current) => {
                        const next = new URLSearchParams(current);
                        if (nextValue.trim()) next.set('q', nextValue);
                        else next.delete('q');
                        return next;
                      });
                    });
                  }}
                />
              </div>
            </Field>

            <Field label="Categoria do glossário">
              <Select value={compendiumCategory} onChange={(event) => setCompendiumCategory(event.target.value)}>
                <option value="all">Tudo</option>
                <option value="glossary">Somente glossário</option>
                {GLOSSARY_GROUPS.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="grid gap-2">
            <UtilityPanel className="rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Capítulos</p>
              <p className="mt-2 text-2xl font-semibold text-white">{filteredChapters.length}</p>
            </UtilityPanel>
            <UtilityPanel className="rounded-lg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Verbetes</p>
              <p className="mt-2 text-2xl font-semibold text-white">{glossaryCount}</p>
            </UtilityPanel>
          </div>

          <div className="mt-5 overflow-hidden rounded-lg border border-white/10 bg-white/[0.02]">
            <ScrollArea className="h-[min(52vh,560px)]">
              <div className="grid gap-2 p-3">
                {filteredChapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    onClick={() => setActiveChapterId(chapter.id)}
                    className={`rounded-lg border px-4 py-3 text-left transition ${
                      activeChapterId === chapter.id ? 'border-sky-300/24 bg-sky-500/10 text-white' : 'border-white/10 bg-white/[0.03] text-soft hover:text-white'
                    }`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{chapter.label}</p>
                    <p className="mt-2 text-sm font-semibold">{chapter.title}</p>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-soft">{chapter.summary}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </MesaSectionPanel>

        <div className="grid gap-4">
          {deferredQuery.trim() ? (
            <MesaSectionPanel eyebrow="Busca" title={`Resultados para "${deferredQuery}"`}>
              <div className="mt-4 grid gap-3">
                {filteredChapters.length ? (
                  filteredChapters.map((chapter) => (
                    <div key={chapter.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{chapter.label}</p>
                          <h3 className="mt-2 font-display text-xl leading-tight text-white">{chapter.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-soft">{chapter.summary}</p>
                        </div>
                        <Button variant="secondary" onClick={() => setActiveChapterId(chapter.id)}>
                          Abrir capítulo
                        </Button>
                      </div>

                      <div className="mt-5 grid gap-4">
                        {chapter.sections.map((section) => (
                          <UtilityPanel key={section.id} className="rounded-lg p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{section.id}</p>
                            <p className="mt-2 text-base font-semibold text-white">{section.title}</p>
                            <p className="mt-2 text-sm leading-6 text-soft">{section.summary}</p>
                          </UtilityPanel>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="Nada encontrado." body="Tente outro termo ou abra um capítulo." />
                )}
              </div>
            </MesaSectionPanel>
          ) : activeChapter ? (
            <MesaSectionPanel eyebrow={activeChapter.label} title={activeChapter.title}>
              <p className="max-w-3xl text-sm leading-6 text-soft">{activeChapter.summary}</p>
              <div className="mt-4 grid gap-3">
                {activeChapter.sections.map((section) => (
                  <motion.section key={section.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{section.id}</p>
                    <h3 className="mt-2 font-display text-xl font-semibold leading-tight text-white">{section.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-soft">{section.summary}</p>
                    <div className="mt-5 grid gap-4">
                      {section.blocks.map((block, index) => (
                        <BookBlockView key={`${section.id}-${block.type}-${index}`} block={block} />
                      ))}
                    </div>
                  </motion.section>
                ))}
              </div>
            </MesaSectionPanel>
          ) : (
            <EmptyState title="Capítulo não encontrado." body="Selecione outro item na navegação ou use a busca para localizar um trecho específico." />
          )}
        </div>

        <div className="page-right-rail xl:col-span-2">
          <MesaRailCard
            eyebrow="Glossário"
            title="Verbetes em destaque"
            description="Termos, técnicas, objetos e domínios ligados ao termo atual."
          >
            {filteredGlossary.length ? (
              filteredGlossary.slice(0, 4).map((group) => (
                <UtilityPanel key={group.key} className={`rounded-lg p-4 ${getGlossaryGroupStyle(group.key).panel}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex size-14 items-center justify-center rounded-lg border border-white/10 bg-gradient-to-br ${getGlossaryGroupStyle(group.key).badge} shadow-[0_10px_30px_rgba(2,8,15,0.35)]`}>
                      <span className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${getGlossaryGroupStyle(group.key).accent}`}>
                        {getGlossaryGroupMark(group.label)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{group.label}</p>
                      <p className="mt-1 text-sm text-soft">{group.entries.length} verbetes</p>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-2">
                    {group.entries.slice(0, 3).map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/8 bg-slate-950/40 px-3 py-3">
                        <p className="text-sm font-semibold text-white">{entry.name}</p>
                        <p className="mt-1 text-xs leading-5 text-soft">{entry.summary}</p>
                      </div>
                    ))}
                  </div>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Sem verbetes neste recorte." body="Ajuste a busca ou a categoria." />
            )}
          </MesaRailCard>

          <MesaRailCard eyebrow="Acervo" title="Banco da mesa" description="Armas, técnicas, passivas e itens para consulta rápida.">
            {presetMatches.length ? (
              presetMatches.slice(0, 6).map((preset) => (
                <UtilityPanel key={preset.id} className="rounded-lg p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{preset.origin}</p>
                  <p className="mt-2 text-sm font-semibold text-white">{preset.name}</p>
                  <p className="mt-2 text-sm leading-6 text-soft">{preset.description}</p>
                </UtilityPanel>
              ))
            ) : (
              <EmptyState title="Nada encontrado." body="Busque uma técnica, arma ou item." />
            )}
          </MesaRailCard>

          <MesaRailCard eyebrow="Referências externas" title="Wiki e AniList" description="Busque termos fora do livro quando precisar.">
            <Field label="Escopo">
              <Select value={referenceScope} onChange={(event) => setReferenceScope(event.target.value as ReferenceScope)}>
                <option value="all">Tudo</option>
                <option value="lore">Somente lore</option>
                <option value="media">Somente mídia</option>
              </Select>
            </Field>

            {referencesQuery.isFetching ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div key={`reference-skeleton-${index}`} className="h-28 animate-pulse rounded-lg border border-white/10 bg-white/[0.04]" />
              ))
            ) : referencesQuery.data?.length ? (
              referencesQuery.data.map((card) => (
                <a
                  key={card.id}
                  href={card.url}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-4 transition hover:border-sky-300/22 hover:bg-white/[0.06]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                        {card.category} · {card.source}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-white">{card.title}</h3>
                    </div>
                    <ExternalLink className="size-4 text-sky-200" />
                  </div>
                  <p className="mt-3 text-sm leading-6 text-soft">{card.summary}</p>
                  {card.meta ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-200">{card.meta}</p> : null}
                </a>
              ))
            ) : (
              <EmptyState
                title="Busca externa em espera."
                body={
                  deferredQuery.trim().length < 3
                    ? 'Digite ao menos 3 caracteres.'
                    : 'Nenhuma referência encontrada.'
                }
              />
            )}
          </MesaRailCard>
        </div>
      </div>
    </div>
  );
}
