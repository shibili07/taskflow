import type { Issue } from '../../lib/api';

export const DEFAULT_TYPES = ['Task', 'Bug', 'Story', 'Epic'];
export const DEFAULT_PRIORITIES = ['Lowest', 'Low', 'Medium', 'High', 'Highest'];
export const DEFAULT_STATUSES = ['Backlog', 'Todo', 'In Progress', 'Done'];
export const STORY_POINT_OPTIONS = ['1', '2', '3', '5', '8', '13', '21'];

export const PARAM_QUICK = 'quick';
export const PARAM_VIEW = 'view';
export const PARAM_PAGE = 'page';
export const PARAM_PROJECT = 'project';
export const PARAM_STATUS = 'status';
export const PARAM_TYPE = 'type';
export const PARAM_PRIORITY = 'priority';
export const PARAM_ASSIGNEE = 'assignee';
export const PARAM_REPORTER = 'reporter';
export const PARAM_LABELS = 'labels';
export const PARAM_STORY_POINTS = 'storyPoints';
export const PARAM_HAS_STORY_POINTS = 'hasStoryPoints';
export const PARAM_HAS_ESTIMATE = 'hasEstimate';
export const PARAM_SPRINT = 'sprint';
export const PARAM_MILESTONE = 'milestone';
export const PARAM_FIX_VERSION = 'fixVersion';
export const PARAM_AFFECTS_VERSIONS = 'affectsVersions';
export const PARAM_HAS_PARENT = 'hasParent';
export const PARAM_HAS_DUE_DATE = 'hasDueDate';
export const PARAM_DUE_DATE_PRESET = 'dueDate';
export const PARAM_HAS_START_DATE = 'hasStartDate';
export const PARAM_UNASSIGNED = 'unassigned';
export const UNASSIGNED_ASSIGNEE = '__unassigned__';
export const SPRINT_BACKLOG = '__backlog__';
export type DueDatePresetValue = 'overdue' | 'today' | 'this_week';
export const DUE_DATE_PRESET_OPTIONS: { value: DueDatePresetValue; label: string }[] = [
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Due today' },
  { value: 'this_week', label: 'Due this week' },
];
export const PARAM_CREATE = 'create';
export const PARAM_PARENT = 'parent';
export const PARAM_JQL = 'jql';

export type QuickFilterValue = 'all' | 'my' | 'open';
export type ViewModeValue = 'list' | 'table' | 'kanban';

export const ISSUE_TABLE_COLUMNS: { id: string; label: string; defaultVisible: boolean }[] = [
  { id: 'project', label: 'Project', defaultVisible: false },
  { id: 'type', label: 'Type', defaultVisible: true },
  { id: 'ticketId', label: 'Ticket ID', defaultVisible: true },
  { id: 'summary', label: 'Title', defaultVisible: true },
  { id: 'assignee', label: 'Assignee', defaultVisible: true },
  { id: 'reporter', label: 'Reporter', defaultVisible: false },
  { id: 'priority', label: 'Priority', defaultVisible: true },
  { id: 'status', label: 'Status', defaultVisible: true },
  { id: 'dueDate', label: 'Due date', defaultVisible: false },
  { id: 'startDate', label: 'Start date', defaultVisible: false },
  { id: 'storyPoints', label: 'Story points', defaultVisible: false },
  { id: 'created', label: 'Created', defaultVisible: true },
  { id: 'updated', label: 'Updated', defaultVisible: false },
  { id: 'description', label: 'Description', defaultVisible: false },
  { id: 'labels', label: 'Labels', defaultVisible: false },
  { id: 'fixVersion', label: 'Fix version', defaultVisible: true },
  { id: 'affectsVersions', label: 'Affects versions', defaultVisible: true },
  { id: 'actions', label: 'Actions', defaultVisible: true },
];

export const ISSUE_TABLE_CHECKBOX_WIDTH = 40;
export const ISSUE_TABLE_MIN_COLUMN_WIDTH = 56;
export const ISSUE_TABLE_MAX_COLUMN_WIDTH = 640;

/** Default pixel widths for resizable issue table columns. */
export const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {
  project: 120,
  type: 100,
  ticketId: 100,
  summary: 360,
  assignee: 160,
  reporter: 140,
  priority: 100,
  status: 120,
  dueDate: 100,
  startDate: 100,
  storyPoints: 100,
  created: 110,
  updated: 110,
  description: 220,
  labels: 160,
  fixVersion: 110,
  affectsVersions: 150,
  actions: 100,
};

