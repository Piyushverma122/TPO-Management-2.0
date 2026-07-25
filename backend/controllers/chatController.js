const chatService = require('../services/chatService');
const { sendSuccess, sendError, sendPaginated } = require('../utils/responseHandler');

/**
 * @desc    List user active conversations
 * @route   GET /api/v1/chat/conversations
 * @access  Private (Authenticated)
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await chatService.listConversations(req.user.id);
    return sendSuccess(res, 'Conversations list retrieved', { conversations }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create private or group conversation
 * @route   POST /api/v1/chat/conversations
 * @access  Private (Authenticated)
 */
const createConversation = async (req, res, next) => {
  try {
    const conversation = await chatService.createConversation(req.user.id, req.body);
    return sendSuccess(res, 'Conversation created successfully', { conversation }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get conversation details & members
 * @route   GET /api/v1/chat/conversations/:id
 * @access  Private (Authenticated Participant)
 */
const getConversationById = async (req, res, next) => {
  try {
    const conversation = await chatService.getConversationById(req.params.id, req.user.id);
    return sendSuccess(res, 'Conversation details retrieved', { conversation }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send chat message
 * @route   POST /api/v1/chat/messages
 * @access  Private (Authenticated Participant)
 */
const sendMessage = async (req, res, next) => {
  try {
    const message = await chatService.sendMessage(req.user.id, req.body);
    return sendSuccess(res, 'Message sent successfully', { message }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Fetch paginated messages for conversation
 * @route   GET /api/v1/chat/messages/:conversationId
 * @access  Private (Authenticated Participant)
 */
const getMessages = async (req, res, next) => {
  try {
    const result = await chatService.listMessages(
      req.params.conversationId,
      req.user.id,
      req.query
    );
    return sendPaginated(
      res,
      'Messages retrieved successfully',
      result.messages,
      result.page,
      result.limit,
      result.total,
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Edit sent message text
 * @route   PUT /api/v1/chat/messages/:id
 * @access  Private (Sender Only)
 */
const editMessage = async (req, res, next) => {
  try {
    const message = await chatService.editMessage(req.params.id, req.user.id, req.body.message);
    return sendSuccess(res, 'Message edited successfully', { message }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft delete message
 * @route   DELETE /api/v1/chat/messages/:id
 * @access  Private (Sender Only)
 */
const deleteMessage = async (req, res, next) => {
  try {
    await chatService.deleteMessage(req.params.id, req.user.id);
    return sendSuccess(res, 'Message deleted', null, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark message read receipt
 * @route   POST /api/v1/chat/messages/:id/read
 * @access  Private (Authenticated Participant)
 */
const markMessageRead = async (req, res, next) => {
  try {
    const receipt = await chatService.markMessageRead(req.params.id, req.user.id);
    return sendSuccess(res, 'Message read receipt updated', { receipt }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Upload chat attachment to chat-files bucket
 * @route   POST /api/v1/chat/messages/:id/attachment
 * @access  Private (Authenticated Participant)
 */
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Please upload a file attachment', null, 400);
    }
    const attachment = await chatService.uploadChatAttachment(
      req.params.id,
      req.file,
      req.user.id
    );
    return sendSuccess(res, 'Chat attachment uploaded successfully', { attachment }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get total unread messages count
 * @route   GET /api/v1/chat/unread
 * @access  Private (Authenticated)
 */
const getUnreadCount = async (req, res, next) => {
  try {
    const result = await chatService.getUnreadCount(req.user.id);
    return sendSuccess(res, 'Unread messages count calculated', result, 200);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConversations,
  createConversation,
  getConversationById,
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
  markMessageRead,
  uploadAttachment,
  getUnreadCount,
};
