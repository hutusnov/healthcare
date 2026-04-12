import { useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../services/api';
import { Card, Loading, Alert } from '../components/common';
import { Bell, Calendar, CreditCard, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { getApiData, getListData, normalizeNotification } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

export const Notifications = () => {
  const { language } = useUI();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const text =
    language === 'vi'
      ? {
          loading: 'Đang tải thông báo...',
          title: 'Thông báo',
          subtitle: 'Cập nhật mới nhất về lịch hẹn và thanh toán',
          emptyTitle: 'Chưa có thông báo',
          emptyDesc: 'Bạn sẽ nhận được thông báo khi có cập nhật mới',
          defaultTitle: 'Thông báo',
          loadError: 'Không thể tải thông báo',
        }
      : {
          loading: 'Loading notifications...',
          title: 'Notifications',
          subtitle: 'Latest updates about appointments and payments',
          emptyTitle: 'No notifications yet',
          emptyDesc: 'You will receive notifications when there are new updates',
          defaultTitle: 'Notification',
          loadError: 'Unable to load notifications',
        };

  const locale = language === 'vi' ? vi : enUS;

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await notificationAPI.getAll();
      const data = getListData(getApiData(response)).map(normalizeNotification);
      setNotifications(data);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError(text.loadError);
    } finally {
      setLoading(false);
    }
  }, [text.loadError]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const getIcon = (type) => {
    const icons = {
      APPOINTMENT_NEW: Calendar,
      APPOINTMENT_CANCELLED: AlertCircle,
      APPOINTMENT_REMINDER: Calendar,
      PAYMENT_SUCCESS: CreditCard,
      SUCCESS: CheckCircle,
      WARNING: AlertCircle,
      INFO: Info,
    };
    return icons[type] || Bell;
  };

  const getIconColor = (type) => {
    const colors = {
      APPOINTMENT_NEW: 'bg-blue-600/20 text-blue-400',
      APPOINTMENT_CANCELLED: 'bg-red-600/20 text-red-400',
      APPOINTMENT_REMINDER: 'bg-blue-600/20 text-blue-400',
      PAYMENT_SUCCESS: 'bg-green-600/20 text-green-400',
      SUCCESS: 'bg-green-600/20 text-green-400',
      WARNING: 'bg-yellow-600/20 text-yellow-400',
      INFO: 'bg-primary-600/20 text-primary-400',
    };
    return colors[type] || 'bg-gray-600/20 text-gray-400';
  };

  if (loading) return <Loading fullScreen text={text.loading} />;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-white">{text.title}</h1>
        <p className="text-gray-400 mt-1">{text.subtitle}</p>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {notifications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl font-medium mb-2">{text.emptyTitle}</h3>
            <p className="text-gray-400">{text.emptyDesc}</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = getIcon(notification.type);
            const iconColor = getIconColor(notification.type);

            return (
              <Card
                key={notification.id}
                className={`${!notification.isRead ? 'border-l-4 border-l-primary-500' : ''}`}
              >
                <div className="flex gap-4">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${!notification.isRead ? 'text-white' : 'text-gray-300'}`}>
                        {notification.title || text.defaultTitle}
                      </h3>

                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {notification.createdAt
                          ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale })
                          : ''}
                      </span>
                    </div>

                    <p className="text-gray-400 text-sm mt-1">{notification.content}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
