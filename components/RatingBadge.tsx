import React from 'react';
import { clsx } from 'clsx';

export function RatingBadge({ label, value, href }: { label: string; value: string | null; href?: string }) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-800/50 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-300">
        <span className={clsx('inline-block h-2.5 w-2.5 rounded-full', value ? 'bg-emerald-400' : 'bg-slate-500')} />
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold">{value || 'N/A'}</div>
      {href && (
        <a className="mt-2 inline-flex items-center gap-1 text-sm text-indigo-300 underline hover:text-indigo-200" href={href} target="_blank" rel="noreferrer">
          Open ↗
        </a>
      )}
    </div>
  );
}
