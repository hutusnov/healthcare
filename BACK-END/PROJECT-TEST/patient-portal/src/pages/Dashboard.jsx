import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Loading, Alert } from '../components/common';
import {
    Calendar,
    Clock,
    User,
    FileText,
    CalendarPlus,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { getApiData, getListData, normalizeAppointment } from '../utils/normalize';

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
            const data = getListData(getApiData(response)).map(normalizeAppointment);
            setAppointments(data);

            const now = new Date();
            setStats({
                total: data.length,
                upcoming: data.filter((item) => item.scheduledAt && item.scheduledAt >= now && item.status !== 'CANCELLED').length,
                completed: data.filter((item) => item.status === 'COMPLETED').length,
                cancelled: data.filter((item) => item.status === 'CANCELLED').length,
            });
        } catch (err) {
            console.error('Loi khi tai du lieu:', err);
            setError('Khong the tai du lieu. Vui long thu lai.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statuses = {
            PENDING: { label: 'Cho xac nhan', class: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
            CONFIRMED: { label: 'Da xac nhan', class: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
            COMPLETED: { label: 'Hoan thanh', class: 'bg-green-500/20 text-green-400', icon: CheckCircle },
            CANCELLED: { label: 'Da huy', class: 'bg-red-500/20 text-red-400', icon: XCircle },
        };
        const state = statuses[status] || statuses.PENDING;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${state.class}`}>
                <state.icon className="w-3 h-3" />
                {state.label}
            </span>
        );
    };

    if (loading) {
        return <Loading fullScreen text="Dang tai du lieu..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Xin chao, {user?.fullName || 'Benh nhan'}!</h1>
                    <p className="text-gray-400 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale: vi })}</p>
                </div>
                <Link to="/dashboard/book" className="btn-primary flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4" />
                    Dat lich kham
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-primary-600/20 rounded-xl"><Calendar className="w-6 h-6 text-primary-400" /></div><div><p className="text-gray-400 text-sm">Tong lich hen</p><p className="text-2xl font-bold text-white">{stats.total}</p></div></div></Card>
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-blue-600/20 rounded-xl"><Clock className="w-6 h-6 text-blue-400" /></div><div><p className="text-gray-400 text-sm">Sap toi</p><p className="text-2xl font-bold text-white">{stats.upcoming}</p></div></div></Card>
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-green-600/20 rounded-xl"><CheckCircle className="w-6 h-6 text-green-400" /></div><div><p className="text-gray-400 text-sm">Hoan thanh</p><p className="text-2xl font-bold text-white">{stats.completed}</p></div></div></Card>
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-red-600/20 rounded-xl"><XCircle className="w-6 h-6 text-red-400" /></div><div><p className="text-gray-400 text-sm">Da huy</p><p className="text-2xl font-bold text-white">{stats.cancelled}</p></div></div></Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Link to="/dashboard/book" className="card group flex items-center gap-4 hover:border-primary-500">
                    <div className="p-3 bg-primary-600/20 rounded-xl group-hover:bg-primary-600/30 transition-colors"><CalendarPlus className="w-6 h-6 text-primary-400" /></div>
                    <div><h3 className="text-white font-medium">Dat lich kham</h3><p className="text-gray-400 text-sm">Chon bac si va thoi gian</p></div>
                </Link>
                <Link to="/dashboard/profile" className="card group flex items-center gap-4 hover:border-secondary-500">
                    <div className="p-3 bg-secondary-600/20 rounded-xl group-hover:bg-secondary-600/30 transition-colors"><User className="w-6 h-6 text-secondary-400" /></div>
                    <div><h3 className="text-white font-medium">Ho so suc khoe</h3><p className="text-gray-400 text-sm">Cap nhat thong tin ca nhan</p></div>
                </Link>
                <Link to="/dashboard/ocr" className="card group flex items-center gap-4 hover:border-purple-500">
                    <div className="p-3 bg-purple-600/20 rounded-xl group-hover:bg-purple-600/30 transition-colors"><FileText className="w-6 h-6 text-purple-400" /></div>
                    <div><h3 className="text-white font-medium">Quet CCCD</h3><p className="text-gray-400 text-sm">Trich xuat thong tin tu anh giay to</p></div>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Lich hen gan day</CardTitle>
                        <Link to="/dashboard/appointments" className="text-primary-400 hover:text-primary-300 text-sm">Xem tat ca →</Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {appointments.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Chua co lich hen nao</p>
                            <Link to="/dashboard/book" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                                Dat lich ngay →
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {appointments.slice(0, 5).map((appointment) => (
                                <div key={appointment.id} className="flex items-center justify-between p-4 bg-dark-300 rounded-lg hover:bg-dark-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-primary-600/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-primary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">BS. {appointment.doctor?.fullName || 'Bac si'}</p>
                                            <p className="text-gray-400 text-sm">
                                                {appointment.scheduledAt ? format(appointment.scheduledAt, 'dd/MM/yyyy HH:mm') : 'Chua co thoi gian'}
                                            </p>
                                        </div>
                                    </div>
                                    {getStatusBadge(appointment.status)}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
