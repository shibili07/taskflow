import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface IssuesPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  updateUrl: (updates: { page: number }) => void;
}

export function IssuesPagination({
  page,
  totalPages,
  total,
  updateUrl,
}: IssuesPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const maxVisible = 7;
  let visiblePages: (number | '...')[];

  if (totalPages <= maxVisible) {
    visiblePages = pages;
  } else {
    const half = Math.floor(maxVisible / 2);
    if (page <= half + 1) {
      visiblePages = [...pages.slice(0, maxVisible - 2), '...', totalPages];
    } else if (page >= totalPages - half) {
      visiblePages = [1, '...', ...pages.slice(totalPages - (maxVisible - 2))];
    } else {
      visiblePages = [1, '...', ...pages.slice(page - half, page + half - 1), '...', totalPages];
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 px-1 py-3">
      {/* Total count */}
      <span className="text-xs text-[color:var(--text-muted)]">
        {total.toLocaleString()} {total === 1 ? 'issue' : 'issues'} · Page {page} of {totalPages}
      </span>

      {/* Page buttons */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => updateUrl({ page: page - 1 })}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)] disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Previous page"
        >
          <FiChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Prev
        </button>

        <div className="flex items-center gap-0.5">
          {visiblePages.map((p, i) =>
            p === '...' ? (
              <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-[color:var(--text-muted)]">…</span>
            ) : (
              <button
                key={p}
                type="button"
                onClick={() => updateUrl({ page: p as number })}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition ${
                  p === page
                    ? 'bg-[color:var(--accent)] text-white shadow-sm'
                    : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-elevated)]'
                }`}
                aria-current={p === page ? 'page' : undefined}
              >
                {p}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => updateUrl({ page: page + 1 })}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)] disabled:opacity-40 disabled:cursor-not-allowed transition"
          aria-label="Next page"
        >
          Next
          <FiChevronRight className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
