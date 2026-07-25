const supabase = require('../config/supabase');

/**
 * Helper to verify user is participant in conversation
 */
const checkParticipant = async (conversationId, userId) => {
  const { data: participant } = await supabase
    .from('conversation_participants')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (!participant) {
    const err = new Error('Forbidden: You are not a participant in this conversation.');
    err.statusCode = 403;
    throw err;
  }
  return true;
};

/**
 * List Conversations for authenticated user
 */
const listConversations = async (userId) => {
  // 1. Fetch conversation IDs user belongs to
  const { data: userConvs, error: convErr } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  if (convErr) {
    const err = new Error(convErr.message);
    err.statusCode = 500;
    throw err;
  }

  const convIds = (userConvs || []).map((c) => c.conversation_id);

  if (convIds.length === 0) {
    return [];
  }

  // 2. Fetch conversations details
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      conversation_participants (
        id,
        user_id,
        users (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      )
    `
    )
    .in('id', convIds)
    .order('updated_at', { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return conversations || [];
};

/**
 * Create Private or Group Conversation
 */
const createConversation = async (userId, { participant_ids, title, is_group = false }) => {
  const allParticipantIds = Array.from(new Set([userId, ...participant_ids]));

  // If 1-on-1 private chat, check if conversation already exists
  if (!is_group && allParticipantIds.length === 2) {
    const otherUserId = allParticipantIds.find((id) => id !== userId);

    const { data: existingConvs } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (existingConvs && existingConvs.length > 0) {
      const myConvIds = existingConvs.map((c) => c.conversation_id);
      const { data: match } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .in('conversation_id', myConvIds)
        .eq('user_id', otherUserId)
        .maybeSingle();

      if (match) {
        return getConversationById(match.conversation_id, userId);
      }
    }
  }

  // 1. Insert Conversation
  const { data: conv, error: convErr } = await supabase
    .from('conversations')
    .insert([
      {
        title: title || (is_group ? 'Group Chat' : null),
        is_group,
        created_by: userId,
        last_message_at: new Date().toISOString(),
      },
    ])
    .select('*')
    .single();

  if (convErr) {
    const err = new Error(convErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 2. Insert Participants
  const participantInserts = allParticipantIds.map((uId) => ({
    conversation_id: conv.id,
    user_id: uId,
    is_admin: uId === userId,
  }));

  await supabase.from('conversation_participants').insert(participantInserts);

  return getConversationById(conv.id, userId);
};

/**
 * Get Conversation Details by ID
 */
const getConversationById = async (conversationId, userId) => {
  await checkParticipant(conversationId, userId);

  const { data: conv, error } = await supabase
    .from('conversations')
    .select(
      `
      *,
      conversation_participants (
        id,
        user_id,
        is_admin,
        joined_at,
        users (
          id,
          full_name,
          email,
          avatar_url,
          role
        )
      )
    `
    )
    .eq('id', conversationId)
    .single();

  if (error || !conv) {
    const err = new Error('Conversation not found.');
    err.statusCode = 404;
    throw err;
  }

  return conv;
};

/**
 * Send Message in Conversation
 */
const sendMessage = async (userId, { conversation_id, message, message_type = 'text' }) => {
  await checkParticipant(conversation_id, userId);

  // 1. Insert Chat Message
  const { data: msg, error: msgErr } = await supabase
    .from('chat_messages')
    .insert([
      {
        conversation_id,
        sender_id: userId,
        message,
        message_type,
        edited: false,
        deleted: false,
      },
    ])
    .select('*')
    .single();

  if (msgErr) {
    const err = new Error(msgErr.message);
    err.statusCode = 500;
    throw err;
  }

  // 2. Update Conversation last_message_at
  await supabase
    .from('conversations')
    .update({
      last_message_id: msg.id,
      last_message_at: new Date().toISOString(),
    })
    .eq('id', conversation_id);

  // 3. Mark sender read receipt
  await markMessageRead(msg.id, userId);

  return msg;
};

/**
 * List Messages for Conversation
 */
const listMessages = async (conversationId, userId, queryParams) => {
  await checkParticipant(conversationId, userId);

  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 20;
  const offset = (page - 1) * limit;

  const { data: messages, count, error } = await supabase
    .from('chat_messages')
    .select(
      `
      *,
      users (
        id,
        full_name,
        avatar_url,
        role
      ),
      chat_attachments (
        id,
        file_name,
        file_url,
        file_size,
        mime_type
      ),
      message_read_receipts (
        user_id,
        read_at
      )
    `,
      { count: 'exact' }
    )
    .eq('conversation_id', conversationId)
    .order('sent_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return {
    messages: (messages || []).reverse(),
    page,
    limit,
    total: count || 0,
  };
};

/**
 * Edit Message Text
 */
const editMessage = async (messageId, userId, newMessage) => {
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (!msg || msg.sender_id !== userId) {
    const err = new Error('Forbidden: You can only edit your own messages.');
    err.statusCode = 403;
    throw err;
  }

  const { data: updated, error } = await supabase
    .from('chat_messages')
    .update({
      message: newMessage,
      edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', messageId)
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return updated;
};

/**
 * Soft Delete Message
 */
const deleteMessage = async (messageId, userId) => {
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  if (!msg || msg.sender_id !== userId) {
    const err = new Error('Forbidden: You can only delete your own messages.');
    err.statusCode = 403;
    throw err;
  }

  const { error } = await supabase
    .from('chat_messages')
    .update({
      message: '[Message Deleted]',
      deleted: true,
    })
    .eq('id', messageId);

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return true;
};

/**
 * Mark Message as Read
 */
const markMessageRead = async (messageId, userId) => {
  const { data: receipt, error } = await supabase
    .from('message_read_receipts')
    .upsert(
      [
        {
          message_id: messageId,
          user_id: userId,
          read_at: new Date().toISOString(),
        },
      ],
      { onConflict: 'message_id,user_id' }
    )
    .select('*')
    .single();

  if (error) {
    const err = new Error(error.message);
    err.statusCode = 500;
    throw err;
  }

  return receipt;
};

/**
 * Upload Chat Attachment to "chat-files" storage bucket
 */
const uploadChatAttachment = async (messageId, file, userId) => {
  const { data: msg } = await supabase
    .from('chat_messages')
    .select('id, conversation_id')
    .eq('id', messageId)
    .single();

  if (!msg) {
    const err = new Error('Chat message not found.');
    err.statusCode = 404;
    throw err;
  }

  await checkParticipant(msg.conversation_id, userId);

  const fileExt = file.originalname.split('.').pop();
  const fileName = `${Date.now()}_attachment.${fileExt}`;
  const storagePath = `${msg.conversation_id}/${fileName}`;

  // Upload to Supabase Storage 'chat-files'
  const { error: uploadErr } = await supabase.storage
    .from('chat-files')
    .upload(storagePath, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });

  if (uploadErr) {
    const err = new Error(`Attachment Upload Error: ${uploadErr.message}`);
    err.statusCode = 500;
    throw err;
  }

  const { data: publicUrlData } = supabase.storage.from('chat-files').getPublicUrl(storagePath);

  const { data: attachment, error: dbErr } = await supabase
    .from('chat_attachments')
    .insert([
      {
        message_id: messageId,
        bucket_name: 'chat-files',
        storage_path: storagePath,
        file_name: file.originalname,
        mime_type: file.mimetype,
        file_size: file.size,
        file_url: publicUrlData.publicUrl,
      },
    ])
    .select('*')
    .single();

  if (dbErr) {
    const err = new Error(dbErr.message);
    err.statusCode = 500;
    throw err;
  }

  return attachment;
};

/**
 * Get Total Unread Messages Count across conversations
 */
const getUnreadCount = async (userId) => {
  const { data: userConvs } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userId);

  const convIds = (userConvs || []).map((c) => c.conversation_id);

  if (convIds.length === 0) {
    return { unreadCount: 0 };
  }

  // Fetch unread messages
  const { data: readReceipts } = await supabase
    .from('message_read_receipts')
    .select('message_id')
    .eq('user_id', userId);

  const readMsgIds = (readReceipts || []).map((r) => r.message_id);

  let query = supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .in('conversation_id', convIds)
    .neq('sender_id', userId);

  if (readMsgIds.length > 0) {
    query = query.not('id', 'in', `(${readMsgIds.join(',')})`);
  }

  const { count: unreadCount } = await query;

  return {
    unreadCount: unreadCount || 0,
  };
};

module.exports = {
  listConversations,
  createConversation,
  getConversationById,
  sendMessage,
  listMessages,
  editMessage,
  deleteMessage,
  markMessageRead,
  uploadChatAttachment,
  getUnreadCount,
};
