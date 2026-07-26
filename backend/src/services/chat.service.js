import Conversation from '../models/Conversation.js';
import Application from '../models/Application.js';
import PresenterProfile from '../models/PresenterProfile.js';
import CollegeProfile from '../models/CollegeProfile.js';

export const isParticipant = (conversation, userId) =>
  conversation.participants.some((p) => p.toString() === userId.toString());

export const resolveConversationForApplication = async (applicationId, requestingUserId) => {
  const application = await Application.findById(applicationId)
    .populate('presenter', 'user')
    .populate('college', 'user');

  if (!application) return { error: 'Application not found', code: 404 };

  const presenterUserId = application.presenter.user.toString();
  const collegeUserId = application.college.user.toString();

  const isPresenterSide = presenterUserId === requestingUserId.toString();
  const isCollegeSide = collegeUserId === requestingUserId.toString();

  if (!isPresenterSide && !isCollegeSide) {
    return { error: 'You are not part of this application', code: 403 };
  }

  let conversation = await Conversation.findOne({ application: applicationId });

  if (!conversation) {
    conversation = await Conversation.create({
      application: applicationId,
      participants: [presenterUserId, collegeUserId],
    });
  }

  return { conversation };
};

// In-memory presence map: userId (string) -> Set of socket ids
const onlineUsers = new Map();

export const markUserOnline = (userId, socketId) => {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
};

export const markUserOffline = (userId, socketId) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;
  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true; // fully offline
  }
  return false;
};

export const isUserOnline = (userId) => onlineUsers.has(userId);
