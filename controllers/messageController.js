const { db, admin } = require('../config/firebase');

// Get conversation history between two users
exports.getConversation = async (req, res) => {
  try {
    const { userId, friendId } = req.params;
    const participants = [userId, friendId].sort();
    const conversationId = participants.join('_');
    
    const messagesSnapshot = await db.collection('messages')
      .where('conversationId', '==', conversationId)
      .orderBy('timestamp')
      .get();
    
    const messages = [];
    messagesSnapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    
    res.json(messages);
  } catch (error) {
    console.error(error);
  }
};

// Create a new message (backup for socket failure)
exports.createMessage = async (req, res) => {
  try {
    const { senderId, receiverId, text } = req.body;
    
    // Create conversation ID
    const participants = [senderId, receiverId].sort();
    const conversationId = participants.join('_');
    
    // Save message to Firestore
    const newMessage = await db.collection('messages').add({
      conversationId,
      senderId,
      receiverId,
      text,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    });
    
    res.status(201).json({ 
      id: newMessage.id, 
      conversationId, 
      senderId, 
      receiverId, 
      text, 
      timestamp: new Date(),
      read: false
    });
  } catch (error) {
    console.error(error);

  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    
    // Create conversation ID
    const participants = [userId, friendId].sort();
    const conversationId = participants.join('_');
    
    // Find unread messages
    const messagesRef = db.collection('messages');
    const query = messagesRef
      .where('conversationId', '==', conversationId)
      .where('senderId', '==', friendId)
      .where('receiverId', '==', userId)
      .where('read', '==', false);
    
    const unreadMessages = await query.get();
    
    // Batch update to mark messages as read
    const batch = db.batch();
    unreadMessages.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error(error);

  }
};