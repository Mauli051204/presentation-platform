import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import { resolveConversationForApplication, isParticipant } from '../services/chat.service.js';

export const getOrCreateConversation = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const result = await resolveConversationForApplication(applicationId, req.user._id);

    if (result.error) {
      return next(new ApiError(result.code, result.error));
    }

    return res.status(200).json(new ApiResponse(200, result.conversation, 'Conversation ready'));
  } catch (error) {
    next(error);
  }
};

export const listMyConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name role')
      .populate({
        path: 'application',
        select: 'requirement status',
        populate: { path: 'requirement', select: 'title' },
      })
      .sort({ lastMessageAt: -1, createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, conversations, 'Conversations fetched'));
  } catch (error) {
    next(error);
  }
};

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const skip = (page - 1) * limit;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return next(new ApiError(404, 'Conversation not found'));
    if (!isParticipant(conversation, req.user._id)) {
      return next(new ApiError(403, 'You are not part of this conversation'));
    }

    const [messages, total] = await Promise.all([
      Message.find({ conversation: conversationId })
        .populate('sender', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: conversationId }),
    ]);

    return res.status(200).json(
      new ApiResponse(200, messages.reverse(), 'Messages fetched', {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      })
    );
  } catch (error) {
    next(error);
  }
};

export const markConversationRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) return next(new ApiError(404, 'Conversation not found'));
    if (!isParticipant(conversation, req.user._id)) {
      return next(new ApiError(403, 'You are not part of this conversation'));
    }

    await Message.updateMany(
      {
        conversation: conversationId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id },
      },
      { $addToSet: { readBy: req.user._id } }
    );

    return res.status(200).json(new ApiResponse(200, null, 'Conversation marked as read'));
  } catch (error) {
    next(error);
  }
};
