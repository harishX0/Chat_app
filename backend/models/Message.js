const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: {
      type: String,
      trim: true,
      required: function () {
        return !this.image;
      },
    },
    image: {
      type: String, // Base64 or URL
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "seen"],
      default: "sent",
    },
    reactions: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String,
      },
    ],
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
