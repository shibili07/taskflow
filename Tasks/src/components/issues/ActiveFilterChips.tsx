import {
  DEFAULT_FILTERS,
  DUE_DATE_PRESET_OPTIONS,
  SPRINT_BACKLOG,
  hasAnyIssueFilters,
  type FiltersShape,
  type QuickFilterValue,
} from './constants';
import type { User, Sprint, Milestone, ProjectVersion, Project } from '../../lib/api';

export interface ActiveFilterChipsProps {
  filters: FiltersShape;
  quickFilter: QuickFilterValue;
  updateUrl: (updates: { filters?: FiltersShape; quickFilter?: QuickFilterValue; page?: number }) => void;
  users: User[];
  sprints?: Sprint[];
  milestones?: Milestone[];
  versions?: ProjectVersion[];
  projects?: Project[];
  onOpenFilterModal?: () => void;
}

function removeFromArray<T>(arr: T[], value: T): T[] {
  return arr.filter((v) => v !== value);
}

export function ActiveFilterChips({
  filters,
  quickFilter,
  updateUrl,
  users,
  sprints = [],
  milestones = [],
  versions = [],
  projects = [],
  onOpenFilterModal,
}: ActiveFilterChipsProps) {
  const userName = (id: string) => users.find((u) => u._id === id)?.name ?? id;
  const projectName = (id: string) => projects.find((p) => p._id === id)?.name ?? id;
  const sprintName = (id: string) => (id === SPRINT_BACKLOG ? 'Backlog' : sprints.find((s) => s._id === id)?.name ?? id);
  const milestoneName = (id: string) => milestones.find((m) => m._id === id)?.name ?? id;
  const versionName = (id: string) => versions.find((v) => v.id === id)?.name ?? id;
  const dueLabel = (preset: string) => DUE_DATE_PRESET_OPTIONS.find((o) => o.value === preset)?.label ?? preset;

  const hasAnyFilter = hasAnyIssueFilters(filters);

  if (!hasAnyFilter && quickFilter !== 'open') return null;

  const handleRemoveQuick = () => updateUrl({ quickFilter: 'all', page: 1 });

  const handleRemoveFilter = (key: keyof FiltersShape, value?: string) => {
    if (
      key === 'hasStoryPoints' ||
      key === 'hasEstimate' ||
      key === 'hasParent' ||
      key === 'hasDueDate' ||
      key === 'hasStartDate' ||
      key === 'unassigned' ||
      key === 'dueDatePreset'
    ) {
      updateUrl({ filters: { ...filters, [key]: undefined }, page: 1 });
      return;
    }
    const arr = filters[key];
    if (!Array.isArray(arr) || value === undefined) return;
    updateUrl({ filters: { ...filters, [key]: removeFromArray(arr, value) }, page: 1 });
  };

  const handleClearAll = () => {
    updateUrl({ quickFilter: 'all', filters: { ...DEFAULT_FILTERS }, page: 1 });
  };

  const chips: { id: string; label: string; onRemove: () => void }[] = [];

  if (quickFilter === 'my') chips.push({ id: 'quick-my', label: 'My open issues', onRemove: handleRemoveQuick });
  if (quickFilter === 'open') chips.push({ id: 'quick-open', label: 'Open issues', onRemove: handleRemoveQuick });

  filters.project?.forEach((id) =>
    chips.push({ id: `project-${id}`, label: `Project: ${projectName(id)}`, onRemove: () => handleRemoveFilter('project', id) })
  );
  filters.status.forEach((s) =>
    chips.push({ id: `status-${s}`, label: `Status: ${s}`, onRemove: () => handleRemoveFilter('status', s) })
  );
  filters.assignee.forEach((id) =>
    chips.push({ id: `assignee-${id}`, label: `Assignee: ${userName(id)}`, onRemove: () => handleRemoveFilter('assignee', id) })
  );
  if (filters.unassigned) {
    chips.push({ id: 'unassigned', label: 'Unassigned', onRemove: () => handleRemoveFilter('unassigned') });
  }
  filters.reporter.forEach((id) =>
    chips.push({ id: `reporter-${id}`, label: `Reporter: ${userName(id)}`, onRemove: () => handleRemoveFilter('reporter', id) })
  );
  filters.type.forEach((t) =>
    chips.push({ id: `type-${t}`, label: `Type: ${t}`, onRemove: () => handleRemoveFilter('type', t) })
  );
  filters.priority.forEach((p) =>
    chips.push({ id: `priority-${p}`, label: `Priority: ${p}`, onRemove: () => handleRemoveFilter('priority', p) })
  );
  filters.labels.forEach((l) =>
    chips.push({ id: `label-${l}`, label: `Label: ${l}`, onRemove: () => handleRemoveFilter('labels', l) })
  );
  filters.sprint.forEach((id) =>
    chips.push({ id: `sprint-${id}`, label: `Sprint: ${sprintName(id)}`, onRemove: () => handleRemoveFilter('sprint', id) })
  );
  filters.milestone.forEach((id) =>
    chips.push({ id: `milestone-${id}`, label: `Milestone: ${milestoneName(id)}`, onRemove: () => handleRemoveFilter('milestone', id) })
  );
  filters.fixVersion.forEach((id) =>
    chips.push({ id: `fix-${id}`, label: `Fix version: ${versionName(id)}`, onRemove: () => handleRemoveFilter('fixVersion', id) })
  );
  filters.affectsVersions.forEach((id) =>
    chips.push({ id: `affects-${id}`, label: `Affects: ${versionName(id)}`, onRemove: () => handleRemoveFilter('affectsVersions', id) })
  );
  if (filters.hasParent === true) {
    chips.push({ id: 'hasParent-true', label: 'Has parent', onRemove: () => handleRemoveFilter('hasParent') });
  }
  if (filters.hasParent === false) {
    chips.push({ id: 'hasParent-false', label: 'No parent', onRemove: () => handleRemoveFilter('hasParent') });
  }
  if (filters.hasDueDate === false) {
    chips.push({ id: 'hasDueDate-false', label: 'No due date', onRemove: () => handleRemoveFilter('hasDueDate') });
  }
  if (filters.dueDatePreset) {
    chips.push({
      id: `due-${filters.dueDatePreset}`,
      label: `Due: ${dueLabel(filters.dueDatePreset)}`,
      onRemove: () => handleRemoveFilter('dueDatePreset'),
    });
  }
  if (filters.hasStartDate === false) {
    chips.push({ id: 'hasStartDate-false', label: 'No start date', onRemove: () => handleRemoveFilter('hasStartDate') });
  }
  if (filters.hasStartDate === true) {
    chips.push({ id: 'hasStartDate-true', label: 'Has start date', onRemove: () => handleRemoveFilter('hasStartDate') });
  }
  filters.storyPoints.forEach((sp) =>
    chips.push({ id: `sp-${sp}`, label: `Story points: ${sp}`, onRemove: () => handleRemoveFilter('storyPoints', sp) })
  );
  if (filters.hasStoryPoints === false) {
    chips.push({
      id: 'hasStoryPoints-false',
      label: 'No story points',
      onRemove: () => handleRemoveFilter('hasStoryPoints'),
    });
  }
  if (filters.hasEstimate === false) {
    chips.push({ id: 'hasEstimate-false', label: 'No estimate', onRemove: () => handleRemoveFilter('hasEstimate') });
  }
  if (filters.hasEstimate === true) {
    chips.push({ id: 'hasEstimate-true', label: 'Has estimate', onRemove: () => handleRemoveFilter('hasEstimate') });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 py-2 border-b border-[color:var(--border-subtle)]">
      <span className="text-[11px] font-semibold text-[color:var(--text-muted)] uppercase tracking-wider shrink-0">
        Active filters
      </span>
      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-[color:var(--accent-subtle)] text-[color:var(--accent)] text-xs border border-[color:var(--accent)]/30"
        >
          {onOpenFilterModal ? (
            <button type="button" onClick={onOpenFilterModal} className="hover:text-[color:var(--accent)] text-left">
              {chip.label}
            </button>
          ) : (
            <span>{chip.label}</span>
          )}
          <button
            type="button"
            onClick={chip.onRemove}
            className="text-[color:var(--text-muted)] hover:text-red-500 leading-none p-0.5 rounded"
            aria-label={`Remove ${chip.label}`}
          >
            ×
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-[color:var(--accent)] font-medium hover:text-[color:var(--accent-muted)] hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
