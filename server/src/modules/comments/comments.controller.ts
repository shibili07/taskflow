import { Request, Response } from 'express';
import type { AuthPayload } from '../../types/express';
import { asyncHandler } from '../../utils/asyncHandler';
import { validate } from '../../middleware/validate';
import {
  createCommentSchema,
  updateCommentSchema,
  commentIdParamSchema,
  issueIdParamSchema,
} from './comments.validation';
import * as commentsService from './comments.service';
import * as watchersService from '../watchers/watchers.service';
import * as issuesService from '../issues/issues.service';
import { ProjectMember } from '../projects/projectMember.model';
import { extractMentionedUserIds } from '../../utils/mentions';
import { ApiError } from '../../utils/ApiError';
import * as commentNotification from './commentNotification.service';

export async function createComment(req: Request, res: Response): Promise<void> {
  const authorId = req.user?.id;
  if (!authorId) throw new ApiError(401, 'Unauthorized');
  const comment = await commentsService.create(
    req.params.issueId,
    authorId,
    req.body.body
  );
  const issue = await issuesService.findById(req.params.issueId) as {
    key?: string;
    title?: string;
    project?: { _id?: string; key?: string; name?: string };
  } | null;
  const issueKey = issue?.key ?? (issue?.project ? `${(issue.project as { key?: string }).key}-?` : '?');
  const projectId = issue?.project?._id ? String(issue.project._id) : undefined;
  const commentId = (comment as { _id?: { toString?: () => string } })?._id;
  const bodyStr = (req.body.body as string) ?? '';
  const commentExcerpt = bodyStr.replace(/<[^>]+>/g, '').slice(0, 300);

  watchersService.notifyWatchers(req.params.issueId, authorId, {
    type: 'comment_added',
    title: `New comment on ${issueKey}`,
    body: commentExcerpt.slice(0, 200),
    meta: {
      issueId: req.params.issueId,
      issueKey,
      projectId,
      issueTitle: issue?.title ?? '',
      projectName: issue?.project?.name,
      authorUserId: authorId,
      commentExcerpt,
      commentId: commentId ? String(commentId) : undefined,
    },
  }).catch(() => {});

  const mentionedIds = extractMentionedUserIds(bodyStr).filter((id) => id !== authorId);
  if (mentionedIds.length > 0 && projectId) {
    const members = await ProjectMember.find({ project: projectId, user: { $in: mentionedIds } })
      .select('user')
      .lean();
    const memberUserIds = members.map((m) => String(m.user));
    commentNotification
      .notifyMentionedInComment({
        issue: {
          issueId: req.params.issueId,
          issueKey,
          issueTitle: issue?.title ?? issueKey,
          projectId,
          projectName: issue?.project?.name,
        },
        commentBody: bodyStr,
        authorUserId: authorId,
        mentionedUserIds: memberUserIds,
        commentId: commentId ? String(commentId) : undefined,
      })
      .catch(() => {});
  }

  res.status(201).json({ success: true, data: comment });
}

export async function getComments(req: Request, res: Response): Promise<void> {
  const page = parseInt(String(req.query.page), 10) || 1;
  const limit = Math.min(parseInt(String(req.query.limit), 10) || 20, 100);
  const result = await commentsService.findByIssue(req.params.issueId, {
    page,
    limit,
  });
  res.status(200).json({ success: true, data: result });
}

export async function getCommentById(req: Request, res: Response): Promise<void> {
  const comment = await commentsService.findById(
    req.params.id,
    req.params.issueId
  );
  if (!comment) throw new ApiError(404, 'Comment not found');
  res.status(200).json({ success: true, data: comment });
}

export async function updateComment(req: Request & { user?: AuthPayload }, res: Response): Promise<void> {
  const authorId = req.user?.id;
  if (!authorId) throw new ApiError(401, 'Unauthorized');
  const comment = await commentsService.update(
    req.params.id,
    req.params.issueId,
    req.body.body,
    authorId
  );
  if (!comment) throw new ApiError(404, 'Comment not found');
  res.status(200).json({ success: true, data: comment });
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  const deleted = await commentsService.remove(req.params.id, req.params.issueId);
  if (!deleted) throw new ApiError(404, 'Comment not found');
  res.status(200).json({ success: true, data: { message: 'Comment deleted' } });
}

export const createCommentHandler = [
  validate(createCommentSchema.shape.params, 'params'),
  validate(createCommentSchema.shape.body, 'body'),
  asyncHandler(createComment),
];

export const updateCommentHandler = [
  validate(updateCommentSchema.shape.params, 'params'),
  validate(updateCommentSchema.shape.body, 'body'),
  asyncHandler(updateComment),
];

export const commentIdParamHandler = [
  validate(commentIdParamSchema.shape.params, 'params'),
];

export const issueIdOnlyParamHandler = [
  validate(issueIdParamSchema.shape.params, 'params'),
];
