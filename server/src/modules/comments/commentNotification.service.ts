import { renderTaskMentionedEmail } from '../../services/email.service';
import { buildIssueUrl } from '../issues/issueNotification.service';
import { User } from '../auth/user.model';
import { notifyUser } from '../notifications/notificationDispatch.service';

export type MentionIssueContext = {
  issueId: string;
  issueKey: string;
  issueTitle: string;
  projectId: string;
  projectName?: string;
};

async function loadUserName(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId).select('name').lean();
  return (user as { name?: string } | null)?.name;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '').trim();
}

export async function notifyMentionedInComment(params: {
  issue: MentionIssueContext;
  commentBody: string;
  authorUserId: string;
  mentionedUserIds: string[];
  commentId?: string;
}): Promise<void> {
  const { issue, commentBody, authorUserId, mentionedUserIds, commentId } = params;
  if (mentionedUserIds.length === 0) return;

  const issueUrl = buildIssueUrl(issue.projectId, issue.issueKey);
  const [authorName] = await Promise.all([loadUserName(authorUserId)]);
  const excerpt = stripHtml(commentBody).slice(0, 300) || 'New comment';

  for (const userId of mentionedUserIds) {
    const html = renderTaskMentionedEmail({
      issueKey: issue.issueKey,
      issueTitle: issue.issueTitle,
      projectName: issue.projectName,
      authorName,
      commentExcerpt: excerpt,
      issueUrl,
    });

    await notifyUser({
      userId,
      eventKey: 'task_mentioned',
      title: `You were mentioned in ${issue.issueKey}`,
      body: excerpt.slice(0, 100),
      link: issueUrl,
      html,
      metadata: {
        type: 'mentioned',
        issueId: issue.issueId,
        issueKey: issue.issueKey,
        projectId: issue.projectId,
        commentId,
      },
    }).catch(() => {});
  }
}
