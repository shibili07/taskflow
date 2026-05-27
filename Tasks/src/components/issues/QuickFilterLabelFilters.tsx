import { FiTag } from 'react-icons/fi';
import type { QuickFilterValue } from './constants';

export type LabelFacetCount = { label: string; count: number };

const EMPTY_MESSAGES: Record<QuickFilterValue, string> = {
  my: 'No labels on your open issues yet.',
  open: 'No labels on open issues yet.',
  all: 'No labels on issues yet.',
};

interface QuickFilterLabelFiltersProps {
  quickFilter: QuickFilterValue;
  labelCounts: LabelFacetCount[];
  selectedLabels: string[];
  onToggleLabel: (label: string) => void;
  onClearLabels?: () => void;
  loading?: boolean;
}

export function QuickFilterLabelFilters({
  quickFilter,
  labelCounts,
  selectedLabels,
  onToggleLabel,
  onClearLabels,
  loading,
}: QuickFilterLabelFiltersProps) {
  if (loading) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[color:var(--border-subtle)]">
        <span className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider shrink-0">
          Labels
        </span>
        <span className="text-xs text-[color:var(--text-muted)]">Loading labels…</span>
      </div>
    );
  }

  if (labelCounts.length === 0) {
    return (
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[color:var(--border-subtle)]">
        <span className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider shrink-0">
          Labels
        </span>
        <span className="text-xs text-[color:var(--text-muted)]">{EMPTY_MESSAGES[quickFilter]}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[color:var(--border-subtle)]">
      <span className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider shrink-0">
        Labels
      </span>
      <div className="flex flex-wrap gap-1.5">
        {labelCounts.map(({ label, count }) => {
          const active = selectedLabels.includes(label);
          return (
            <button
              key={label}
              type="button"
              onClick={() => onToggleLabel(label)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                active
                  ? 'bg-[color:var(--accent)] text-white border-[color:var(--accent)]'
                  : 'bg-[color:var(--bg-page)] text-[color:var(--text-primary)] border-[color:var(--border-subtle)] hover:bg-[color:var(--bg-elevated)]'
              }`}
            >
              <FiTag className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
              {label}
              <span className={active ? 'opacity-80' : 'text-[color:var(--text-muted)]'}>({count})</span>
            </button>
          );
        })}
      </div>
      {selectedLabels.length > 0 && onClearLabels && (
        <button
          type="button"
          onClick={onClearLabels}
          className="text-xs text-[color:var(--accent)] hover:underline ml-1"
        >
          Clear labels
        </button>
      )}
    </div>
  );
}
