import mongoose from 'mongoose';
import { env } from './env';
import { migrateNotificationSchemaIfNeeded } from '../migrations/migrateNotificationSchema';
import { migrateOrganizationTenancyIfNeeded } from '../migrations/migrateOrganizationTenancy';
import { migrateUserOAuthIndexesIfNeeded } from '../migrations/migrateUserOAuthIndexes';
import '../modules/projects/projectDesignation.model';
import '../modules/organizations/organization.model';
import '../modules/organizations/organizationMember.model';
import '../modules/auth/user.model';

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
  console.log('Connected to MongoDB');
  await migrateNotificationSchemaIfNeeded().catch((e) => console.error('[migrate] notifications failed:', e));
  await migrateOrganizationTenancyIfNeeded().catch((e) => console.error('[migrate] organizations failed:', e));
  await migrateUserOAuthIndexesIfNeeded().catch((e) => console.error('[migrate] users OAuth indexes failed:', e));
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
