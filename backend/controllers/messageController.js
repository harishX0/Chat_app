const mongoose = require("mongoose");

const Message = require("../models/Message");
const serializeMessage = require("../utils/serializeMessage");

const storeMessage = async ({ senderId, receiverId, message, onlineUsers, io }) => {
  const normalizedReceiverId = receiverId.toString();
  const isReceiverOnline = Boolean(onlineUsers?.has(normalizedReceiverId));

  const savedMessage = await Message.create({
    senderId,
    receiverId,
    message: message.trim(),
    status: isReceiverOnline ? "delivered" : "sent",
  });

  const serializedMessage = serializeMessage(savedMessage);

  if (io) {
    io.to(normalizedReceiverId).emit("receiveMessage", serializedMessage);
  }

  return serializedMessage;
};

const markConversationAsSeen = async ({ senderId, receiverId, io }) => {
  const unseenMessages = await Message.find({
    senderId,
    receiverId,
    status: { $ne: "seen" },
  }).select("_id");

  if (!unseenMessages.length) {
    return null;
  }

  const messageIds = unseenMessages.map((message) => message._id);

  await Message.updateMany(
    { _id: { $in: messageIds } },
    {
      $set: {
        status: "seen",
      },
    }
  );

  const payload = {
    conversationUserId: senderId.toString(),
    seenBy: receiverId.toString(),
    messageIds: messageIds.map((messageId) => messageId.toString()),
  };

  if (io) {
    io.to(senderId.toString()).emit("messageSeen", payload);
    io.to(receiverId.toString()).emit("messageSeen", payload);
  }

  return payload;
};

const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid conversation user id." });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId: userId },
        { senderId: userId, receiverId: req.user.userId },
      ],
    }).sort({ timestamp: 1 });

    return res.status(200).json({
      messages: messages.map((message) => serializeMessage(message)),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch messages.", error: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    if (!receiverId || !message) {
      return res.status(400).json({ message: "Receiver and message are required." });
    }

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id." });
    }

    const savedMessage = await storeMessage({
      senderId: req.user.userId,
      receiverId,
      message,
      onlineUsers: req.app.get("onlineUsers"),
      io: req.app.get("io"),
    });

    return res.status(201).json({ message: savedMessage });
  } catch (error) {
    return res.status(500).json({ message: "Unable to send message.", error: error.message });
  }
};

const markMessagesSeen = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid conversation user id." });
    }

    const payload = await markConversationAsSeen({
      senderId: userId,
      receiverId: req.user.userId,
      io: req.app.get("io"),
    });

    return res.status(200).json({
      message: "Conversation updated.",
      updated: payload ? payload.messageIds.length : 0,
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update message status.", error: error.message });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  markMessagesSeen,
  markConversationAsSeen,
  storeMessage,
};