export type IssuesColumnsConfig = {
  order: string[];
  visible: Record<string, boolean>;
  widths: Record<string, number>;
};

export const DEFAULT_COLUMN_ORDER = ISSUE_TABLE_COLUMNS.map((c) => c.id);
export const DEFAULT_VISIBLE: Record<string, boolean> = Object.fromEntries(
  ISSUE_TABLE_COLUMNS.map((c) => [c.id, c.defaultVisible])
);

export function isDueTodayOrPast(dateString: string | undefined | null): boolean {
  if (!dateString) return false;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  const normalize = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  return normalize(d) <= normalize(today);
}

export function parseIssuesColumnsConfig(
  parsed: { order?: string[]; visible?: Record<string, boolean>; widths?: Record<string, number> } | null | undefined,
  defaultVisible: Record<string, boolean> = DEFAULT_VISIBLE
): IssuesColumnsConfig {
  const order = parsed?.order?.length ? [...parsed.order] : [...DEFAULT_COLUMN_ORDER];
  const visible: Record<string, boolean> = { ...defaultVisible };
  ISSUE_TABLE_COLUMNS.forEach((c) => {
    if (parsed?.visible && c.id in parsed.visible) visible[c.id] = Boolean(parsed.visible[c.id]);
  });
  const widths: Record<string, number> = { ...DEFAULT_COLUMN_WIDTHS };
  if (parsed?.widths) {
    for (const col of ISSUE_TABLE_COLUMNS) {
      const w = parsed.widths[col.id];
      if (typeof w === 'number' && Number.isFinite(w)) {
        widths[col.id] = Math.min(
          ISSUE_TABLE_MAX_COLUMN_WIDTH,
          Math.max(ISSUE_TABLE_MIN_COLUMN_WIDTH, Math.round(w))
        );
      }
    }
  }
  return { order, visible, widths };
}

export function getDefaultColumnsConfig(): IssuesColumnsConfig {
  return parseIssuesColumnsConfig(null);
}

export function getColumnWidthPx(colId: string, widths: Record<string, number>): number {
  const w = widths[colId];
  if (typeof w === 'number' && Number.isFinite(w)) return w;
  return DEFAULT_COLUMN_WIDTHS[colId] ?? 120;
}

export type FiltersShape = {
  project: string[];
  status: string[];
  assignee: string[];
  reporter: string[];
  type: string[];
  priority: string[];
  labels: string[];
  storyPoints: string[];
  sprint: string[];
  milestone: string[];
  fixVersion: string[];
  affectsVersions: string[];
  hasStoryPoints?: boolean;
  hasEstimate?: boolean;
  hasParent?: boolean;
  hasDueDate?: boolean;
  dueDatePreset?: DueDatePresetValue;
  hasStartDate?: boolean;
  unassigned?: boolean;
};

export const DEFAULT_FILTERS: FiltersShape = {
  project: [],
  status: [],
  assignee: [],
  reporter: [],
  type: [],
  priority: [],
  labels: [],
  storyPoints: [],
  sprint: [],
  milestone: [],
  fixVersion: [],
  affectsVersions: [],
  hasStoryPoints: undefined,
  hasEstimate: undefined,
  hasParent: undefined,
  hasDueDate: undefined,
  dueDatePreset: undefined,
  hasStartDate: undefined,
  unassigned: undefined,
};

function parseBoolParam(v: string | null): boolean | undefined {
  if (v === 'true') return true;
  if (v === 'false') return false;
  return undefined;
}

function parseDueDatePreset(v: string | null): DueDatePresetValue | undefined {
  if (v === 'overdue' || v === 'today' || v === 'this_week') return v;
  return undefined;
}

