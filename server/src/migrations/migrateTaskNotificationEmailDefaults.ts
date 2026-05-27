import mongoose from 'mongoose';
import {
  NOTIFICATION_EVENTS,
  NOTIFICATION_METHODS,
  type NotificationEventKey,
  type NotificationMethodState,
} from '../shared/constants/notificationCatalog';
import {
  getAvailableMethods,
  legacyDefaultPreferences,
} from '../modules/notifications/notificationPreference.service';

const TASK_EMAIL_EVENT_KEYS = ['task_assigned', 'task_unassigned', 'task_status_changed'] as const;

function methodStatesEqual(a: NotificationMethodState, b: NotificationMethodState): boolean {
  return NOTIFICATION_METHODS.every((m) => Boolean(a[m]) === Boolean(b[m]));
}

function matchesLegacyDefaultMatrix(
  prefs: Record<string, NotificationMethodState>
): boolean {
  const legacy = legacyDefaultPreferences();
  for (const eventKey of NOTIFICATION_EVENTS) {
    const stored = prefs[eventKey];
    if (!stored || !methodStatesEqual(stored, legacy[eventKey as NotificationEventKey])) {
      return false;
    }
  }
  return true;
}

/**
 * One-time: enable email for task assign/unassign/status for users still on the legacy all-false email matrix.
 */
export async function migrateTaskNotificationEmailDefaultsIfNeeded(): Promise<void> {
  if (!getAvailableMethods().email.enabled) return;

  const col = mongoose.connection.collection('notificationpreferences');
  const cursor = col.find({});
  let updated = 0;

  for await (const doc of cursor) {
    const prefs = (doc.preferences ?? {}) as Record<string, NotificationMethodState>;
    if (!matchesLegacyDefaultMatrix(prefs)) continue;

    const next = { ...prefs };
    for (const eventKey of TASK_EMAIL_EVENT_KEYS) {
      const prev = next[eventKey] ?? legacyDefaultPreferences()[eventKey];
      next[eventKey] = { ...prev, email: true };
    }

    await col.updateOne({ _id: doc._id }, { $set: { preferences: next } });
    updated += 1;
  }

  if (updated > 0) {
    console.log(`[migrate] task notification email defaults: updated ${updated} user preference document(s)`);
  }
}
