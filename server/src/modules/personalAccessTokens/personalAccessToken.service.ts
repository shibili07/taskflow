import crypto from 'crypto';

export const PAT_PREFIX = 'tfk_';

export function generateTokenValue(): string {
  return `${PAT_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;
}

export function hashTokenValue(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function getTokenPrefix(token: string): string {
  return token.slice(0, PAT_PREFIX.length + 8);
}