export function parseFiltersFromSearchParams(searchParams: URLSearchParams): {
  filters: FiltersShape;
  quickFilter: QuickFilterValue;
  viewMode: ViewModeValue;
  page: number;
  jql: string;
} {
  const getList = (key: string) => {
    const v = searchParams.get(key);
    return v ? v.split(',').map((s) => decodeURIComponent(s.trim())).filter(Boolean) : [];
  };
  const quick = searchParams.get(PARAM_QUICK);
  const quickFilter: QuickFilterValue =
    quick === 'my' || quick === 'open' || quick === 'all' ? quick : 'my';
  const view = searchParams.get(PARAM_VIEW);
  const viewMode: ViewModeValue =
    view === 'list' || view === 'kanban' ? view : 'table';
  const pageStr = searchParams.get(PARAM_PAGE);
  const page = Math.max(1, parseInt(pageStr ?? '1', 10) || 1);
  const hasSP = searchParams.get(PARAM_HAS_STORY_POINTS);
  const hasEst = searchParams.get(PARAM_HAS_ESTIMATE);
  const jql = searchParams.get(PARAM_JQL) ?? '';
  return {
    filters: {
      ...DEFAULT_FILTERS,
      project: getList(PARAM_PROJECT),
      status: getList(PARAM_STATUS),
      type: getList(PARAM_TYPE),
      priority: getList(PARAM_PRIORITY),
      assignee: getList(PARAM_ASSIGNEE),
      reporter: getList(PARAM_REPORTER),
      labels: getList(PARAM_LABELS),
      storyPoints: getList(PARAM_STORY_POINTS),
      sprint: getList(PARAM_SPRINT),
      milestone: getList(PARAM_MILESTONE),
      fixVersion: getList(PARAM_FIX_VERSION),
      affectsVersions: getList(PARAM_AFFECTS_VERSIONS),
      hasStoryPoints: parseBoolParam(hasSP),
      hasEstimate: parseBoolParam(hasEst),
      hasParent: parseBoolParam(searchParams.get(PARAM_HAS_PARENT)),
      hasDueDate: parseBoolParam(searchParams.get(PARAM_HAS_DUE_DATE)),
      dueDatePreset: parseDueDatePreset(searchParams.get(PARAM_DUE_DATE_PRESET)),
      hasStartDate: parseBoolParam(searchParams.get(PARAM_HAS_START_DATE)),
      unassigned: searchParams.get(PARAM_UNASSIGNED) === 'true' ? true : undefined,
    },
    quickFilter,
    viewMode,
    page,
    jql,
  };
}

export function buildSearchParams(opts: {
  filters: FiltersShape;
  quickFilter: QuickFilterValue;
  viewMode: ViewModeValue;
  page: number;
  jql?: string;
}): URLSearchParams {
  const p = new URLSearchParams();
  if (opts.quickFilter === 'all') p.set(PARAM_QUICK, 'all');
  else if (opts.quickFilter === 'open') p.set(PARAM_QUICK, 'open');
  // 'my' is the default: omit PARAM_QUICK for cleaner URLs
  if (opts.viewMode !== 'table') p.set(PARAM_VIEW, opts.viewMode);
  if (opts.page > 1) p.set(PARAM_PAGE, String(opts.page));
  if (opts.jql && opts.jql.trim()) p.set(PARAM_JQL, opts.jql.trim());
  if (opts.filters.project?.length) p.set(PARAM_PROJECT, opts.filters.project.map((s) => encodeURIComponent(s)).join(','));
  if (opts.filters.status.length) p.set(PARAM_STATUS, opts.filters.status.map((s) => encodeURIComponent(s)).join(','));
  if (opts.filters.type.length) p.set(PARAM_TYPE, opts.filters.type.join(','));
  if (opts.filters.priority.length) p.set(PARAM_PRIORITY, opts.filters.priority.join(','));
  if (opts.filters.assignee.length) p.set(PARAM_ASSIGNEE, opts.filters.assignee.join(','));
  if (opts.filters.reporter.length) p.set(PARAM_REPORTER, opts.filters.reporter.join(','));
  if (opts.filters.labels.length) p.set(PARAM_LABELS, opts.filters.labels.map((l) => encodeURIComponent(l)).join(','));
  if (opts.filters.storyPoints.length) p.set(PARAM_STORY_POINTS, opts.filters.storyPoints.join(','));
  if (opts.filters.hasStoryPoints === false) p.set(PARAM_HAS_STORY_POINTS, 'false');
  if (opts.filters.hasStoryPoints === true) p.set(PARAM_HAS_STORY_POINTS, 'true');
  if (opts.filters.hasEstimate === false) p.set(PARAM_HAS_ESTIMATE, 'false');
  if (opts.filters.hasEstimate === true) p.set(PARAM_HAS_ESTIMATE, 'true');
  if (opts.filters.sprint.length) p.set(PARAM_SPRINT, opts.filters.sprint.join(','));
  if (opts.filters.milestone.length) p.set(PARAM_MILESTONE, opts.filters.milestone.join(','));
  if (opts.filters.fixVersion.length) p.set(PARAM_FIX_VERSION, opts.filters.fixVersion.join(','));
  if (opts.filters.affectsVersions.length) p.set(PARAM_AFFECTS_VERSIONS, opts.filters.affectsVersions.join(','));
  if (opts.filters.hasParent === true) p.set(PARAM_HAS_PARENT, 'true');
  if (opts.filters.hasParent === false) p.set(PARAM_HAS_PARENT, 'false');
  if (opts.filters.hasDueDate === false) p.set(PARAM_HAS_DUE_DATE, 'false');
  if (opts.filters.hasDueDate === true) p.set(PARAM_HAS_DUE_DATE, 'true');
  if (opts.filters.dueDatePreset) p.set(PARAM_DUE_DATE_PRESET, opts.filters.dueDatePreset);
  if (opts.filters.hasStartDate === false) p.set(PARAM_HAS_START_DATE, 'false');
  if (opts.filters.hasStartDate === true) p.set(PARAM_HAS_START_DATE, 'true');
  if (opts.filters.unassigned) p.set(PARAM_UNASSIGNED, 'true');
  return p;
}

