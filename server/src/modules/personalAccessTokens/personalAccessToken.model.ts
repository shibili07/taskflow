import mongoose, { Document, Schema } from 'mongoose';

export interface IPersonalAccessToken extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  lastUsedAt?: Date | null;
  expiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const personalAccessTokenSchema = new Schema<IPersonalAccessToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    tokenHash: { type: String, required: true, unique: true },
    tokenPrefix: { type: String, required: true },
    lastUsedAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

personalAccessTokenSchema.index({ user: 1, createdAt: -1 });

export const PersonalAccessToken = mongoose.model<IPersonalAccessToken>(
  'PersonalAccessToken',
  personalAccessTokenSchema
);
