const mongoose = require("mongoose");

const Message = require("../models/Message");
const serializeMessage = require("../utils/serializeMessage");

const storeMessage = async ({ senderId, receiverId, message, image, replyTo, onlineUsers, io }) => {
  const normalizedReceiverId = receiverId.toString();
  const isReceiverOnline = Boolean(onlineUsers?.has(normalizedReceiverId));

  const savedMessage = await Message.create({
    senderId,
    receiverId,
    message: message?.trim(),
    image,
    replyTo,
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
    const { receiverId, message, image, replyTo } = req.body;

    if (!receiverId || (!message && !image)) {
      return res.status(400).json({ message: "Receiver and either message or image are required." });
    }

    if (!mongoose.isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiver id." });
    }

    const savedMessage = await storeMessage({
      senderId: req.user.userId,
      receiverId,
      message,
      image,
      replyTo,
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

const reactToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId);

    if (emoji) {
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    const serialized = serializeMessage(message);

    const io = req.app.get("io");
    if (io) {
      io.to(message.senderId.toString()).emit("messageReaction", { messageId, reactions: serialized.reactions });
      io.to(message.receiverId.toString()).emit("messageReaction", { messageId, reactions: serialized.reactions });
    }

    return res.status(200).json({ reactions: serialized.reactions });
  } catch (error) {
    return res.status(500).json({ message: "Unable to react to message.", error: error.message });
  }
};

const unsendMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ message: "You can only unsend your own messages." });
    }

    message.isDeleted = true;
    message.message = "This message was unsent";
    message.image = null;
    message.reactions = [];

    await message.save();

    const io = req.app.get("io");
    if (io) {
      const payload = { messageId, isDeleted: true };
      io.to(message.senderId.toString()).emit("messageDeleted", payload);
      io.to(message.receiverId.toString()).emit("messageDeleted", payload);
    }

    return res.status(200).json({ message: "Message unsent" });
  } catch (error) {
    return res.status(500).json({ message: "Unable to unsend message.", error: error.message });
  }
};

module.exports = {
  getConversation,
  sendMessage,
  markMessagesSeen,
  markConversationAsSeen,
  storeMessage,
  reactToMessage,
  unsendMessage,
};
