/**
 * Emits a real-time notification to a specific authenticated Pathlog user's room.
 *
 * @param {import('express').Request} req - The Express request containing req.app and req.user
 * @param {object} notification - Notification payload { type, title, message, data? }
 */
export function notifyPathlogUser(req, notification) {
  const io = req.app.get('io');
  if (!io || !req.user?._id) return;

  const payload = {
    id: notification.id || `${notification.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...notification,
    createdAt: new Date().toISOString(),
  };

  io.to(req.user._id.toString()).emit('pathlog:notification', payload);
}

