import api from "./api";

const messageService = {
  getConversation: async (userId) => {
    const response = await api.get(`/messages/${userId}`);
    return response.data;
  },
  markSeen: async (userId) => {
    const response = await api.patch(`/messages/${userId}/seen`);
    return response.data;
  },
  reactToMessage: async (messageId, emoji) => {
    const response = await api.post(`/messages/${messageId}/react`, { emoji });
    return response.data;
  },
  unsendMessage: async (messageId) => {
    const response = await api.delete(`/messages/${messageId}`);
    return response.data;
  },
};

export default messageService;
