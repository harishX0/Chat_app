import api from "./api";

const sendRequest = (recipientId) => api.post("/friends/request", { recipientId });
const acceptRequest = (requesterId) => api.post("/friends/accept", { requesterId });
const declineRequest = (requesterId) => api.post("/friends/decline", { requesterId });
const getRequests = () => api.get("/friends/requests");
const searchUsers = (query) => api.get(`/users/search?query=${query}`);
const removeFriend = (friendId) => api.delete(`/friends/remove/${friendId}`);

export default {
  sendRequest,
  acceptRequest,
  declineRequest,
  getRequests,
  searchUsers,
  removeFriend,
};
