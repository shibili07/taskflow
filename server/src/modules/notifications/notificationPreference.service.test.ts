import { legacyDefaultPreferences } from './notificationPreference.service';
import { NOTIFICATION_EVENTS } from '../../shared/constants/notificationCatalog';

describe('legacyDefaultPreferences', () => {
  it('has email disabled for all events including task assignment events', () => {
    const prefs = legacyDefaultPreferences();
    for (const eventKey of NOTIFICATION_EVENTS) {
      expect(prefs[eventKey].email).toBe(false);
      expect(prefs[eventKey].in_app).toBe(true);
    }
  });
});
