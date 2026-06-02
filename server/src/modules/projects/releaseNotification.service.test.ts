import {
  channelsToNotificationOverrides,
  dispatchReleaseNotifications,
  resolveReleaseNotifyUserIds,
  ruleHasReleaseNotifications,
} from './releaseNotification.service';
import type { IProjectReleaseRule } from './project.model';

jest.mock('./projectMember.model', () => ({
  ProjectMember: {
    find: jest.fn(() => ({
      distinct: jest.fn().mockResolvedValue(['member-a', 'member-b']),
    })),
  },
}));

jest.mock('../inbox/inbox.service', () => ({
  createMessage: jest.fn().mockResolvedValue({}),
}));

jest.mock('../notifications/notificationDispatch.service', () => ({
  appUrl: (path: string) => `https://app.test/${path}`,
  notifyUser: jest.fn().mockResolvedValue(undefined),
}));

import { ProjectMember } from './projectMember.model';
import * as inboxService from '../inbox/inbox.service';
import { notifyUser } from '../notifications/notificationDispatch.service';

describe('releaseNotification.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ruleHasReleaseNotifications is true when channels or users are set', () => {
    expect(ruleHasReleaseNotifications({ environmentId: 'e1', statusName: 'Done' })).toBe(false);
    expect(
      ruleHasReleaseNotifications({
        environmentId: 'e1',
        statusName: 'Done',
        notifyChannels: ['email'],
      })
    ).toBe(true);
    expect(
      ruleHasReleaseNotifications({
        environmentId: 'e1',
        statusName: 'Done',
        notifyUserIds: ['u1'],
      })
    ).toBe(true);
  });

  it('resolveReleaseNotifyUserIds prefers explicit users', () => {
    const rule: IProjectReleaseRule = {
      environmentId: 'e1',
      statusName: 'Done',
      notifyUserIds: ['u1', 'u2'],
      notifyChannels: ['email'],
    };
    expect(resolveReleaseNotifyUserIds(rule, ['member-a'])).toEqual(['u1', 'u2']);
  });

  it('resolveReleaseNotifyUserIds falls back to all members when channels set without users', () => {
    const rule: IProjectReleaseRule = {
      environmentId: 'e1',
      statusName: 'Done',
      notifyChannels: ['email'],
    };
    expect(resolveReleaseNotifyUserIds(rule, ['member-a', 'member-b'])).toEqual(['member-a', 'member-b']);
  });

  it('channelsToNotificationOverrides maps email and third_party', () => {
    expect(channelsToNotificationOverrides(['email'])).toEqual(['email']);
    expect(channelsToNotificationOverrides(['third_party'])).toEqual([
      'slack',
      'teams',
      'telegram',
      'discord',
    ]);
    expect(channelsToNotificationOverrides(['in_app'])).toEqual([]);
  });

  it('dispatchReleaseNotifications sends inbox and email when configured', async () => {
    const rule: IProjectReleaseRule = {
      environmentId: 'e1',
      statusName: 'Done',
      notifyUserIds: ['u1'],
      notifyChannels: ['email', 'in_app'],
    };

    await dispatchReleaseNotifications({
      projectId: 'proj-1',
      rule,
      releaseTitle: 'Release: v1 → Production',
      releaseNotesMarkdown: '# Release notes',
      versionName: 'v1',
      environmentName: 'Production',
      projectName: 'Demo',
      releasedAtFormatted: 'May 28, 2026',
      issueCount: 3,
      promoteRelease: false,
    });

    expect(ProjectMember.find).not.toHaveBeenCalled();
    expect(inboxService.createMessage).toHaveBeenCalledTimes(1);
    expect(inboxService.createMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        toUser: 'u1',
        type: 'release_notes',
        title: 'Release: v1 → Production',
      })
    );
    expect(notifyUser).toHaveBeenCalledTimes(1);
    expect(notifyUser).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        eventKey: 'release_deployed',
        channelOverrides: ['email'],
        html: expect.stringContaining('v1'),
      })
    );
  });

  it('dispatchReleaseNotifications skips when rule has no notify config', async () => {
    await dispatchReleaseNotifications({
      projectId: 'proj-1',
      rule: { environmentId: 'e1', statusName: 'Done' },
      releaseTitle: 'Release: v1 → Staging',
      releaseNotesMarkdown: '# Notes',
      versionName: 'v1',
      environmentName: 'Staging',
      projectName: 'Demo',
      releasedAtFormatted: 'May 28, 2026',
      issueCount: 0,
      promoteRelease: false,
    });

    expect(inboxService.createMessage).not.toHaveBeenCalled();
    expect(notifyUser).not.toHaveBeenCalled();
  });
});
