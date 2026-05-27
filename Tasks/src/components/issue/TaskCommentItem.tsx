import { useState } from 'react';
import type { Comment } from '../../lib/api';
import { formatDateTimeDDMMYYYY } from '../../lib/dateFormat';
import RichTextContent from '../richText/RichTextContent';
import TaskCommentBox from './TaskCommentBox';

function relativeTime(s: string | undefined) {
  if (!s) return '';
  const d = new Date(s);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `about ${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  return formatDateTimeDDMMYYYY(s);
}

function wasEdited(comment: Comment): boolean {
  if (!comment.updatedAt || !comment.createdAt) return false;
  return new Date(comment.updatedAt).getTime() > new Date(comment.createdAt).getTime() + 1000;
}

interface TaskCommentItemProps {
  comment: Comment;
  currentUserId?: string;
  mentionUsers?: Array<{ _id: string; name: string; email: string }>;
  onUpdate?: (commentId: string, body: string) => void | Promise<void>;
  submittingEdit?: boolean;
}

export default function TaskCommentItem({
  comment,
  currentUserId,
  mentionUsers = [],
  onUpdate,
  submittingEdit = false,
}: TaskCommentItemProps) {
  const [editing, setEditing] = useState(false);
  const authorName = typeof comment.author === 'object' ? comment.author.name : 'Unknown';
  const authorId = typeof comment.author === 'object' ? comment.author._id : undefined;
  const canEdit = Boolean(currentUserId && authorId && currentUserId === authorId && onUpdate);

  async function handleSave(body: string) {
    if (!onUpdate) return;
    await onUpdate(comment._id, body);
    setEditing(false);
  }

  if (editing && canEdit) {
    return (
      <div className="rounded-xl bg-[color:var(--bg-surface)] border border-[color:var(--border-subtle)] p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="type-author">{authorName}</span>
            <span className="type-meta">·</span>
            <span className="type-meta">Editing comment</span>
          </div>
        </div>
        <TaskCommentBox
          key={comment._id}
          initialBody={comment.body}
          onSubmit={handleSave}
          submitting={submittingEdit}
          mentionUsers={mentionUsers}
          placeholder="Edit comment…"
          submitLabel="Save"
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[color:var(--bg-surface)] border border-[color:var(--border-subtle)] p-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="type-author">{authorName}</span>
          <span className="type-meta">·</span>
          <span className="type-meta">{relativeTime(comment.createdAt)}</span>
          {wasEdited(comment) && <span className="type-meta italic">(edited)</span>}
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-md text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)] hover:bg-[color:var(--bg-page)] transition-colors"
          >
            Edit
          </button>
        )}
      </div>
      <RichTextContent body={comment.body} />
    </div>
  );
}
