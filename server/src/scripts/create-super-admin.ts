import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import { Role } from '../modules/roles/role.model';
import { User } from '../modules/auth/user.model';
import { PERMISSION_CODES } from '../constants/permissions';

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/pm-tool';
const SUPER_ADMIN_ROLE_NAME = 'Super Admin';

async function main(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const allPermissions = [...PERMISSION_CODES];
  let roleId: mongoose.Types.ObjectId;

  let superAdminRole = await Role.findOne({ name: SUPER_ADMIN_ROLE_NAME }).lean();
  if (!superAdminRole) {
    const created = await Role.create({
      name: SUPER_ADMIN_ROLE_NAME,
      permissions: allPermissions,
    });
    roleId = created._id;
    console.log(`Created role "${SUPER_ADMIN_ROLE_NAME}" with ${allPermissions.length} permissions.`);
  } else {
    roleId = superAdminRole._id;
    await Role.findOneAndUpdate(
      { name: SUPER_ADMIN_ROLE_NAME },
      { $set: { permissions: allPermissions } }
    );
    console.log(`Role "${SUPER_ADMIN_ROLE_NAME}" exists with ${allPermissions.length} permissions.`);
  }

  const email = process.env.SUPER_ADMIN_EMAIL?.trim();
  if (!email) {
    console.log('SUPER_ADMIN_EMAIL not set. Skipping user create/update.');
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const password = process.env.SUPER_ADMIN_PASSWORD?.trim();
  const name = process.env.SUPER_ADMIN_NAME?.trim() || 'Super Admin';
  const emailNorm = email.toLowerCase();

  const existingUser = await User.findOne({ email: emailNorm });

  if (existingUser) {
    const doc = await User.findById(existingUser._id).select('+password');
    if (!doc) {
      console.error(`User "${email}" not found after lookup.`);
      await mongoose.disconnect();
      process.exit(1);
    }
    doc.roleId = roleId;
    doc.role = 'admin';
    doc.mustChangePassword = false;
    doc.name = name;
    doc.enabled = true;
    if (password && password.length >= 6) {
      doc.password = password;
      console.log(`Updated user "${email}" to role "${SUPER_ADMIN_ROLE_NAME}" and reset password.`);
    } else {
      console.log(
        `Updated user "${email}" to role "${SUPER_ADMIN_ROLE_NAME}" (password unchanged; set SUPER_ADMIN_PASSWORD to reset).`
      );
    }
    await doc.save();
  } else {
    if (!password || password.length < 6) {
      console.error('SUPER_ADMIN_PASSWORD is required (min 6 characters) to create a new user.');
      await mongoose.disconnect();
      process.exit(1);
    }
    await User.create({
      email: emailNorm,
      password,
      name,
      role: 'admin',
      roleId,
      mustChangePassword: false,
      enabled: true,
    });
    console.log(`Created super admin user: ${email}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
