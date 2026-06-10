import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { PersonalAccessToken } from './personalAccessToken.model';
import { generateTokenValue, hashTokenValue, getTokenPrefix } from './personalAccessToken.service';
import { ApiError } from '../../utils/ApiError';
import type { AuthPayload } from '../../types/express';

export async function listTokens(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user as AuthPayload;
    const tokens = await PersonalAccessToken.find({ user: user.id })
      .sort({ createdAt: -1 })
      .select('name tokenPrefix lastUsedAt expiresAt createdAt')
      .lean();
    res.status(200).json({ success: true, data: tokens });
  } catch (e) {
    next(e);
  }
}

export async function createToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user as AuthPayload;
    const { name, expiresInDays } = req.body as { name: string; expiresInDays?: number };

    const tokenValue = generateTokenValue();
    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const created = await PersonalAccessToken.create({
      user: user.id,
      name,
      tokenHash: hashTokenValue(tokenValue),
      tokenPrefix: getTokenPrefix(tokenValue),
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: {
        id: created._id.toString(),
        name: created.name,
        token: tokenValue,
        tokenPrefix: created.tokenPrefix,
        expiresAt: created.expiresAt,
        createdAt: created.createdAt,
      },
    });
  } catch (e) {
    next(e);
  }
}

export async function revokeToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user as AuthPayload;
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ApiError(400, 'Invalid token id');
    }
    const result = await PersonalAccessToken.deleteOne({ _id: id, user: user.id });
    if (result.deletedCount === 0) {
      throw new ApiError(404, 'Token not found');
    }
    res.status(200).json({ success: true });
  } catch (e) {
    next(e);
  }
}
