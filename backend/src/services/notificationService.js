import { Notification } from '../models/Notification.js';

export async function notify({ user, type, title, body, link }) {
  if (!user) return null;
  return Notification.create({ user, type, title, body: body || '', link: link || '' });
}

export async function listForUser(userId, { unreadOnly = false } = {}) {
  const q = { user: userId };
  if (unreadOnly) q.read = false;
  return Notification.find(q).sort({ createdAt: -1 }).limit(50).lean();
}

export async function markRead(userId, id) {
  return Notification.findOneAndUpdate({ _id: id, user: userId }, { $set: { read: true } }, { new: true });
}