/** Append active issue list filters to API query params. */
export function applyFiltersToListParams(
  params: Record<string, string | number>,
  filters: FiltersShape
): void {
  if (filters.status.length) params.status = filters.status.join(',');
  if (filters.assignee.length) params.assignee = filters.assignee.join(',');
  if (filters.reporter.length) params.reporter = filters.reporter.join(',');
  if (filters.type.length) params.type = filters.type.join(',');
  if (filters.priority.length) params.priority = filters.priority.join(',');
  if (filters.labels.length) params.labels = filters.labels.join(',');
  if (filters.storyPoints.length) params.storyPoints = filters.storyPoints.join(',');
  if (filters.sprint.length) params.sprint = filters.sprint.join(',');
  if (filters.milestone.length) params.milestone = filters.milestone.join(',');
  if (filters.fixVersion.length) params.fixVersion = filters.fixVersion.join(',');
  if (filters.affectsVersions.length) params.affectsVersions = filters.affectsVersions.join(',');
  if (filters.hasStoryPoints === false) params.hasStoryPoints = 'false';
  if (filters.hasStoryPoints === true) params.hasStoryPoints = 'true';
  if (filters.hasEstimate === false) params.hasEstimate = 'false';
  if (filters.hasEstimate === true) params.hasEstimate = 'true';
  if (filters.hasParent === true) params.hasParent = 'true';
  if (filters.hasParent === false) params.hasParent = 'false';
  if (filters.hasDueDate === false) params.hasDueDate = 'false';
  if (filters.hasDueDate === true) params.hasDueDate = 'true';
  if (filters.dueDatePreset) params.dueDate = filters.dueDatePreset;
  if (filters.hasStartDate === false) params.hasStartDate = 'false';
  if (filters.hasStartDate === true) params.hasStartDate = 'true';
  if (filters.unassigned) params.unassigned = 'true';
}

export function countActiveFilters(filters: FiltersShape): number {
  return (
    (filters.project?.length ?? 0) +
    filters.status.length +
    filters.assignee.length +
    filters.reporter.length +
    filters.type.length +
    filters.priority.length +
    filters.labels.length +
    filters.storyPoints.length +
    filters.sprint.length +
    filters.milestone.length +
    filters.fixVersion.length +
    filters.affectsVersions.length +
    (filters.hasStoryPoints === false ? 1 : 0) +
    (filters.hasEstimate === false ? 1 : 0) +
    (filters.hasEstimate === true ? 1 : 0) +
    (filters.hasParent !== undefined ? 1 : 0) +
    (filters.hasDueDate !== undefined ? 1 : 0) +
    (filters.dueDatePreset ? 1 : 0) +
    (filters.hasStartDate !== undefined ? 1 : 0) +
    (filters.unassigned ? 1 : 0)
  );
}

export function hasAnyIssueFilters(filters: FiltersShape): boolean {
  return countActiveFilters(filters) > 0;
}

/** Resolve parent id from API issue (populated object or raw id). */
export function resolveIssueParentId(
  parent: { _id: string } | string | null | undefined
): string {
  if (!parent) return '';
  if (typeof parent === 'string') return parent;
  return parent._id ?? '';
}

/** Parent options for subtasks: prefer Epic/Story, exclude the issue being edited. */
export function filterParentCandidates(
  candidates: Issue[],
  editingId?: string,
  keepParentId?: string
): Issue[] {
  const pool = candidates.filter((i) => i._id !== editingId);
  const epicsAndStories = pool.filter((i) => i.type === 'Epic' || i.type === 'Story');
  let preferred = epicsAndStories.length > 0 ? epicsAndStories : pool;
  if (keepParentId && !preferred.some((i) => i._id === keepParentId)) {
    const current = pool.find((i) => i._id === keepParentId);
    if (current) preferred = [current, ...preferred];
  }
  return preferred;
}
