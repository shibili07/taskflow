import { z } from 'zod';

const createBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  expiresInDays: z.number().int().positive().max(3650).optional(),
});

export const personalAccessTokenValidation = {
  createBody: createBodySchema,
};
