import { env } from '../../config/env';
import {
  renderIssueAssignedEmail,
  renderIssueStatusChangedEmail,
  renderIssueUnassignedEmail,
} from '../../services/email.service';
import { notifyUser } from '../notifications/notificationDispatch.service';
import { User } from '../auth/user.model';
import { Project } from '../projects/project.model';

export type IssueNotifySnapshot = {
  _id: string;
  key: string;
  title: string;
  type?: string;
  status: string;
  project: string | { _id?: unknown; name?: string; key?: string };
  assignee?: string | { _id?: unknown; name?: string } | null;
};

const TASK_EMAIL_EVENT_KEYS = ['task_assigned', 'task_unassigned', 'task_status_changed'] as const;

function resolveProjectId(issue: IssueNotifySnapshot): string {
  const p = issue.project;
  if (p && typeof p === 'object' && '_id' in p && p._id != null) return String(p._id);
  return String(p);
}

function projectNameFromIssue(issue: IssueNotifySnapshot): string | undefined {
  const p = issue.project;
  if (p && typeof p === 'object' && 'name' in p && typeof p.name === 'string') return p.name;
  return undefined;
}

export function buildIssueUrl(projectId: string, issueKey: string): string {
  const base = env.appUrl.replace(/\/$/, '');
  return `${base}/projects/${projectId}/issues/${encodeURIComponent(issueKey)}`;
}

async function loadUserName(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select('name').lean();
  return (user as { name?: string } | null)?.name;
}

async function resolveAssigneeName(
  assigneeUserId: string,
  issueAssignee?: IssueNotifySnapshot['assignee']
): Promise<string | undefined> {
  if (issueAssignee && typeof issueAssignee === 'object' && 'name' in issueAssignee && issueAssignee.name) {
    return String(issueAssignee.name);
  }
  return loadUserName(assigneeUserId);
}

async function resolveProjectName(issue: IssueNotifySnapshot, projectId: string): Promise<string | undefined> {
  const fromIssue = projectNameFromIssue(issue);
  if (fromIssue) return fromIssue;
  const project = await Project.findById(projectId).select('name').lean();
  return (project as { name?: string } | null)?.name;
}

export async function notifyIssueAssigned(params: {
  issue: IssueNotifySnapshot;
  assigneeUserId: string;
  actorUserId: string;
}): Promise<void> {
  const { issue, assigneeUserId, actorUserId } = params;
  if (!assigneeUserId || assigneeUserId === actorUserId) return;

  const projectId = resolveProjectId(issue);
  const issueUrl = buildIssueUrl(projectId, issue.key);
  const [assigneeName, projectName, changedByName] = await Promise.all([
    resolveAssigneeName(assigneeUserId, issue.assignee),
    resolveProjectName(issue, projectId),
    loadUserName(actorUserId),
  ]);

  const title = 'Issue assigned to you';
  const body = `${issue.key}: ${issue.title}`;
  const html = renderIssueAssignedEmail({
    issueKey: issue.key,
    title: issue.title,
    type: issue.type ?? 'Task',
    status: issue.status,
    assigneeName,
    projectName,
    issueUrl,
    changedByName,
  });

  await notifyUser({
    userId: assigneeUserId,
    eventKey: 'task_assigned',
    title,
    body,
    link: issueUrl,
    html,
    metadata: {
      type: 'issue_assigned',
      issueId: issue._id,
      issueKey: issue.key,
      projectId,
    },
  });
}

export async function notifyIssueUnassigned(params: {
  issue: IssueNotifySnapshot;
  previousAssigneeUserId: string;
  actorUserId: string;
}): Promise<void> {
  const { issue, previousAssigneeUserId, actorUserId } = params;
  if (!previousAssigneeUserId || previousAssigneeUserId === actorUserId) return;

  const projectId = resolveProjectId(issue);
  const issueUrl = buildIssueUrl(projectId, issue.key);
  const [projectName, changedByName] = await Promise.all([
    resolveProjectName(issue, projectId),
    loadUserName(actorUserId),
  ]);

  const title = 'Issue unassigned from you';
  const body = `${issue.key}: ${issue.title}`;
  const html = renderIssueUnassignedEmail({
    issueKey: issue.key,
    title: issue.title,
    type: issue.type ?? 'Task',
    status: issue.status,
    projectName,
    issueUrl,
    changedByName,
  });

  await notifyUser({
    userId: previousAssigneeUserId,
    eventKey: 'task_unassigned',
    title,
    body,
    link: issueUrl,
    html,
    metadata: {
      type: 'issue_unassigned',
      issueId: issue._id,
      issueKey: issue.key,
      projectId,
    },
  });
}

export async function notifyIssueStatusChanged(params: {
  issue: IssueNotifySnapshot;
  fromStatus: string;
  toStatus: string;
  assigneeUserId: string | null | undefined;
  actorUserId: string;
}): Promise<void> {
  const { issue, fromStatus, toStatus, assigneeUserId, actorUserId } = params;
  if (!assigneeUserId || assigneeUserId === actorUserId) return;
  if (fromStatus === toStatus) return;

  const projectId = resolveProjectId(issue);
  const issueUrl = buildIssueUrl(projectId, issue.key);
  const [assigneeName, changedByName] = await Promise.all([
    resolveAssigneeName(assigneeUserId, issue.assignee),
    loadUserName(actorUserId),
  ]);

  const title = 'Issue status changed';
  const body = `${issue.key}: ${fromStatus} → ${toStatus}`;
  const html = renderIssueStatusChangedEmail({
    issueKey: issue.key,
    title: issue.title,
    type: issue.type ?? 'Task',
    fromStatus,
    toStatus,
    assigneeName,
    issueUrl,
    changedByName,
  });

  await notifyUser({
    userId: assigneeUserId,
    eventKey: 'task_status_changed',
    title,
    body,
    link: issueUrl,
    html,
    metadata: {
      type: 'issue_status_changed',
      issueId: issue._id,
      issueKey: issue.key,
      projectId,
      fromStatus,
      toStatus,
    },
  });
}
