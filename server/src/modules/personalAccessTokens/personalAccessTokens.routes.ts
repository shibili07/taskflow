import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate';
import { listTokens, createToken, revokeToken } from './personalAccessTokens.controller';
import { personalAccessTokenValidation } from './personalAccessToken.validation';

const router = Router();

router.use(authMiddleware);

router.get('/', listTokens);
router.post('/', validate(personalAccessTokenValidation.createBody, 'body'), createToken);
router.delete('/:id', revokeToken);

export const personalAccessTokensRoutes = router;
