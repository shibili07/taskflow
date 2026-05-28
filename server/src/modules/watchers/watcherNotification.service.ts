import {
  renderWatchCommentEmail,
  renderWatchFieldEmail,
  renderWatchStatusEmail,
  type FieldChangeRow,
} from '../../services/email.service';
import { User } from '../auth/user.model';
import { Issue } from '../issues/issue.model';

export type WatcherNotifyMeta = {
  issueId?: string;
  issueKey?: string;
  projectId?: string;
  issueTitle?: string;
  projectName?: string;
  authorUserId?: string;
  commentExcerpt?: string;
  fromStatus?: string;
  toStatus?: string;
  changes?: FieldChangeRow[];
};

async function loadActorName(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select('name').lean();
  return (user as { name?: string } | null)?.name;
}

async function loadIssueContext(
  issueId: string,
  meta: WatcherNotifyMeta
): Promise<{ issueKey: string; issueTitle: string; projectName?: string; projectId: string } | null> {
  const issue = await Issue.findById(issueId)
    .select('key title project')
    .populate('project', 'name key')
    .lean();
  if (!issue) return null;

  const project = issue.project as { _id?: unknown; name?: string; key?: string } | string | undefined;
  const projectId =
    meta.projectId ??
    (project && typeof project === 'object' && project._id != null ? String(project._id) : String(issue.project));
  const issueKey = meta.issueKey ?? String((issue as { key?: string }).key ?? '?');
  const issueTitle = meta.issueTitle ?? String((issue as { title?: string }).title ?? '');
  const projectName =
    meta.projectName ??
    (project && typeof project === 'object' && project.name ? String(project.name) : undefined);

  return { issueKey, issueTitle, projectName, projectId };
}

function parseStatusFromBody(body: string): { from: string; to: string } | null {
  const match = body.match(/^(.+?)\s*→\s*(.+)$/);
  if (!match) return null;
  return { from: match[1].trim(), to: match[2].trim() };
}

export async function buildWatcherEmailHtml(
  type: string,
  body: string,
  issueUrl: string,
  meta: WatcherNotifyMeta,
  actorUserId: string
): Promise<string | undefined> {
  const issueId = meta.issueId;
  if (!issueId) return undefined;

  const ctx = await loadIssueContext(issueId, meta);
  if (!ctx) return undefined;

  const actorName = await loadActorName(actorUserId);

  if (type === 'comment_added') {
    return renderWatchCommentEmail({
      issueKey: ctx.issueKey,
      issueTitle: ctx.issueTitle,
      projectName: ctx.projectName,
      authorName: meta.authorUserId ? await loadActorName(meta.authorUserId) : actorName,
      commentExcerpt: meta.commentExcerpt ?? body,
      issueUrl,
    });
  }

  if (type === 'status_changed') {
    const fromStatus = meta.fromStatus ?? parseStatusFromBody(body)?.from ?? '—';
    const toStatus = meta.toStatus ?? parseStatusFromBody(body)?.to ?? '—';
    return renderWatchStatusEmail({
      issueKey: ctx.issueKey,
      issueTitle: ctx.issueTitle,
      projectName: ctx.projectName,
      fromStatus,
      toStatus,
      actorName,
      issueUrl,
    });
  }

  return renderWatchFieldEmail({
    issueKey: ctx.issueKey,
    issueTitle: ctx.issueTitle,
    projectName: ctx.projectName,
    changes: meta.changes ?? [],
    actorName,
    issueUrl,
    summary: body || undefined,
  });
}
