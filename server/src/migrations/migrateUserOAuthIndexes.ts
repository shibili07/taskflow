import { User } from '../modules/auth/user.model';

/**
 * Local/email users must not store googleId/microsoftId as null — a non-sparse unique
 * index only allows one null. Unset empty OAuth ids and ensure sparse unique indexes.
 */
export async function migrateUserOAuthIndexesIfNeeded(): Promise<void> {
  const coll = User.collection;

  const google = await coll.updateMany(
    { $or: [{ googleId: null }, { googleId: '' }] },
    { $unset: { googleId: '' } }
  );
  const microsoft = await coll.updateMany(
    { $or: [{ microsoftId: null }, { microsoftId: '' }] },
    { $unset: { microsoftId: '' } }
  );
  if (google.modifiedCount > 0 || microsoft.modifiedCount > 0) {
    console.log(
      `[migrate] users: unset null OAuth ids (google: ${google.modifiedCount}, microsoft: ${microsoft.modifiedCount})`
    );
  }

  for (const indexName of ['googleId_1', 'microsoftId_1']) {
    try {
      await coll.dropIndex(indexName);
      console.log(`[migrate] users: dropped index ${indexName}`);
    } catch (e: unknown) {
      const code = (e as { code?: number }).code;
      if (code !== 27) {
        console.warn(`[migrate] users: could not drop ${indexName}:`, (e as Error).message);
      }
    }
  }

  try {
    await User.syncIndexes();
    console.log('[migrate] users: syncIndexes complete');
  } catch (e) {
    console.error('[migrate] users: syncIndexes failed:', e);
  }
}
