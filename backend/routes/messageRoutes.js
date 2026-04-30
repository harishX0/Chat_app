const express = require("express");

const { getConversation, markMessagesSeen, sendMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:userId", protect, getConversation);
router.post("/", protect, sendMessage);
router.patch("/:userId/seen", protect, markMessagesSeen);

module.exports = router;
