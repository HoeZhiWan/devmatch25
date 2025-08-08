'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { useUserRole } from '../hooks/useUserRole';

interface Notification {
  id: string;
  type: 'pickup' | 'authorization' | 'system' | 'reminder';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  childId?: string;
  childName?: string;
  pickupPersonName?: string;
}

const ParentNotifications: React.FC = () => {
  const { address } = useWallet();
  const { role } = useUserRole(address);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pickup' | 'authorization'>('all');

  // Mock notifications data - in real app, fetch from database
  useEffect(() => {
    const mockNotifications: Notification[] = [
      {
        id: '1',
        type: 'pickup',
        title: 'Pickup Confirmed',
        message: 'Alice Johnson was picked up by Grandma Mary at 3:45 PM',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isRead: false,
        priority: 'high',
        childId: 'STU001',
        childName: 'Alice Johnson',
        pickupPersonName: 'Grandma Mary'
      },
      {
        id: '2',
        type: 'authorization',
        title: 'New Pickup Person Authorized',
        message: 'Uncle John has been authorized to pick up Bob Smith until June 30, 2024',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
        priority: 'medium',
        childId: 'STU002',
        childName: 'Bob Smith',
        pickupPersonName: 'Uncle John'
      },
      {
        id: '3',
        type: 'reminder',
        title: 'Authorization Expiring Soon',
        message: 'Grandma Mary\'s authorization for Alice Johnson expires in 3 days',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isRead: false,
        priority: 'medium',
        childId: 'STU001',
        childName: 'Alice Johnson',
        pickupPersonName: 'Grandma Mary'
      },
      {
        id: '4',
        type: 'system',
        title: 'System Maintenance',
        message: 'Scheduled maintenance on Sunday, 2:00-4:00 AM. Service may be temporarily unavailable.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isRead: true,
        priority: 'low'
      }
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, []);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const getFilteredNotifications = () => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.isRead);
      case 'pickup':
        return notifications.filter(n => n.type === 'pickup');
      case 'authorization':
        return notifications.filter(n => n.type === 'authorization');
      default:
        return notifications;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pickup':
        return '👶';
      case 'authorization':
        return '🔑';
      case 'reminder':
        return '⏰';
      case 'system':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-slate-600">Loading notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <span className="text-white text-xl">🔔</span>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-slate-900">Notifications</h3>
          <p className="text-slate-600">Stay updated with pickup and authorization alerts</p>
        </div>
        {unreadCount > 0 && (
          <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
            {unreadCount} new
          </div>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'unread'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('pickup')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'pickup'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Pickup ({notifications.filter(n => n.type === 'pickup').length})
        </button>
        <button
          onClick={() => setFilter('authorization')}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            filter === 'authorization'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Authorization ({notifications.filter(n => n.type === 'authorization').length})
        </button>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            Mark All Read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {getFilteredNotifications().length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔕</div>
            <h4 className="text-xl font-semibold text-slate-700 mb-2">No notifications</h4>
            <p className="text-slate-500">
              {filter === 'all' 
                ? 'You\'re all caught up! No notifications to show.'
                : `No ${filter} notifications to show.`
              }
            </p>
          </div>
        ) : (
          getFilteredNotifications().map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
                notification.isRead 
                  ? 'border-slate-200 opacity-75' 
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-lg">{getTypeIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-semibold text-slate-900">
                        {notification.title}
                      </h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                    <p className="text-slate-600 mb-3">{notification.message}</p>
                    {notification.childName && (
                      <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
                        <span>👶 {notification.childName}</span>
                        {notification.pickupPersonName && (
                          <span>👤 {notification.pickupPersonName}</span>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-slate-400">
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-xs font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notification Settings */}
      <div className="mt-8 pt-6 border-t border-slate-200">
        <h4 className="text-lg font-semibold text-slate-900 mb-4">Notification Settings</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Pickup Confirmations</div>
              <div className="text-sm text-slate-600">Get notified when your child is picked up</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Authorization Updates</div>
              <div className="text-sm text-slate-600">Notifications about pickup person authorizations</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">Expiration Reminders</div>
              <div className="text-sm text-slate-600">Get reminded before authorizations expire</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <div className="font-medium text-slate-900">System Updates</div>
              <div className="text-sm text-slate-600">Important system maintenance and updates</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentNotifications;
