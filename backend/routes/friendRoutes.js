const express = require("express");
const {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getFriendRequests,
  removeFriend,
} = require("../controllers/friendController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.post("/request", sendFriendRequest);
router.post("/accept", acceptFriendRequest);
router.post("/decline", declineFriendRequest);
router.get("/requests", getFriendRequests);
router.delete("/remove/:friendId", removeFriend);

module.exports = router;
