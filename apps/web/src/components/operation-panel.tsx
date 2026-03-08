import { useMemo, useState } from 'react';
import { applyOperation, getOperationCost, parseOperation, recomputeElixir } from '@arena/shared';
import { AppButton } from './app-button';

interface OperationPanelProps {
  currentValue: string;
  storedElixir: number;
  lastElixirUpdateAt: number;
  disabled?: boolean;
  onSubmit: (type: 'add' | 'sub' | 'mul' | 'div', operand: string) => void;
}

const quickOperands = ['2', '3', '10', '100', '1000', '10000'];

export function OperationPanel({
  currentValue,
  storedElixir,
  lastElixirUpdateAt,
  disabled,
  onSubmit,
}: OperationPanelProps) {
  const [operand, setOperand] = useState('2');
  const [error, setError] = useState<string | null>(null);

  const previewElixir = useMemo(() => {
    const computed = recomputeElixir(storedElixir, lastElixirUpdateAt, Date.now());
    return computed.actualElixir;
  }, [storedElixir, lastElixirUpdateAt]);

  const trySubmit = (type: 'add' | 'sub' | 'mul' | 'div') => {
    setError(null);

    try {
      const op = parseOperation(type, operand, 1);
      const cost = getOperationCost(type, op.operand);
      if (cost > previewElixir) {
        setError('Недостаточно эликсира / Not enough elixir');
        return;
      }
      applyOperation(BigInt(currentValue), op);
      onSubmit(type, operand);
    } catch (submitError) {
      setError((submitError as Error).message);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl border border-white/10 bg-arena-panel/70 p-3">
      <div className="flex flex-wrap gap-2">
        {quickOperands.map((chip) => (
          <button
            type="button"
            key={chip}
            onClick={() => setOperand(chip)}
            className="rounded-lg border border-white/15 px-3 py-1 text-xs font-semibold text-slate-200 hover:bg-white/10"
          >
            {chip}
          </button>
        ))}
      </div>

      <input
        value={operand}
        onChange={(event) => setOperand(event.target.value.replace(/\D/g, ''))}
        className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-lg outline-none"
        placeholder="Operand"
        inputMode="numeric"
      />

      <div className="grid grid-cols-2 gap-2">
        <AppButton disabled={disabled} onClick={() => trySubmit('add')}>
          +N
        </AppButton>
        <AppButton disabled={disabled} onClick={() => trySubmit('sub')}>
          -N
        </AppButton>
        <AppButton disabled={disabled} onClick={() => trySubmit('mul')}>
          *N
        </AppButton>
        <AppButton disabled={disabled} onClick={() => trySubmit('div')}>
          /N
        </AppButton>
      </div>

      {error ? <p className="text-xs text-arena-danger">{error}</p> : null}
    </section>
  );
}
