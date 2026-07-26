import axiosInstance from '@/services/axiosInstance';

export const listMyConversations = () => axiosInstance.get('/chat/conversations');
export const getOrCreateConversation = (applicationId) =>
  axiosInstance.get(`/chat/conversations/application/${applicationId}`);
export const getMessages = (conversationId, params) =>
  axiosInstance.get(`/chat/conversations/${conversationId}/messages`, { params });
export const markConversationRead = (conversationId) =>
  axiosInstance.post(`/chat/conversations/${conversationId}/read`);
