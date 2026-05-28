import {
  buildIssueUrl,
  notifyIssueAssigned,
  notifyIssueStatusChanged,
} from './issueNotification.service';
import { notifyUser } from '../notifications/notificationDispatch.service';
import { User } from '../auth/user.model';

jest.mock('../notifications/notificationDispatch.service', () => ({
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../auth/user.model', () => ({
  User: {
    findById: jest.fn(),
  },
}));

jest.mock('../projects/project.model', () => ({
  Project: {
    findById: jest.fn().mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve(null),
      }),
    }),
  },
}));

jest.mock('../../config/env', () => ({
  env: { appUrl: 'https://app.example.com' },
}));

const mockedNotifyUser = notifyUser as jest.MockedFunction<typeof notifyUser>;
const mockedUserFindById = User.findById as jest.Mock;

describe('buildIssueUrl', () => {
  it('builds a project issue URL from key', () => {
    expect(buildIssueUrl('proj-1', 'ABC-42')).toBe(
      'https://app.example.com/projects/proj-1/issues/ABC-42'
    );
  });
});

describe('notifyIssueAssigned', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserFindById.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ name: 'Alex Actor' }),
      }),
    } as never);
  });

  it('calls notifyUser with task_assigned and rich html for a new assignee', async () => {
    await notifyIssueAssigned({
      issue: {
        _id: 'issue-1',
        key: 'PRJ-1',
        title: 'Fix login',
        type: 'Bug',
        status: 'Open',
        project: 'proj-1',
      },
      assigneeUserId: 'user-assignee',
      actorUserId: 'user-actor',
    });

    expect(mockedNotifyUser).toHaveBeenCalledTimes(1);
    const call = mockedNotifyUser.mock.calls[0][0];
    expect(call.userId).toBe('user-assignee');
    expect(call.eventKey).toBe('task_assigned');
    expect(call.html).toContain('PRJ-1');
    expect(call.html).toContain('Fix login');
    expect(call.html).toContain('Open issue');
    expect(call.link).toContain('/projects/proj-1/issues/PRJ-1');
  });

  it('skips when assignee is the actor', async () => {
    await notifyIssueAssigned({
      issue: {
        _id: 'issue-1',
        key: 'PRJ-1',
        title: 'Fix login',
        status: 'Open',
        project: 'proj-1',
      },
      assigneeUserId: 'user-self',
      actorUserId: 'user-self',
    });

    expect(mockedNotifyUser).not.toHaveBeenCalled();
  });
});

describe('notifyIssueStatusChanged', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserFindById.mockReturnValue({
      select: () => ({
        lean: () => Promise.resolve({ name: 'Alex Actor' }),
      }),
    } as never);
  });

  it('notifies assignee on any status transition', async () => {
    await notifyIssueStatusChanged({
      issue: {
        _id: 'issue-1',
        key: 'PRJ-2',
        title: 'Deploy',
        type: 'Task',
        status: 'In Progress',
        project: 'proj-1',
      },
      fromStatus: 'Open',
      toStatus: 'In Progress',
      assigneeUserId: 'user-assignee',
      actorUserId: 'user-actor',
    });

    expect(mockedNotifyUser).toHaveBeenCalledTimes(1);
    const call = mockedNotifyUser.mock.calls[0][0];
    expect(call.userId).toBe('user-assignee');
    expect(call.eventKey).toBe('task_status_changed');
    expect(call.body).toContain('Open');
    expect(call.body).toContain('In Progress');
    expect(call.html).toContain('Open');
    expect(call.html).toContain('In Progress');
  });

  it('skips when there is no assignee', async () => {
    await notifyIssueStatusChanged({
      issue: {
        _id: 'issue-1',
        key: 'PRJ-2',
        title: 'Deploy',
        status: 'Open',
        project: 'proj-1',
      },
      fromStatus: 'Open',
      toStatus: 'Done',
      assigneeUserId: null,
      actorUserId: 'user-actor',
    });

    expect(mockedNotifyUser).not.toHaveBeenCalled();
  });
});
