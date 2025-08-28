import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Simulate some demo notifications
  useEffect(() => {
    const demoNotifications = [
      {
        id: '1',
        type: 'badge',
        title: 'New Badge Earned!',
        message: 'You earned the "Consistent Runner" badge',
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        read: false,
      },
      {
        id: '2',
        type: 'community',
        title: 'Community Update',
        message: 'Sarah completed her 5K goal in Weight Loss LockIn',
        timestamp: new Date(Date.now() - 300000), // 5 minutes ago
        read: false,
      },
    ];

    setTimeout(() => {
      setNotifications(demoNotifications);
      setUnreadCount(2);
    }, 2000);
  }, []);

  const value = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};