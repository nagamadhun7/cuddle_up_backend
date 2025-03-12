const { Server } = require('socket.io');
const { db, admin } = require('../config/firebase');

// Maps userId to socketId
const userSocketMap = {};

// Initialize Socket.io
exports.initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  // Socket.io connection
  io.on('connection', (socket) => {
    // console.log('User connected:', socket.id);
    
    // User authentication and online status
    socket.on('user_online', (userId) => {
      userSocketMap[userId] = socket.id;
      // console.log(`User ${userId} is online with socket: ${socket.id}`);
      
      // Update user status in Firestore
      updateUserStatus(userId, 'active');
    });
    
    // Handle direct messages
    socket.on('send_direct_message', async (messageData) => {
      try {
        // Create conversation ID (sorted to ensure same ID regardless of sender/receiver order)
        const participants = [messageData.senderId, messageData.receiverId].sort();
        const conversationId = participants.join('_');
        
        // Save message to Firestore
        await db.collection('messages').add({
          conversationId,
          senderId: messageData.senderId,
          receiverId: messageData.receiverId,
          text: messageData.text,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
        
        // Send to receiver if online
        const receiverSocket = userSocketMap[messageData.receiverId];
        if (receiverSocket) {
          io.to(receiverSocket).emit('receive_message', messageData);
          
          // Also update unread count for receiver
          io.to(receiverSocket).emit('unread_count_update', {
            senderId: messageData.senderId,
            count: 1 // Incremental update
          });
        }
        
        // Also send back to sender for confirmation
        socket.emit('message_sent', messageData);
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });
    
    // Mark messages as read
    socket.on('mark_as_read', async (data) => {
      try {
        // Create conversation ID (sorted to ensure same ID regardless of sender/receiver order)
        const participants = [data.userId, data.friendId].sort();
        const conversationId = participants.join('_');
        
        // Update messages in Firestore
        const messagesRef = db.collection('messages');
        const query = messagesRef
          .where('conversationId', '==', conversationId)
          .where('senderId', '==', data.friendId)
          .where('receiverId', '==', data.userId)
          .where('read', '==', false);
        
        const unreadMessages = await query.get();
        
        // Batch update to mark messages as read
        const batch = db.batch();
        unreadMessages.forEach(doc => {
          batch.update(doc.ref, { read: true });
        });
        
        await batch.commit();
        
        // Notify sender their messages were read
        const senderSocket = userSocketMap[data.friendId];
        if (senderSocket) {
          io.to(senderSocket).emit('messages_read', {
            byUserId: data.userId,
            conversationId
          });
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
    
    // User typing indicator
    socket.on('typing', (data) => {
      const receiverSocket = userSocketMap[data.receiverId];
      if (receiverSocket) {
        io.to(receiverSocket).emit('friend_typing', {
          userId: data.senderId,
          isTyping: data.isTyping
        });
      }
    });

     // Friend request events
    socket.on('friend_request_sent', (data) => {
      const receiverSocketId = userSocketMap[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('friend_request_received', {
          senderId: data.senderId
        });
      }
    });

    socket.on('friend_request_accepted', (data) => {
      const senderSocketId = userSocketMap[data.senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit('friend_request_accepted', {
          accepterId: data.accepterId
        });
      }
    });
    
    socket.on('friend_request_declined', (data) => {
      const senderSocketId = userSocketMap[data.senderId];
      if (senderSocketId) {
        io.to(senderSocketId).emit('friend_request_declined', {
          declinerId: data.declinerId
        });
      }
    });
    
    socket.on('friend_request_canceled', (data) => {
      const receiverSocketId = userSocketMap[data.receiverId];
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('friend_request_canceled', {
          senderId: data.senderId
        });
      }
    });
    
    // Disconnect
    socket.on('disconnect', () => {
      // Find which user disconnected
      let disconnectedUserId = null;
      for (const [userId, socketId] of Object.entries(userSocketMap)) {
        if (socketId === socket.id) {
          disconnectedUserId = userId;
          delete userSocketMap[userId];
          break;
        }
      }
      
      if (disconnectedUserId) {
        updateUserStatus(disconnectedUserId, 'inactive');
        console.log(`User ${disconnectedUserId} disconnected`);
      }
    });
  });

  return io;
};

// Helper function to update user status and notify friends
async function updateUserStatus(userId, status) {
  try {
    // Update user status in Firestore
    await db.collection('users').doc(userId).update({
      status: status,
      // lastSeen: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Get user's friends
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();
    
    if (userData && userData.friends) {
      // Notify each online friend about status change
      userData.friends.forEach(friendId => {
        const friendSocketId = userSocketMap[friendId];
        if (friendSocketId) {
          const io = require('socket.io').instance; // Get the singleton instance
          io.to(friendSocketId).emit('friend_status_change', {
            userId,
            status,
            // lastSeen: new Date()
          });
        }
      });
    }
  } catch (error) {
    console.error('Error updating user status:', error);
  }
}