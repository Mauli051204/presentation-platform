import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { socketAuthMiddleware } from './socketAuth.js';
import {
  isParticipant,
  markUserOnline,
  markUserOffline,
  isUserOnline,
} from '../services/chat.service.js';

const CONVERSATION_ROOM = (id) => `conversation:${id}`;
const USER_ROOM = (id) => `user:${id}`;

export const initSockets = (io) => {
  io.use(socketAuthMiddleware);

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`[socket] Connected: ${socket.id} (user: ${userId})`);

    socket.join(USER_ROOM(userId));
    const wasOffline = !isUserOnline(userId);
    markUserOnline(userId, socket.id);

    if (wasOffline) {
      socket.broadcast.emit('user_online', { userId });
    }

    // On-demand presence check — used when a chat UI opens a conversation
    // and needs to know the OTHER participant's current online status
    // immediately, rather than waiting for the next broadcast event (which
    // only fires on state *changes*, not on request).
    socket.on('get_online_status', ({ userId: targetUserId }, callback) => {
      callback?.({ success: true, isOnline: isUserOnline(targetUserId) });
    });

    socket.on('join_conversation', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !isParticipant(conversation, userId)) {
          return callback?.({ success: false, message: 'Not authorized for this conversation' });
        }
        socket.join(CONVERSATION_ROOM(conversationId));
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on('send_message', async ({ conversationId, content }, callback) => {
      try {
        if (!content || !content.trim()) {
          return callback?.({ success: false, message: 'Message content cannot be empty' });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !isParticipant(conversation, userId)) {
          return callback?.({ success: false, message: 'Not authorized for this conversation' });
        }

        const message = await Message.create({
          conversation: conversationId,
          sender: userId,
          content: content.trim(),
          readBy: [userId],
        });

        conversation.lastMessage = content.trim().slice(0, 200);
        conversation.lastMessageAt = new Date();
        await conversation.save();

        const populatedMessage = await message.populate('sender', 'name role');

        io.to(CONVERSATION_ROOM(conversationId)).emit('new_message', populatedMessage);

        conversation.participants.forEach((participantId) => {
          io.to(USER_ROOM(participantId.toString())).emit('conversation_updated', {
            conversationId,
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
          });
        });

        callback?.({ success: true, data: populatedMessage });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on('typing', ({ conversationId }) => {
      socket.to(CONVERSATION_ROOM(conversationId)).emit('typing', { conversationId, userId });
    });

    socket.on('stop_typing', ({ conversationId }) => {
      socket.to(CONVERSATION_ROOM(conversationId)).emit('stop_typing', { conversationId, userId });
    });

    socket.on('mark_read', async ({ conversationId }, callback) => {
      try {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !isParticipant(conversation, userId)) {
          return callback?.({ success: false, message: 'Not authorized for this conversation' });
        }

        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: userId }, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );

        io.to(CONVERSATION_ROOM(conversationId)).emit('messages_read', {
          conversationId,
          readerId: userId,
        });
        callback?.({ success: true });
      } catch (error) {
        callback?.({ success: false, message: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] Disconnected: ${socket.id} (user: ${userId})`);
      const fullyOffline = markUserOffline(userId, socket.id);
      if (fullyOffline) {
        socket.broadcast.emit('user_offline', { userId });
      }
    });
  });
};
