import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { patientAPI, appointmentAPI } from '../services/api';
import { Card, Button, Loading, Alert } from '../components/common';
import {
    Calendar,
    Clock,
    User,
    MapPin,
    CheckCircle,
    XCircle,
    AlertCircle,
    CreditCard,
    FileText,
    ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Appointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const response = await patientAPI.getAppointments();
            setAppointments(response.data?.data || response.data || []);
        } catch (err) {
            console.error('Lỗi khi tải lịch hẹn:', err);
            setError('Không thể tải danh sách lịch hẹn');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Bạn có chắc chắn muốn hủy lịch hẹn này?')) return;

        setCancelling(id);
        try {
            await appointmentAPI.cancel(id);
            loadAppointments();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể hủy lịch hẹn');
        } finally {
            setCancelling(null);
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
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${s.class}`}>
                <s.icon className="w-3 h-3" />
                {s.label}
            </span>
        );
    };

    const getPaymentBadge = (paymentStatus) => {
        const statuses = {
            PENDING: { label: 'Chưa thanh toán', class: 'text-yellow-400' },
            PAID: { label: 'Đã thanh toán', class: 'text-green-400' },
            REFUNDED: { label: 'Đã hoàn tiền', class: 'text-gray-400' },
        };
        const s = statuses[paymentStatus] || statuses.PENDING;
        return <span className={`text-xs ${s.class}`}>{s.label}</span>;
    };

    const filteredAppointments = appointments.filter((apt) => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') {
            return new Date(apt.date) >= new Date() && apt.status !== 'CANCELLED';
        }
        if (filter === 'completed') return apt.status === 'COMPLETED';
        if (filter === 'cancelled') return apt.status === 'CANCELLED';
        return true;
    });

    if (loading) {
        return <Loading fullScreen text="Đang tải lịch hẹn..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Lịch hẹn của tôi</h1>
                    <p className="text-gray-400 mt-1">Xem và quản lý các lịch hẹn khám bệnh</p>
                </div>
                <Link to="/dashboard/book">
                    <Button>
                        <Calendar className="w-4 h-4 mr-2" />
                        Đặt lịch mới
                    </Button>
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: 'all', label: 'Tất cả' },
                    { value: 'upcoming', label: 'Sắp tới' },
                    { value: 'completed', label: 'Hoàn thành' },
                    { value: 'cancelled', label: 'Đã hủy' },
                ].map((f) => (
                    <button
                        key={f.value}
                        onClick={() => setFilter(f.value)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${filter === f.value
                                ? 'bg-primary-600 text-white'
                                : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                            }`}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Appointments List */}
            {filteredAppointments.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-xl font-medium mb-2">Chưa có lịch hẹn nào</h3>
                        <p className="text-gray-400 mb-4">Đặt lịch khám ngay để được chăm sóc sức khỏe</p>
                        <Link to="/dashboard/book">
                            <Button>Đặt lịch ngay</Button>
                        </Link>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map((apt) => (
                        <Card key={apt.id} className="hover:border-primary-500/50">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                {/* Doctor Info */}
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-xl">
                                            {(apt.doctor?.user?.fullName || apt.doctorName || 'B')[0]}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">
                                            BS. {apt.doctor?.user?.fullName || apt.doctorName || 'Bác sĩ'}
                                        </h3>
                                        <p className="text-primary-400 text-sm">
                                            {apt.doctor?.specialty || apt.specialty || 'Đa khoa'}
                                        </p>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{apt.doctor?.hospital || 'Phòng khám UIT Healthcare'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="flex items-center gap-6 lg:justify-end">
                                    <div className="text-center">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Ngày khám</span>
                                        </div>
                                        <p className="text-white font-medium">
                                            {apt.date ? format(new Date(apt.date), 'dd/MM/yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span>Giờ khám</span>
                                        </div>
                                        <p className="text-white font-medium">
                                            {apt.slot?.startTime || apt.time || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex flex-col items-end gap-2">
                                    {getStatusBadge(apt.status)}
                                    {getPaymentBadge(apt.paymentStatus)}

                                    <div className="flex gap-2 mt-2">
                                        {apt.status === 'PENDING' && apt.paymentStatus !== 'PAID' && (
                                            <Link to={`/dashboard/payment/${apt.id}`}>
                                                <Button size="sm" variant="secondary">
                                                    <CreditCard className="w-4 h-4 mr-1" />
                                                    Thanh toán
                                                </Button>
                                            </Link>
                                        )}
                                        {(apt.status === 'PENDING' || apt.status === 'CONFIRMED') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300"
                                                onClick={() => handleCancel(apt.id)}
                                                loading={cancelling === apt.id}
                                            >
                                                Hủy lịch
                                            </Button>
                                        )}
                                        {apt.status === 'COMPLETED' && (
                                            <Button size="sm" variant="ghost">
                                                <FileText className="w-4 h-4 mr-1" />
                                                Xem kết quả
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
