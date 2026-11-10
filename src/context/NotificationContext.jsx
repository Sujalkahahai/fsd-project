import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { socket } from '../services/socket';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { isAuthenticated, token } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socket.connected) {
        socket.disconnect();
      }
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const handleNotification = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((count) => count + 1);
    };

    const handleConnect = () => {
      console.log('[Socket.IO] Connected to Pathlog server');
    };

    const handleConnectError = (err) => {
      console.warn('[Socket.IO] Connection error:', err.message);
    };

    socket.on('pathlog:notification', handleNotification);
    socket.on('connect', handleConnect);
    socket.on('connect_error', handleConnectError);

    socket.connect();

    return () => {
      socket.off('pathlog:notification', handleNotification);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleConnectError);
      socket.disconnect();
    };
  }, [isAuthenticated, token]);

  const markAllAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAllAsRead,
        clearNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

