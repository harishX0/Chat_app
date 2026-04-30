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
};

export default messageService;
