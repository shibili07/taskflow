import {
  FiBookmark,
  FiCode,
  FiDownload,
  FiFilter,
  FiGrid,
  FiLayout,
  FiList,
  FiPlus,
  FiSliders,
} from 'react-icons/fi';
import { issuesApi } from '../../lib/api';
import type { ViewModeValue } from './constants';

const icon = 'h-3.5 w-3.5 shrink-0';

type FilterDropdownKey =
  | 'status' | 'type' | 'priority' | 'assignee' | 'reporter'
  | 'labels' | 'storyPoints' | 'project';

interface IssuesToolbarProps {
  viewMode: ViewModeValue;
  updateUrl: (updates: { viewMode?: ViewModeValue }) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  useJql: boolean;
  setFiltersOpen: (open: boolean) => void;
  setColumnsOpen: (open: boolean) => void;
  setJqlOpen: (fn: (o: boolean) => boolean) => void;
  setOpenFilterDropdown: (d: FilterDropdownKey | null) => void;
  buildListParams: (params: { page: number }) => Record<string, unknown>;
  openCreate?: () => void;
  projectId: string | undefined;
  token: string | null;
  jql: string;
  canSaveFilter: boolean;
  onSaveFilterClick: () => void;
  showTitle?: boolean;
}

export function IssuesToolbar({
  viewMode,
  updateUrl,
  hasActiveFilters,
  activeFilterCount,
  useJql,
  setFiltersOpen,
  setColumnsOpen,
  setJqlOpen,
  setOpenFilterDropdown,
  buildListParams,
  openCreate,
  projectId,
  token,
  jql,
  canSaveFilter,
  onSaveFilterClick,
  showTitle = true,
}: IssuesToolbarProps) {
  const viewModes: { key: ViewModeValue; label: string; Icon: typeof FiLayout }[] = [
    { key: 'table', label: 'Table', Icon: FiLayout },
    { key: 'list',  label: 'List',  Icon: FiList },
    { key: 'kanban', label: 'Kanban', Icon: FiGrid },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-1.5">
      {showTitle && (
        <h1 className="text-xl font-bold text-[color:var(--text-primary)] shrink-0 mr-2">Issues</h1>
      )}

      {/* View mode segment control */}
      <div
        className="flex items-center p-0.5 rounded-lg bg-[color:var(--bg-elevated)] border border-[color:var(--border-subtle)] gap-0.5"
        role="group"
        aria-label="View mode"
      >
        {viewModes.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => updateUrl({ viewMode: key })}
            title={`${label} view`}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === key
                ? 'bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] shadow-sm'
                : 'text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]'
            }`}
          >
            <Icon className={icon} aria-hidden />
            {label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="h-5 w-px bg-[color:var(--border-subtle)] mx-0.5 hidden sm:block" />

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 flex-1 justify-end flex-wrap">
        {viewMode === 'table' && (
          <button
            type="button"
            onClick={() => { setColumnsOpen(true); setOpenFilterDropdown(null); }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-xs font-medium text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)] transition"
            title="Customize columns"
          >
            <FiSliders className={icon} aria-hidden />
            Columns
          </button>
        )}

        <button
          type="button"
          onClick={() => { setFiltersOpen(true); setOpenFilterDropdown(null); }}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
            hasActiveFilters
              ? 'bg-[color:var(--accent-subtle)] border-[color:var(--accent)]/50 text-[color:var(--accent)]'
              : 'bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)]'
          }`}
        >
          <FiFilter className={icon} aria-hidden />
          Filter
          {activeFilterCount > 0 && (
            <span className="ml-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[color:var(--accent)] text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {activeFilterCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onSaveFilterClick}
          disabled={!canSaveFilter}
          title={canSaveFilter ? 'Save current filters as a named filter' : 'Apply filters first to save'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition ${
            canSaveFilter
              ? 'bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)]'
              : 'bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)] text-[color:var(--text-muted)] opacity-40 cursor-not-allowed'
          }`}
        >
          <FiBookmark className={icon} aria-hidden />
          Save
        </button>

        <button
          type="button"
          onClick={() => setJqlOpen((o) => !o)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition ${
            useJql
              ? 'bg-[color:var(--accent-subtle)] border-[color:var(--accent)]/50 text-[color:var(--accent)]'
              : 'bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)]'
          }`}
          title='JQL: project = X, status = Done, assignee = me, text ~ "search", order by created DESC'
        >
          <FiCode className={icon} aria-hidden />
          JQL
          {useJql && (
            <span className="ml-0.5 px-1.5 py-0.5 rounded text-[9px] bg-[color:var(--accent)] text-white font-bold leading-none">ON</span>
          )}
        </button>

        <button
          type="button"
          onClick={async () => {
            if (!token) return;
            const params: Record<string, string> = {};
            if (projectId) params.project = projectId;
            if (useJql && jql.trim()) {
              params.jql = jql.trim();
            } else {
              const lp = buildListParams({ page: 1 }) as Record<string, string | number | undefined>;
              if (lp.project) params.project = String(lp.project);
              if (lp.status) params.status = String(lp.status);
              if (lp.assignee) params.assignee = String(lp.assignee);
              if (lp.reporter) params.reporter = String(lp.reporter);
              if (lp.type) params.type = String(lp.type);
              if (lp.priority) params.priority = String(lp.priority);
              if (lp.labels) params.labels = String(lp.labels);
              if (lp.storyPoints) params.storyPoints = String(lp.storyPoints);
              if (lp.hasStoryPoints) params.hasStoryPoints = String(lp.hasStoryPoints);
            }
            const res = await issuesApi.downloadExcel(params, token);
            if (!res.success) alert(res.message ?? 'Export failed');
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] text-xs text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:border-[color:var(--border-emphasis)] transition"
        >
          <FiDownload className={icon} aria-hidden />
          Export
        </button>

        {openCreate && (
          <button
            type="button"
            onClick={() => openCreate()}
            className="btn-primary btn-primary-sm shadow-md inline-flex items-center gap-1.5 font-semibold"
          >
            <FiPlus className={icon} aria-hidden />
            New Issue
          </button>
        )}
      </div>
    </div>
  );
}
