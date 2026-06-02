import { env } from '../../config/env';
import { sendPushToUser } from '../../services/push.service';
import { notifyPush } from '../../websocket';
import { sendCustomerEmail } from '../../services/email.service';
import {
  sendThirdPartyNotification,
  sendSmsNotification,
  sendWhatsappNotification,
  type ThirdPartyProvider,
} from '../../services/notifications/thirdPartyNotifier';
import type { NotificationEventKey, NotificationMethod } from '../../shared/constants/notificationCatalog';
import { createNotification } from './notifications.service';
import { getAvailableMethods, shouldSend } from './notificationPreference.service';
import { User } from '../auth/user.model';

export type NotifyUserParams = {
  userId: string;
  eventKey: NotificationEventKey;
  title: string;
  body?: string;
  link?: string;
  metadata?: Record<string, unknown>;
  /** When set, used as the email HTML body instead of the minimal default template. */
  html?: string;
  /** When true, skips the email channel (e.g. a dedicated transactional email was already sent). */
  skipEmail?: boolean;
  /**
   * When set, deliver on these channels if the transport is enabled, ignoring per-user
   * notification preferences (e.g. project release rules configured by an admin).
   */
  channelOverrides?: NotificationMethod[];
};

async function deliverOnChannel(
  userId: string,
  eventKey: NotificationEventKey,
  method: NotificationMethod,
  channelOverrides?: NotificationMethod[]
): Promise<boolean> {
  if (!getAvailableMethods()[method]?.enabled) return false;
  if (channelOverrides?.includes(method)) return true;
  return shouldSend(userId, eventKey, method);
}

export async function notifyUser(params: NotifyUserParams): Promise<void> {
  const { userId, eventKey, title, body = '', link, metadata, html, skipEmail, channelOverrides } = params;

  if (await deliverOnChannel(userId, eventKey, 'in_app', channelOverrides)) {
    await createNotification({
      userId,
      type: eventKey,
      title,
      body,
      link,
      metadata,
    });
  }

  if (await deliverOnChannel(userId, eventKey, 'push', channelOverrides)) {
    const payload = { title, body, url: link, data: { eventKey, ...(metadata ?? {}) } };
    sendPushToUser(userId, payload).catch((err) => console.error('Push failed:', err));
    notifyPush(userId, payload);
  }

  if (!skipEmail && (await deliverOnChannel(userId, eventKey, 'email', channelOverrides))) {
    const user = await User.findById(userId).select('email').lean();
    const to = (user as { email?: string } | null)?.email;
    if (to) {
      const emailHtml =
        html ?? `<div><h3>${title}</h3><p>${body}</p>${link ? `<p><a href="${link}">Open</a></p>` : ''}</div>`;
      sendCustomerEmail(to, title, emailHtml).catch((err) => console.error('Email send failed:', err));
    }
  }

  if (await deliverOnChannel(userId, eventKey, 'sms', channelOverrides)) {
    const smsToFromMeta = typeof metadata?.smsTo === 'string' ? metadata.smsTo : '';
    const smsTo = smsToFromMeta || env.smsDefaultTo;
    if (smsTo) {
      sendSmsNotification(smsTo, `${title}${body ? ` - ${body}` : ''}${link ? ` ${link}` : ''}`).catch((err) =>
        console.error('SMS send failed:', err)
      );
    }
  }
  if (await deliverOnChannel(userId, eventKey, 'whatsapp', channelOverrides)) {
    const whatsappToFromMeta = typeof metadata?.whatsappTo === 'string' ? metadata.whatsappTo : '';
    const whatsappTo = whatsappToFromMeta || env.whatsappDefaultTo;
    if (whatsappTo) {
      sendWhatsappNotification(whatsappTo, `${title}${body ? ` - ${body}` : ''}${link ? ` ${link}` : ''}`).catch((err) =>
        console.error('WhatsApp send failed:', err)
      );
    }
  }

  const providerMethods: ThirdPartyProvider[] = ['slack', 'teams', 'telegram', 'discord'];
  for (const provider of providerMethods) {
    if (await deliverOnChannel(userId, eventKey, provider, channelOverrides)) {
      sendThirdPartyNotification(provider, {
        title,
        body,
        url: link,
        eventKey,
        userId,
        metadata,
      }).catch((err) => console.error(`Third-party send failed (${provider}):`, err));
    }
  }
}

export function mapLegacyNotificationType(type: string): NotificationEventKey {
  switch (type) {
    case 'issue_assigned':
      return 'task_assigned';
    case 'issue_unassigned':
      return 'task_unassigned';
    case 'issue_closed':
      return 'task_status_changed';
    case 'mention':
    case 'issue_mentioned':
      return 'task_mentioned';
    case 'watch_comment':
      return 'watch_comment';
    case 'watch_status':
      return 'watch_status';
    case 'watch_field':
      return 'watch_field';
    case 'invitation_accepted':
      return 'project_invitation_accepted';
    default:
      return 'system_alert';
  }
}

export function appUrl(path?: string): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${env.appUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}
