import { Link } from 'react-router-dom';
import { MetaBadge } from '../MetaBadge';
import { WatchButton } from '../issue';
import { EditIcon } from '../icons/NavigationIcons';
import { FiTrash2 } from 'react-icons/fi';
import type { Issue } from '../../lib/api';

type MetaGetter = (name: string) => { icon?: string; color?: string } | undefined;

interface IssuesListViewProps {
  issues: Issue[];
  projectId: string | undefined;
  getIssueKey: (issue: Issue) => string;
  getTypeMeta: MetaGetter;
  getPriorityMeta: MetaGetter;
  getStatusMeta: MetaGetter;
  watchingStatus: Record<string, boolean>;
  watchingLoadingId: string | null;
  handleToggleWatch: (issueId: string) => void;
  openEdit: (issue: Issue) => void;
  setConfirmDeleteIssue: (issue: Issue | null) => void;
  navigate: (path: string) => void;
}

function getAvatarBg(name: string): string {
  const palette = ['#388bfd', '#3fb950', '#d29922', '#bc8cff', '#f85149', '#e8912d', '#58b9de', '#79c0ff'];
  let hash = 0;
  for (const char of name) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export function IssuesListView({
  issues,
  projectId,
  getIssueKey,
  getTypeMeta,
  getPriorityMeta,
  getStatusMeta,
  watchingStatus,
  watchingLoadingId,
  handleToggleWatch,
  openEdit,
  setConfirmDeleteIssue,
  navigate,
}: IssuesListViewProps) {
  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--bg-surface)] card-shadow overflow-hidden">
      <ul className="divide-y divide-[color:var(--border-subtle)]/60">
        {issues.map((issue) => {
          const pid = projectId ?? (typeof issue.project === 'object' && issue.project ? issue.project._id : '');
          const priorityColor = getPriorityMeta(issue.priority)?.color;
          const assigneeName = typeof issue.assignee === 'object' && issue.assignee ? issue.assignee.name : null;
          const initials = assigneeName
            ? assigneeName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
            : null;

          return (
            <li
              key={issue._id}
              role="button"
              tabIndex={0}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('a, button')) return;
                if (pid) navigate(`/projects/${pid}/issues/${encodeURIComponent(getIssueKey(issue))}`);
              }}
              onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (pid) navigate(`/projects/${pid}/issues/${encodeURIComponent(getIssueKey(issue))}`);
                }
              }}
              style={{ borderLeftColor: priorityColor ?? 'transparent' }}
              className="flex items-center justify-between gap-3 pl-3 pr-4 py-2.5 hover:bg-[color:var(--bg-elevated)] transition group cursor-pointer border-l-[3px]"
            >
              {/* Left: ID + type/priority dot + title */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Priority color dot */}
                {priorityColor && (
                  <span
                    className="shrink-0 w-2 h-2 rounded-full"
                    style={{ backgroundColor: priorityColor }}
                    title={issue.priority}
                  />
                )}

                {/* Ticket ID */}
                <span className="shrink-0 font-mono text-[10px] font-semibold text-[color:var(--text-muted)] bg-[color:var(--bg-page)] border border-[color:var(--border-subtle)] px-1.5 py-0.5 rounded-md min-w-[64px] text-center truncate">
                  {getIssueKey(issue)}
                </span>

                {/* Type badge */}
                <MetaBadge label={issue.type} meta={getTypeMeta(issue.type)} />

                {/* Title */}
                <Link
                  to={pid ? `/projects/${pid}/issues/${encodeURIComponent(getIssueKey(issue))}` : '#'}
                  className={`font-medium text-[color:var(--text-primary)] truncate hover:text-[color:var(--accent)] hover:underline min-w-0 text-sm ${
                    issue.parent ? 'pl-2' : ''
                  }`}
                >
                  {issue.parent && <span className="text-[9px] text-[color:var(--text-muted)] mr-1.5">↳</span>}
                  {issue.title}
                </Link>
              </div>

              {/* Right: status + assignee avatar + actions */}
              <div className="flex items-center gap-2.5 shrink-0">
                <MetaBadge label={issue.status} meta={getStatusMeta(issue.status)} />

                {/* Assignee avatar or dash */}
                {initials ? (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 ring-1 ring-[color:var(--border-subtle)]"
                    style={{ backgroundColor: getAvatarBg(assigneeName!) }}
                    title={assigneeName ?? ''}
                  >
                    {initials}
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[color:var(--bg-elevated)] border border-[color:var(--border-subtle)] flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-[color:var(--text-muted)]">—</span>
                  </div>
                )}

                {/* Action buttons (visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <WatchButton
                    watching={watchingStatus[issue._id] ?? false}
                    loading={watchingLoadingId === issue._id}
                    onWatch={() => handleToggleWatch(issue._id)}
                    onUnwatch={() => handleToggleWatch(issue._id)}
                    size="sm"
                  />
                  <button
                    type="button"
                    onClick={() => openEdit(issue)}
                    title="Edit issue"
                    className="p-1 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--accent)] hover:bg-[color:var(--accent-subtle)] transition"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIssue(issue)}
                    title="Delete issue"
                    className="p-1 rounded-md text-[color:var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
