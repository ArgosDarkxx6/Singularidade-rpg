import { ArrowLeft, ArrowRight, GripVertical, ImagePlus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input } from '@components/ui/field';
import { UtilityPanel } from '@components/ui/panel';
import { SectionTitle } from '@components/shared/section-title';
import { useWorkspace } from '@features/workspace/use-workspace';

export function CharacterGalleryPanel({ editable = true }: { editable?: boolean }) {
  const {
    activeCharacter,
    uploadCharacterGalleryImage,
    updateCharacterGalleryImage,
    removeCharacterGalleryImage,
    reorderCharacterGallery,
    flushPersistence
  } = useWorkspace();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const images = useMemo(() => [...activeCharacter.gallery].sort((left, right) => left.sortOrder - right.sortOrder), [activeCharacter.gallery]);
  const activeImage = viewerIndex === null ? null : images[viewerIndex] || null;

  const moveImage = async (imageId: string, direction: -1 | 1) => {
    const index = images.findIndex((image) => image.id === imageId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= images.length) return;
    const ordered = [...images];
    const [moved] = ordered.splice(index, 1);
    ordered.splice(nextIndex, 0, moved);
    reorderCharacterGallery(activeCharacter.id, ordered.map((image) => image.id));
    await flushPersistence();
  };

  return (
    <Card className="p-4">
      <SectionTitle
        eyebrow="Galeria do personagem"
        title="Imagens extras"
        actions={
          editable ? (
            <Button
              variant="secondary"
              onClick={async () => {
                const picker = document.createElement('input');
                picker.type = 'file';
                picker.accept = 'image/*';
                picker.multiple = true;
                picker.onchange = async () => {
                  const files = Array.from(picker.files || []);
                  for (const file of files) {
                    await uploadCharacterGalleryImage(activeCharacter.id, file);
                  }
                  await flushPersistence();
                };
                picker.click();
              }}
            >
              <ImagePlus className="size-4" />
              Adicionar imagens
            </Button>
          ) : undefined
        }
      />

      <div className="mt-4 grid gap-3">
        {images.length ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {images.map((image, index) => (
              <UtilityPanel key={image.id} className="overflow-hidden rounded-lg">
                <button type="button" className="block w-full text-left" onClick={() => setViewerIndex(index)}>
                  <img src={image.url} alt={image.caption || `${activeCharacter.name} ${index + 1}`} className="h-48 w-full object-cover" />
                </button>
                <div className="grid gap-3 p-3.5">
                  <div className="flex items-start gap-3">
                    {editable ? <GripVertical className="mt-0.5 size-4 shrink-0 text-muted" /> : null}
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Imagem {index + 1}</p>
                      {editable ? (
                        <Field label="Legenda" className="mt-2">
                          <Input
                            value={image.caption}
                            onChange={(event) => updateCharacterGalleryImage(activeCharacter.id, image.id, { caption: event.target.value })}
                            onBlur={async () => {
                              await flushPersistence();
                            }}
                          />
                        </Field>
                      ) : (
                        <p className="mt-2 text-sm leading-6 text-soft">{image.caption || 'Sem legenda adicionada.'}</p>
                      )}
                    </div>
                  </div>

                  {editable ? (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="secondary" onClick={() => void moveImage(image.id, -1)} disabled={index === 0}>
                        <ArrowLeft className="size-4" />
                        Subir
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => void moveImage(image.id, 1)} disabled={index === images.length - 1}>
                        <ArrowRight className="size-4" />
                        Descer
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={async () => {
                          removeCharacterGalleryImage(activeCharacter.id, image.id);
                          await flushPersistence();
                        }}
                      >
                        <Trash2 className="size-4" />
                        Remover
                      </Button>
                    </div>
                  ) : null}
                </div>
              </UtilityPanel>
            ))}
          </div>
        ) : (
          <EmptyState title="Sem imagens extras." body="Adicione referências visuais do personagem." />
        )}
      </div>

      <Dialog open={viewerIndex !== null} onOpenChange={(open) => !open && setViewerIndex(null)}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden p-0">
          {activeImage ? (
            <div className="grid max-h-[90vh] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px]">
              <div className="bg-black">
                <img src={activeImage.url} alt={activeImage.caption || activeCharacter.name} className="max-h-[90vh] w-full object-contain" />
              </div>
              <div className="grid gap-4 p-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">Imagem</p>
                  <DialogTitle className="mt-2 font-display text-2xl font-semibold leading-tight text-white">{activeCharacter.name}</DialogTitle>
                  <DialogDescription className="mt-3 text-sm leading-6 text-soft">
                    {activeImage.caption || 'Sem legenda.'}
                  </DialogDescription>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button variant="secondary" onClick={() => setViewerIndex((current) => (current && current > 0 ? current - 1 : current))} disabled={!viewerIndex}>
                    <ArrowLeft className="size-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setViewerIndex((current) => (current !== null && current < images.length - 1 ? current + 1 : current))}
                    disabled={viewerIndex === null || viewerIndex >= images.length - 1}
                  >
                    Próxima
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
