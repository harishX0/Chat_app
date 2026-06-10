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
  image: message.image,
  status: message.status,
  reactions: (message.reactions || []).map((r) => ({
    userId: normalizeId(r.userId),
    emoji: r.emoji,
  })),
  replyTo: message.replyTo ? normalizeId(message.replyTo) : null,
  isDeleted: message.isDeleted || false,
  timestamp: message.timestamp,
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
});

module.exports = serializeMessage;
