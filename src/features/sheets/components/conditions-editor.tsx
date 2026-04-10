import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { SectionTitle } from '@components/shared/section-title';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { EmptyState } from '@components/ui/empty-state';
import { Field, Input, Select, Textarea } from '@components/ui/field';
import { CONDITION_COLORS } from '@lib/domain/constants';
import { conditionFormSchema } from '@schemas/sheets';
import { useWorkspace } from '@features/workspace/use-workspace';

type ConditionValues = import('zod').infer<typeof conditionFormSchema>;

export function ConditionsEditor() {
  const { activeCharacter, addCondition, removeCondition } = useWorkspace();
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
      <SectionTitle eyebrow="Condicoes" title="Estados ativos" description="Marque pressao, ferimentos, buffs ou restricoes com cor e nota curta." />

      <form
        className="mt-5 grid gap-4"
        onSubmit={conditionForm.handleSubmit((values) => {
          addCondition(activeCharacter.id, values);
          conditionForm.reset({ name: '', color: 'purple', note: '' });
          toast.success('Condicao adicionada.');
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
        <Button type="submit" disabled={!conditionForm.formState.isValid}>
          Adicionar condicao
        </Button>
      </form>

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
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{condition.name}</p>
                  <p className="mt-2 text-sm text-soft">{condition.note}</p>
                </div>
                <Button size="sm" variant="danger" onClick={() => removeCondition(activeCharacter.id, condition.id)}>
                  Remover
                </Button>
              </div>
            </div>
          ))
        ) : (
          <EmptyState title="Nenhuma condicao ativa." body="Use o formulario acima para sinalizar estados importantes da cena." />
        )}
      </div>
    </Card>
  );
}
