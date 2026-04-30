const User = require("../models/User");

const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.userId } })
      .select("name email createdAt updatedAt")
      .sort({ name: 1 });

    return res.status(200).json({
      users: users.map((user) => ({
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch users.", error: error.message });
  }
};

module.exports = { getUsers };
