/**
 * Emits a real-time notification to a specific authenticated Pathlog user's room.
 *
 * @param {import('express').Request} req - The Express request containing req.app and req.user
 * @param {object} notification - Notification payload { type, title, message, data? }
 * @param {string} [recipientUserId] - Optional target user ID (defaults to req.user._id)
 */
export function notifyPathlogUser(req, notification, recipientUserId = null) {
  const io = req.app?.get('io');
  const targetId = recipientUserId || req.user?._id?.toString();
  if (!io || !targetId) return;

  const payload = {
    id: notification.id || `${notification.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...notification,
    createdAt: new Date().toISOString(),
  };

  io.to(targetId).emit('pathlog:notification', payload);
}

/**
 * Broadcasts an activity event to all active participants in a study room.
 */
export function broadcastToRoom(io, roomId, eventName, payload) {
  if (!io || !roomId) return;
  io.to(`room:${roomId}`).emit(eventName, payload);
}
