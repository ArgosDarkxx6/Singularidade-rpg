import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BookOpenText, ExternalLink, Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PageIntro } from '@components/shared/page-intro';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select } from '@components/ui/field';
import { useSyncView } from '@hooks/use-sync-view';
import {
  BOOK_CHAPTERS,
  CANON_PRESETS,
  GLOSSARY_GROUPS,
  filterGlossaryEntries
} from '@features/compendium/data';
import type { BookBlock, BookChapter } from '@features/compendium/data';
import { searchReferenceCards } from '@services/references/reference-service';
import { useWorkspace } from '@features/workspace/use-workspace';

type ReferenceScope = 'all' | 'lore' | 'media';

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

function BookBlockView({ block }: { block: BookBlock }) {
  if (block.type === 'paragraph') {
    return <p className="text-sm leading-7 text-soft">{block.text}</p>;
  }

  if (block.type === 'list') {
    return (
      <div className="rounded-[24px] border border-white/10 bg-white/4 p-4">
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
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/4">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{block.title}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/3 text-soft">
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

  const toneClass =
    block.type === 'rule'
      ? 'border-sky-300/16 bg-sky-500/8'
      : block.type === 'example'
        ? 'border-amber-300/16 bg-amber-500/8'
        : block.type === 'reference'
          ? 'border-emerald-300/16 bg-emerald-500/8'
          : 'border-white/10 bg-white/5';
  const titledBlock = block as Extract<BookBlock, { title: string }>;

  return (
    <div className={`rounded-[24px] border p-4 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{'label' in block ? block.label || block.type : block.type}</p>
      <h4 className="mt-2 font-display text-2xl">{titledBlock.title}</h4>
      {'body' in block ? <p className="mt-3 text-sm leading-7 text-soft">{block.body}</p> : null}
      {'items' in block ? (
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-soft">
          {block.items.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function CompendiumPage() {
  useSyncView('compendium');

  const [searchParams, setSearchParams] = useSearchParams();
  const { compendiumCategory, compendiumQuery, setCompendiumCategory, setCompendiumQuery } = useWorkspace();
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
    if (!deferredQuery.trim()) return [];
    return [
      ...CANON_PRESETS.techniques,
      ...CANON_PRESETS.weapons,
      ...CANON_PRESETS.passives,
      ...CANON_PRESETS.inventory
    ].filter((preset) =>
      [preset.name, preset.origin, preset.description, ...preset.tags]
        .join(' ')
        .toLowerCase()
        .includes(deferredQuery.toLowerCase())
    );
  }, [deferredQuery]);

  return (
    <div className="page-grid">
      <PageIntro
        eyebrow="Livro e referencia"
        title="Compendio editorial, presets e busca externa."
        description="Leia o livro por capitulo, navegue pelo glossario, localize presets canonicos e consulte referencias externas sem sair da shell."
        chips={[`${BOOK_CHAPTERS.length} capitulos`, `${GLOSSARY_GROUPS.length} grupos de glossario`, '/assets/Singularidade_Livro_de_Regras.pdf']}
        actions={
          <>
            <Button variant="secondary" onClick={() => window.open('/assets/Singularidade_Livro_de_Regras.pdf', '_blank', 'noopener,noreferrer')}>
              <BookOpenText className="size-4" />
              Abrir PDF
            </Button>
          </>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="p-5">
          <SectionTitle eyebrow="Busca" title="Navegacao do livro" description="Filtre capitulos, glossario e referencias externas pelo mesmo campo." />

          <div className="mt-5 grid gap-4">
            <Field label="Buscar">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  className="pl-11"
                  value={compendiumQuery}
                  placeholder="Regra, tecnica, dominio, SAN, personagem..."
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

            <Field label="Categoria">
              <Select value={compendiumCategory} onChange={(event) => setCompendiumCategory(event.target.value)}>
                <option value="all">Tudo</option>
                <option value="glossary">Somente glossario</option>
                {GLOSSARY_GROUPS.map((group) => (
                  <option key={group.key} value={group.key}>
                    {group.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-6 grid gap-2">
            {BOOK_CHAPTERS.map((chapter) => (
              <button
                key={chapter.id}
                type="button"
                onClick={() => setActiveChapterId(chapter.id)}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  activeChapterId === chapter.id ? 'border-sky-300/24 bg-sky-500/10 text-white' : 'border-white/10 bg-white/4 text-soft hover:text-white'
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted">{chapter.label}</p>
                <p className="mt-1 text-sm font-semibold">{chapter.title}</p>
              </button>
            ))}
          </div>
        </Card>

        <div className="grid gap-6">
          <Card className="overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6">
                {deferredQuery.trim() ? (
                  <>
                    <SectionTitle
                      eyebrow="Resultado imediato"
                      title={`Busca por "${deferredQuery}"`}
                      description={`${filteredChapters.length} capitulos relevantes, ${filteredGlossary.reduce((total, group) => total + group.entries.length, 0)} verbetes e ${presetMatches.length} presets em destaque.`}
                    />
                    <div className="mt-5 grid gap-4">
                      {filteredChapters.length ? (
                        filteredChapters.slice(0, 3).map((chapter) => (
                          <div key={chapter.id} className="rounded-[24px] border border-white/10 bg-white/4 p-4">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{chapter.label}</p>
                            <h3 className="mt-2 font-display text-3xl">{chapter.title}</h3>
                            <p className="mt-2 text-sm text-soft">{chapter.summary}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {chapter.sections.slice(0, 3).map((section) => (
                                <button
                                  key={section.id}
                                  type="button"
                                  onClick={() => setActiveChapterId(chapter.id)}
                                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft"
                                >
                                  {section.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <EmptyState title="Nenhum capitulo encontrou esse termo." body="Tente outro nome, termo de regra ou mude a categoria do filtro." />
                      )}
                    </div>
                  </>
                ) : activeChapter ? (
                  <>
                    <SectionTitle eyebrow={activeChapter.label} title={activeChapter.title} description={activeChapter.summary} />
                    <div className="mt-6 grid gap-5">
                      {activeChapter.sections.map((section) => (
                        <motion.section key={section.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-white/10 bg-white/4 p-5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{section.id}</p>
                          <h3 className="mt-2 font-display text-4xl leading-none">{section.title}</h3>
                          <p className="mt-3 text-sm leading-6 text-soft">{section.summary}</p>
                          <div className="mt-5 grid gap-4">
                            {section.blocks.map((block, index) => (
                              <BookBlockView key={`${section.id}-${block.type}-${index}`} block={block} />
                            ))}
                          </div>
                        </motion.section>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState title="Capitulo nao encontrado." body="Selecione outro item na navegação ou use a busca para localizar um trecho especifico." />
                )}
              </div>

              <div className="relative overflow-hidden border-t border-white/10 bg-[linear-gradient(180deg,rgba(9,20,31,0.9),rgba(5,13,21,0.95))] p-6 lg:border-l lg:border-t-0">
                <img
                  src="/assets/book_art/figures/opening-trio-hero.png"
                  alt=""
                  className="pointer-events-none absolute inset-x-0 top-0 w-full opacity-18"
                />
                <div className="relative z-10">
                  <SectionTitle eyebrow="Glossario" title="Verbetes prontos" description="Resumo rapido de termos, tecnicas, objetos e dominios para consulta imediata." />
                  <div className="mt-5 grid gap-4">
                    {filteredGlossary.length ? (
                      filteredGlossary.slice(0, 4).map((group) => (
                        <div key={group.key} className="rounded-[24px] border border-white/10 bg-white/4 p-4">
                          <div className="flex items-center gap-3">
                            <img src={`/${group.art}`} alt="" className="size-14 rounded-2xl object-cover" />
                            <div>
                              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{group.label}</p>
                              <p className="mt-1 text-sm text-soft">{group.entries.length} verbetes</p>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-2">
                            {group.entries.slice(0, 3).map((entry) => (
                              <div key={entry.id} className="rounded-2xl border border-white/8 bg-slate-950/40 px-3 py-3">
                                <p className="text-sm font-semibold text-white">{entry.name}</p>
                                <p className="mt-1 text-xs text-soft">{entry.summary}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <EmptyState title="Sem verbetes para este filtro." body="Ajuste a busca ou selecione outra categoria do glossario." />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <Card className="p-6">
              <SectionTitle eyebrow="Presets canônicos" title="Banco de referencias jogaveis" description="Armas, tecnicas, passivas e itens com origem canonica para uso rápido na ficha." />
              <div className="mt-5 grid gap-3">
                {(deferredQuery.trim() ? presetMatches : [...CANON_PRESETS.techniques.slice(0, 2), ...CANON_PRESETS.weapons.slice(0, 2), ...CANON_PRESETS.inventory.slice(0, 2)]).map((preset) => (
                  <div key={preset.id} className="rounded-[24px] border border-white/10 bg-white/4 p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{preset.origin}</p>
                    <h3 className="mt-2 text-base font-semibold text-white">{preset.name}</h3>
                    <p className="mt-2 text-sm text-soft">{preset.description}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {preset.tags.map((tag) => (
                        <span key={`${preset.id}-${tag}`} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
                {!presetMatches.length && deferredQuery.trim() ? (
                  <EmptyState title="Nenhum preset encontrado." body="Use nomes de tecnica, arma ou itens da obra para localizar presets canônicos." />
                ) : null}
              </div>
            </Card>

            <Card className="p-6">
              <SectionTitle
                eyebrow="Referencias externas"
                title="Wiki e AniList"
                description="Consulta externa via worker/proxy quando disponível, com fallback local para links diretos."
                actions={
                  <Select value={referenceScope} onChange={(event) => setReferenceScope(event.target.value as ReferenceScope)} className="min-w-40">
                    <option value="all">Tudo</option>
                    <option value="lore">Somente lore</option>
                    <option value="media">Somente mídia</option>
                  </Select>
                }
              />

              <div className="mt-5 grid gap-3">
                {referencesQuery.isFetching ? (
                  Array.from({ length: 3 }).map((_, index) => (
                    <div key={`reference-skeleton-${index}`} className="h-32 animate-pulse rounded-[24px] border border-white/10 bg-white/4" />
                  ))
                ) : referencesQuery.data?.length ? (
                  referencesQuery.data.map((card) => (
                    <a
                      key={card.id}
                      href={card.url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-[24px] border border-white/10 bg-white/4 p-4 transition hover:border-sky-300/22 hover:bg-white/6"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">{card.category} · {card.source}</p>
                          <h3 className="mt-2 text-base font-semibold text-white">{card.title}</h3>
                        </div>
                        <ExternalLink className="size-4 text-sky-200" />
                      </div>
                      <p className="mt-3 text-sm text-soft">{card.summary}</p>
                      {card.meta ? <p className="mt-3 text-xs uppercase tracking-[0.16em] text-sky-200">{card.meta}</p> : null}
                    </a>
                  ))
                ) : (
                  <EmptyState
                    title="Busca externa em espera."
                    body={deferredQuery.trim().length < 3 ? 'Digite ao menos 3 caracteres para ativar o proxy de referencias externas.' : 'Nenhuma referencia externa retornou resultados para a consulta atual.'}
                  />
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
