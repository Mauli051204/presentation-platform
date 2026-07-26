import { Router } from 'express';
import {
  autocomplete,
  getRecentSearches,
  getPopularSearches,
} from '../controllers/search.controller.js';
import { verifyAccessToken } from '../middleware/auth.js';

const router = Router();

router.get('/autocomplete', autocomplete);
router.get('/popular', getPopularSearches);
router.get('/recent', verifyAccessToken, getRecentSearches);

export default router;
