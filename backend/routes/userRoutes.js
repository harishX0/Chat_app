const express = require("express");

const { getUsers, searchUsers } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/search", protect, searchUsers);

module.exports = router;
