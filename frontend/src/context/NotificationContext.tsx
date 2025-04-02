import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Notification } from '../components/common';

export interface NotificationProps {
  id?: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationProps[];
  addNotification: (notification: NotificationProps) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  // Helper functions for common notifications
  showModelFallback: (originalModel: string, fallbackModel: string) => string;
  showError: (title: string, message: string) => string;
  showSuccess: (title: string, message: string) => string;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationProps[]>([]);

  const addNotification = (notification: NotificationProps): string => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification = { ...notification, id };
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Helper for model fallback notification
  const showModelFallback = (originalModel: string, fallbackModel: string): string => {
    return addNotification({
      title: 'Model Fallback',
      message: `The requested model "${originalModel}" wasn't available. Using "${fallbackModel}" instead.`,
      type: 'warning',
      duration: 7000
    });
  };

  // Helper for error notification
  const showError = (title: string, message: string): string => {
    return addNotification({
      title,
      message,
      type: 'error',
      duration: 0 // No auto-dismiss for errors
    });
  };

  // Helper for success notification
  const showSuccess = (title: string, message: string): string => {
    return addNotification({
      title,
      message,
      type: 'success',
      duration: 3000
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        clearNotifications,
        showModelFallback,
        showError,
        showSuccess
      }}
    >
      {children}
      {/* Render notifications */}
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          title={notification.title}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id as string)}
          isOpen={true}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 