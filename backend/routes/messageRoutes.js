const express = require("express");

const { getConversation, markMessagesSeen, sendMessage, reactToMessage, unsendMessage } = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/:userId", protect, getConversation);
router.post("/", protect, sendMessage);
router.patch("/:userId/seen", protect, markMessagesSeen);
router.post("/:messageId/react", protect, reactToMessage);
router.delete("/:messageId", protect, unsendMessage);

module.exports = router;
