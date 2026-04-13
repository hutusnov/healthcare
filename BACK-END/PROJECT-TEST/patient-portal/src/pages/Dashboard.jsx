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
import { vi, enUS } from 'date-fns/locale';
import { getApiData, getListData, normalizeAppointment } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

export const Dashboard = () => {
    const { language } = useUI();
    const { user } = useAuth();
            const text = language === 'vi'
                    ? {
                            loading: 'Đang tải dữ liệu...',
                            hello: 'Xin chào',
                            patient: 'Bệnh nhân',
                            book: 'Đặt lịch khám',
                            total: 'Tổng lịch hẹn',
                            upcoming: 'Sắp tới',
                            completed: 'Hoàn thành',
                            cancelled: 'Đã hủy',
                            healthProfile: 'Hồ sơ sức khỏe',
                            healthProfileDesc: 'Cập nhật thông tin cá nhân',
                            ocr: 'Quét CCCD',
                            ocrDesc: 'Trích xuất thông tin từ ảnh giấy tờ',
                            recent: 'Lịch hẹn gần đây',
                            viewAll: 'Xem tất cả →',
                            empty: 'Chưa có lịch hẹn nào',
                            bookNow: 'Đặt lịch ngay →',
                            noTime: 'Chưa có thời gian',
                            doctor: 'Bác sĩ',
                        }
                    : {
                            loading: 'Loading data...',
                            hello: 'Hello',
                            patient: 'Patient',
                            book: 'Book appointment',
                            total: 'Total appointments',
                            upcoming: 'Upcoming',
                            completed: 'Completed',
                            cancelled: 'Cancelled',
                            healthProfile: 'Health profile',
                            healthProfileDesc: 'Update personal information',
                            ocr: 'ID OCR Scan',
                            ocrDesc: 'Extract information from document images',
                            recent: 'Recent appointments',
                            viewAll: 'View all →',
                            empty: 'No appointments yet',
                            bookNow: 'Book now →',
                            noTime: 'No scheduled time',
                            doctor: 'Doctor',
                        };

            const locale = language === 'vi' ? vi : enUS;

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
        const state = statuses[status] || statuses.PENDING;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${state.class}`}>
                <state.icon className="w-3 h-3" />
                {state.label}
            </span>
        );
    };

    if (loading) {
        return <Loading fullScreen text={text.loading} />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">{text.hello}, {user?.fullName || text.patient}!</h1>
                    <p className="text-gray-400 mt-1">{format(new Date(), 'EEEE, dd MMMM yyyy', { locale })}</p>
                </div>
                <Link to="/dashboard/book" className="btn-primary flex items-center gap-2">
                    <CalendarPlus className="w-4 h-4" />
                    {text.book}
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-primary-600/20 rounded-xl"><Calendar className="w-6 h-6 text-primary-400" /></div><div><p className="text-gray-400 text-sm">{text.total}</p><p className="text-2xl font-bold text-white">{stats.total}</p></div></div></Card>
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-blue-600/20 rounded-xl"><Clock className="w-6 h-6 text-blue-400" /></div><div><p className="text-gray-400 text-sm">{text.upcoming}</p><p className="text-2xl font-bold text-white">{stats.upcoming}</p></div></div></Card>
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-green-600/20 rounded-xl"><CheckCircle className="w-6 h-6 text-green-400" /></div><div><p className="text-gray-400 text-sm">{text.completed}</p><p className="text-2xl font-bold text-white">{stats.completed}</p></div></div></Card>
                <Card><div className="flex items-center gap-4"><div className="p-3 bg-red-600/20 rounded-xl"><XCircle className="w-6 h-6 text-red-400" /></div><div><p className="text-gray-400 text-sm">{text.cancelled}</p><p className="text-2xl font-bold text-white">{stats.cancelled}</p></div></div></Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
                <Link to="/dashboard/book" className="card group flex items-center gap-4 hover:border-primary-500">
                    <div className="p-3 bg-primary-600/20 rounded-xl group-hover:bg-primary-600/30 transition-colors"><CalendarPlus className="w-6 h-6 text-primary-400" /></div>
                    <div><h3 className="text-white font-medium">{text.book}</h3><p className="text-gray-400 text-sm">{language === 'vi' ? 'Chọn bác sĩ và thời gian' : 'Choose doctor and schedule'}</p></div>
                </Link>
                <Link to="/dashboard/profile" className="card group flex items-center gap-4 hover:border-secondary-500">
                    <div className="p-3 bg-secondary-600/20 rounded-xl group-hover:bg-secondary-600/30 transition-colors"><User className="w-6 h-6 text-secondary-400" /></div>
                    <div><h3 className="text-white font-medium">{text.healthProfile}</h3><p className="text-gray-400 text-sm">{text.healthProfileDesc}</p></div>
                </Link>
                <Link to="/dashboard/ocr" className="card group flex items-center gap-4 hover:border-purple-500">
                    <div className="p-3 bg-purple-600/20 rounded-xl group-hover:bg-purple-600/30 transition-colors"><FileText className="w-6 h-6 text-purple-400" /></div>
                    <div><h3 className="text-white font-medium">{text.ocr}</h3><p className="text-gray-400 text-sm">{text.ocrDesc}</p></div>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>{text.recent}</CardTitle>
                        <Link to="/dashboard/appointments" className="text-primary-400 hover:text-primary-300 text-sm">{text.viewAll}</Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {appointments.length === 0 ? (
                        <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">{text.empty}</p>
                            <Link to="/dashboard/book" className="text-primary-400 hover:text-primary-300 text-sm mt-2 inline-block">
                                {text.bookNow}
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
                                            <p className="text-white font-medium">BS. {appointment.doctor?.fullName || text.doctor}</p>
                                            <p className="text-gray-400 text-sm">
                                                {appointment.scheduledAt ? format(appointment.scheduledAt, 'dd/MM/yyyy HH:mm') : text.noTime}
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
