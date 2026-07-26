import Notification from '../models/Notification.js';
import { sendEmail } from '../utils/sendEmail.js';

const USER_ROOM = (id) => `user:${id}`;

export const createNotification = async (
  io,
  { userId, type, title, message, meta = {}, email = null }
) => {
  const notification = await Notification.create({ user: userId, type, title, message, meta });

  if (io) {
    io.to(USER_ROOM(userId.toString())).emit('notification', notification);
  }

  if (email?.to) {
    try {
      await sendEmail({
        to: email.to,
        subject: title,
        html: `<p>${message}</p>`,
      });
    } catch (error) {
      console.error(`[notification] Email send failed: ${error.message}`);
    }
  }

  return notification;
};
