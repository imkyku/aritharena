import { ButtonHTMLAttributes } from 'react';

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: 'primary' | 'secondary' | 'danger';
};

export function AppButton({ tone = 'primary', className = '', ...props }: AppButtonProps) {
  const toneClass =
    tone === 'primary'
      ? 'bg-arena-accent text-slate-950'
      : tone === 'danger'
        ? 'bg-arena-danger text-white'
        : 'bg-slate-700 text-slate-100';

  return (
    <button
      className={`w-full rounded-xl px-4 py-3 font-display text-sm font-bold uppercase tracking-wide transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${toneClass} ${className}`}
      {...props}
    />
  );
}
