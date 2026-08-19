const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } }).select("name username email");
    
    return res.status(200).json({
      users: users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch users.", error: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required." });
    }

    const currentUser = await User.findById(req.user.userId);

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user.userId } },
        { _id: { $nin: currentUser.friends } },
        {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { username: { $regex: query, $options: "i" } },
            { email: { $regex: query, $options: "i" } },
          ],
        },
      ],
    }).select("name username email");

    return res.status(200).json({ users });
  } catch (error) {
    return res.status(500).json({ message: "Search failed.", error: error.message });
  }
};

module.exports = { getUsers, searchUsers };
