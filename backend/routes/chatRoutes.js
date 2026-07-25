const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { uploadChatAttachment } = require('../config/multer');
const {
  validateCreateConversation,
  validateSendMessage,
  validateEditMessage,
  validateMessageId,
  validateConversationId,
  validateQueryFilter,
} = require('../validators/chatValidator');

// All routes require authentication
router.use(verifyToken);

// Unread Badge Count
router.get('/unread', chatController.getUnreadCount);

// Conversations Routes
router.get('/conversations', chatController.getConversations);
router.post('/conversations', validateCreateConversation, chatController.createConversation);
router.get('/conversations/:id', validateConversationId, chatController.getConversationById);

// Messages Routes
router.post('/messages', validateSendMessage, chatController.sendMessage);
router.get('/messages/:conversationId', validateQueryFilter, chatController.getMessages);
router.put('/messages/:id', validateEditMessage, chatController.editMessage);
router.delete('/messages/:id', validateMessageId, chatController.deleteMessage);

// Read Receipt & Attachment Routes
router.post('/messages/:id/read', validateMessageId, chatController.markMessageRead);
router.post(
  '/messages/:id/attachment',
  validateMessageId,
  uploadChatAttachment.single('attachment'),
  chatController.uploadAttachment
);

module.exports = router;
