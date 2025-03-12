const express = require('express');
const messageController = require('../controllers/messageController');
const verifyToken = require("../middlewares/authMiddleware");


const router = express.Router();

// Get conversation history
router.get('/conversations/:userId/:friendId', 
verifyToken, 
  messageController.getConversation
);

// Create a new message (backup for socket failure)
router.post('/', 
verifyToken, 
  messageController.createMessage
);

// Mark messages as read
router.post('/mark-read', 
verifyToken, 
  messageController.markAsRead
);

module.exports = router;