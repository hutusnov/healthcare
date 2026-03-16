import { useState, useEffect } from 'react';
import { notificationAPI } from '../services/api';
import { Card, Loading, Alert } from '../components/common';
import { Bell, Calendar, CreditCard, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        try {
            const response = await notificationAPI.getAll();
            setNotifications(response.data?.data || response.data || []);
        } catch (err) {
            console.error('Lỗi khi tải thông báo:', err);
            setError('Không thể tải thông báo');
        } finally {
            setLoading(false);
        }
    };

    const getIcon = (type) => {
        const icons = {
            APPOINTMENT: Calendar,
            PAYMENT: CreditCard,
            SUCCESS: CheckCircle,
            WARNING: AlertCircle,
            INFO: Info,
        };
        return icons[type] || Bell;
    };

    const getIconColor = (type) => {
        const colors = {
            APPOINTMENT: 'bg-blue-600/20 text-blue-400',
            PAYMENT: 'bg-green-600/20 text-green-400',
            SUCCESS: 'bg-green-600/20 text-green-400',
            WARNING: 'bg-yellow-600/20 text-yellow-400',
            INFO: 'bg-primary-600/20 text-primary-400',
        };
        return colors[type] || 'bg-gray-600/20 text-gray-400';
    };

    if (loading) {
        return <Loading fullScreen text="Đang tải thông báo..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">Thông báo</h1>
                <p className="text-gray-400 mt-1">Cập nhật mới nhất về lịch hẹn và thanh toán</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {notifications.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-xl font-medium mb-2">Chưa có thông báo</h3>
                        <p className="text-gray-400">Bạn sẽ nhận được thông báo khi có cập nhật mới</p>
                    </div>
                </Card>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notif) => {
                        const Icon = getIcon(notif.type);
                        const iconColor = getIconColor(notif.type);

                        return (
                            <Card
                                key={notif.id}
                                className={`${!notif.read ? 'border-l-4 border-l-primary-500' : ''}`}
                            >
                                <div className="flex gap-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className={`font-medium ${!notif.read ? 'text-white' : 'text-gray-300'}`}>
                                                {notif.title || 'Thông báo'}
                                            </h3>
                                            <span className="text-xs text-gray-500 flex-shrink-0">
                                                {notif.createdAt
                                                    ? formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: vi })
                                                    : ''
                                                }
                                            </span>
                                        </div>
                                        <p className="text-gray-400 text-sm mt-1">{notif.message || notif.content}</p>
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
