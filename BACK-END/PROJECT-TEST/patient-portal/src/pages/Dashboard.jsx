import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI, appointmentAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Loading, Alert } from '../components/common';
import {
    Calendar,
    Clock,
    User,
    FileText,
    Bell,
    CalendarPlus,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [appointments, setAppointments] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        upcoming: 0,
        completed: 0,
        cancelled: 0,
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const response = await patientAPI.getAppointments();
            const data = response.data?.data || response.data || [];
            setAppointments(Array.isArray(data) ? data : []);

            // Calculate stats
            const now = new Date();
            setStats({
                total: data.length,
                upcoming: data.filter(a => new Date(a.date) >= now && a.status !== 'CANCELLED').length,
                completed: data.filter(a => a.status === 'COMPLETED').length,
                cancelled: data.filter(a => a.status === 'CANCELLED').length,
            });
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statuses = {
            PENDING: { label: 'Chờ xác nhận', class: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
            CONFIRMED: { label: 'Đã xác nhận', class: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
            COMPLETED: { label: 'Hoàn thành', class: 'bg-green-500/20 text-green-400', icon: CheckCircle },
            CANCELLED: { label: 'Đã hủy', class: 'bg-red-500/20 text-red-400', icon: XCircle },
        };
        const s = statuses[status] || statuses.PENDING;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${s.class}`}>
                <s.icon className="w-3 h-3" />
                {s.label}
            </span>
        );
    };

    if (loading) {
        return <Loading fullScreen text="Đang tải dữ liệu..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Welcome */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">
                        Xin chào, {user?.fullName || 'Bệnh nhân'}! 👋
                    </h1>
                    <p className="text-gray-400 mt-1">
                        {format(new Date(), "EEEE, dd MMMM yyyy", { locale: vi })}
                    </p>
                </div>
                <Link
                    to="/dashboard/book"
                    className="btn-primary flex items-center gap-2"
                >
                    <CalendarPlus className="w-4 h-4" />
                    Đặt lịch khám
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary-600/20 rounded-xl">
                            <Calendar className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Tổng lịch hẹn</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-600/20 rounded-xl">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Sắp tới</p>
                            <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-600/20 rounded-xl">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Hoàn thành</p>
                            <p className="text-2xl font-bold text-white">{stats.completed}</p>
                        </div>
                    </div>
                </Card>

                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-600/20 rounded-xl">
                            <XCircle className="w-6 h-6 text-red-400" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Đã hủy</p>
                            <p className="text-2xl font-bold text-white">{stats.cancelled}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
                <Link to="/dashboard/book" className="card group flex items-center gap-4 hover:border-primary-500">
                    <div className="p-3 bg-primary-600/20 rounded-xl group-hover:bg-primary-600/30 transition-colors">
                        <CalendarPlus className="w-6 h-6 text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Đặt lịch khám</h3>
                        <p className="text-gray-400 text-sm">Chọn bác sĩ và thời gian</p>
                    </div>
                </Link>

                <Link to="/dashboard/profile" className="card group flex items-center gap-4 hover:border-secondary-500">
                    <div className="p-3 bg-secondary-600/20 rounded-xl group-hover:bg-secondary-600/30 transition-colors">
                        <User className="w-6 h-6 text-secondary-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Hồ sơ sức khỏe</h3>
                        <p className="text-gray-400 text-sm">Cập nhật thông tin cá nhân</p>
                    </div>
                </Link>

                <Link to="/dashboard/ocr" className="card group flex items-center gap-4 hover:border-purple-500">
                    <div className="p-3 bg-purple-600/20 rounded-xl group-hover:bg-purple-600/30 transition-colors">
                        <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-medium">Quét đơn thuốc</h3>
                        <p className="text-gray-400 text-sm">Trích xuất thông tin bằng AI</p>
                    </div>
                </Link>
            </div>

            {/* Recent Appointments */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Lịch hẹn gần đây</CardTitle>
                        <Link to="/dashboard/appointments" className="text-primary-400 hover:text-primary-300 text-sm">
                            Xem tất cả →
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {appointments.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Chưa có lịch hẹn nào</p>
                            <Link to="/dashboard/book" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                                Đặt lịch ngay →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {appointments.slice(0, 5).map((apt) => (
                                <div
                                    key={apt.id}
                                    className="flex items-center justify-between p-4 bg-dark-300 rounded-lg hover:bg-dark-100 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                {apt.doctor?.user?.fullName || apt.doctorName || 'Bác sĩ'}
                                            </p>
                                            <p className="text-gray-400 text-sm">
                                                {apt.date ? format(new Date(apt.date), 'dd/MM/yyyy') : ''} - {apt.slot?.startTime || apt.time || ''}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(apt.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
