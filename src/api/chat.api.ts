import apiClient from './axios';

export interface MessageQueryParams {
  page?: number;
  limit?: number;
}

export const getConversations = async () => {
  const response = await apiClient.get('/chat/conversations');
  return response.data;
};

export const createConversation = async (data: { participant_ids: string[]; is_group?: boolean; title?: string }) => {
  const response = await apiClient.post('/chat/conversations', data);
  return response.data;
};

export const getConversationById = async (id: string) => {
  const response = await apiClient.get(`/chat/conversations/${id}`);
  return response.data;
};

export const getMessages = async (conversationId: string, params?: MessageQueryParams) => {
  const response = await apiClient.get(`/chat/messages/${conversationId}`, { params });
  return response.data;
};

export const sendMessage = async (data: { conversation_id: string; content: string; message_type?: string }) => {
  const response = await apiClient.post('/chat/messages', data);
  return response.data;
};

export const editMessage = async (id: string, data: { content: string }) => {
  const response = await apiClient.put(`/chat/messages/${id}`, data);
  return response.data;
};

export const deleteMessage = async (id: string) => {
  const response = await apiClient.delete(`/chat/messages/${id}`);
  return response.data;
};

export const markMessageRead = async (id: string) => {
  const response = await apiClient.post(`/chat/messages/${id}/read`);
  return response.data;
};

export const uploadAttachment = async (messageId: string, formData: FormData) => {
  const response = await apiClient.post(`/chat/messages/${messageId}/attachment`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const getUnreadCount = async () => {
  const response = await apiClient.get('/chat/unread');
  return response.data;
};
