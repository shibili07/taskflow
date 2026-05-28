import { notifyMentionedInComment } from './commentNotification.service';
import { notifyUser } from '../notifications/notificationDispatch.service';

jest.mock('../../config/env', () => ({
  env: { appUrl: 'https://app.example.com' },
}));

jest.mock('../auth/user.model', () => ({
  User: {
    findById: jest.fn().mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ name: 'Author Name' }),
      }),
    }),
  },
}));

jest.mock('../notifications/notificationDispatch.service', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

const mockedNotifyUser = notifyUser as jest.MockedFunction<typeof notifyUser>;

describe('notifyMentionedInComment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls notifyUser with task_mentioned and rich html', async () => {
    await notifyMentionedInComment({
      issue: {
        issueId: 'issue-1',
        issueKey: 'ABC-1',
        issueTitle: 'Test issue',
        projectId: 'proj-1',
      },
      commentBody: '<p>Hello @user</p>',
      authorUserId: 'author-1',
      mentionedUserIds: ['user-2'],
    });

    expect(mockedNotifyUser).toHaveBeenCalledTimes(1);
    const call = mockedNotifyUser.mock.calls[0][0];
    expect(call.eventKey).toBe('task_mentioned');
    expect(call.html).toContain('ABC-1');
    expect(call.html).toContain('You were mentioned');
    expect(call.link).toContain('/projects/proj-1/issues/ABC-1');
  });
});
