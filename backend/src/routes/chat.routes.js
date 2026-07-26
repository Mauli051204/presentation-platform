import { Router } from 'express';
import {
  getOrCreateConversation,
  listMyConversations,
  getMessages,
  markConversationRead,
} from '../controllers/chat.controller.js';
import { verifyAccessToken } from '../middleware/auth.js';

const router = Router();

router.use(verifyAccessToken);

router.get('/conversations', listMyConversations);
router.get('/conversations/application/:applicationId', getOrCreateConversation);
router.get('/conversations/:conversationId/messages', getMessages);
router.post('/conversations/:conversationId/read', markConversationRead);

export default router;
