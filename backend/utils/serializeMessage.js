const normalizeId = (value) => {
  if (!value) {
    return value;
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value._id) {
    return value._id.toString();
  }

  return value.toString();
};

const serializeMessage = (message) => ({
  _id: message._id.toString(),
  senderId: normalizeId(message.senderId),
  receiverId: normalizeId(message.receiverId),
  message: message.message,
  status: message.status,
  timestamp: message.timestamp,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

module.exports = serializeMessage;
