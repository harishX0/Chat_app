const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const buildUserResponse = (user) => ({
  _id: user._id.toString(),
  name: user.name,
  username: user.username,
  email: user.email,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const lowerUsername = username.toLowerCase();
    const existingUsername = await User.findOne({ username: lowerUsername });
    if (existingUsername) {
      return res.status(409).json({ message: "Username is already taken." });
    }

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ message: "An account with this email already exists." });
    }

    const user = await User.create({ name, username: lowerUsername, email, password });

    return res.status(201).json({
      message: "Registration successful. Please log in.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to register user.", error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      message: "Login successful.",
      token: generateToken(user._id),
      user: buildUserResponse(user),
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to log in.", error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({ user: buildUserResponse(user) });
  } catch (error) {
    return res.status(500).json({ message: "Unable to fetch user.", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
};
