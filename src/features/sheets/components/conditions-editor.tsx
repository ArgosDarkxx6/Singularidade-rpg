import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui/dialog';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { CONDITION_COLORS } from '@lib/domain/constants';
import { conditionFormSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';

type ConditionValues = import('zod').infer<typeof conditionFormSchema>;

export function ConditionsEditor({ editable = true }: { editable?: boolean }) {
  const { activeCharacter, addCondition, removeCondition, flushPersistence } = useWorkspace();
  const [open, setOpen] = useState(false);
  const conditionForm = useForm<ConditionValues>({
    resolver: zodResolver(conditionFormSchema) as never,
    mode: 'onChange',
    defaultValues: {
      name: '',
      color: 'purple',
      note: ''
    }
  });

  return (
    <Card className="p-6">
      <SectionTitle
        eyebrow="Condições"
        title="Estados ativos"
        description="Pressão, ferimentos, buffs e restrições ficam legíveis na ficha; a edição abre só quando acionada."
        actions={
          editable ? (
            <Button variant="secondary" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Adicionar condição
            </Button>
          ) : undefined
        }
      />

      <div className="mt-5 grid gap-3">
        {activeCharacter.conditions.length ? (
          activeCharacter.conditions.map((condition) => (
            <div
              key={condition.id}
              className="rounded-[24px] border px-4 py-4"
              style={{
                background: CONDITION_COLORS[condition.color].bg,
                borderColor: CONDITION_COLORS[condition.color].border
              }}
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{condition.name}</p>
                  <p className="mt-2 text-sm text-soft">{condition.note || 'Sem nota adicional.'}</p>
                </div>
                {editable ? (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={async () => {
                      removeCondition(activeCharacter.id, condition.id);
                      await flushPersistence();
                    }}
                  >
                    Remover
                  </Button>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="Nenhuma condição ativa." body="Use o botão de ação para sinalizar estados importantes da cena." />
        )}
      </div>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            conditionForm.reset({ name: '', color: 'purple', note: '' });
          }
        }}
      >
        <DialogContent>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-accent">Condição</p>
          <DialogTitle className="mt-2 font-display text-4xl leading-none text-white">Adicionar estado</DialogTitle>
          <DialogDescription className="mt-3 text-sm leading-6 text-soft">
            Registre pressão, ferimento, buff ou restrição sem deixar um editor fixo vazando na ficha.
          </DialogDescription>

          <form
            className="mt-6 grid gap-4"
            onSubmit={conditionForm.handleSubmit(async (values) => {
              addCondition(activeCharacter.id, values);
              await flushPersistence();
              conditionForm.reset({ name: '', color: 'purple', note: '' });
              setOpen(false);
              toast.success('Condição adicionada.');
            })}
          >
            <Field label="Nome">
              <Input {...conditionForm.register('name')} />
            </Field>
            <Field label="Cor">
              <Select {...conditionForm.register('color')}>
                {Object.entries(CONDITION_COLORS).map(([key, value]) => (
                  <option key={key} value={key}>
                    {value.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nota">
              <Textarea {...conditionForm.register('note')} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!conditionForm.formState.isValid}>
                Salvar condição
              </Button>
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
