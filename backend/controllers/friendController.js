const User = require("../models/User");

const sendFriendRequest = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user.userId;

    if (senderId === recipientId) {
      return res.status(400).json({ message: "You cannot add yourself." });
    }

    const recipient = await User.findById(recipientId);
    const sender = await User.findById(senderId);

    if (!recipient || !sender) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if already friends
    if (sender.friends.includes(recipientId)) {
      return res.status(400).json({ message: "Already friends." });
    }

    // Check if request already sent/received
    const existingRequest = sender.friendRequests.find(
      (req) => req.user.toString() === recipientId
    );
    if (existingRequest) {
      return res.status(400).json({ message: "Request already exists." });
    }

    // Add to sender's pending
    sender.friendRequests.push({ user: recipientId, status: "pending" });
    // Add to recipient's received
    recipient.friendRequests.push({ user: senderId, status: "received" });

    await sender.save();
    await recipient.save();

    res.status(200).json({ message: "Friend request sent." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ message: "User not found." });
    }

    // Remove from requests
    user.friendRequests = user.friendRequests.filter(
      (r) => r.user.toString() !== requesterId
    );
    requester.friendRequests = requester.friendRequests.filter(
      (r) => r.user.toString() !== userId
    );

    // Add to friends
    user.friends.push(requesterId);
    requester.friends.push(userId);

    await user.save();
    await requester.save();

    res.status(200).json({ message: "Friend request accepted." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const { requesterId } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const requester = await User.findById(requesterId);

    if (!user || !requester) {
      return res.status(404).json({ message: "User not found." });
    }

    // Remove from requests
    user.friendRequests = user.friendRequests.filter(
      (r) => r.user.toString() !== requesterId
    );
    requester.friendRequests = requester.friendRequests.filter(
      (r) => r.user.toString() !== userId
    );

    await user.save();
    await requester.save();

    res.status(200).json({ message: "Friend request declined." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const getFriendRequests = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "friendRequests.user",
      "name email"
    );
    
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const requests = user.friendRequests.filter(r => r.status === "received");

    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.status(404).json({ message: "User not found." });
    }

    user.friends = user.friends.filter((f) => f.toString() !== friendId);
    friend.friends = friend.friends.filter((f) => f.toString() !== userId);

    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed." });
  } catch (error) {
    res.status(500).json({ message: "Server error.", error: error.message });
  }
};

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  removeFriend,
};
