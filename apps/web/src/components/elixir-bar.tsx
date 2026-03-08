interface ElixirBarProps {
  value: number;
  max?: number;
}

export function ElixirBar({ value, max = 10 }: ElixirBarProps) {
  const safeValue = Math.max(0, Math.min(max, value));
  const percent = (safeValue / max) * 100;

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/50 p-2">
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>Elixir</span>
        <span>
          {safeValue}/{max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-arena-success transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
