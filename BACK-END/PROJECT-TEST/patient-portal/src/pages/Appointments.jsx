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
} from 'lucide-react';
import { format } from 'date-fns';
import { getApiData, getListData, normalizeAppointment } from '../utils/normalize';

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
            const data = getListData(getApiData(response)).map(normalizeAppointment);
            setAppointments(data);
        } catch (err) {
            console.error('Loi khi tai lich hen:', err);
            setError('Khong the tai danh sach lich hen');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        if (!confirm('Ban co chac chan muon huy lich hen nay?')) return;

        setCancelling(id);
        try {
            await appointmentAPI.cancel(id, 'Cancelled by patient from portal');
            await loadAppointments();
        } catch (err) {
            setError(err.response?.data?.message || 'Khong the huy lich hen');
        } finally {
            setCancelling(null);
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
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${state.class}`}>
                <state.icon className="w-3 h-3" />
                {state.label}
            </span>
        );
    };

    const getPaymentBadge = (paymentStatus) => {
        const statuses = {
            UNPAID: { label: 'Chua thanh toan', class: 'text-yellow-400' },
            REQUIRES_PAYMENT: { label: 'Can thanh toan', class: 'text-yellow-400' },
            PAID: { label: 'Da thanh toan', class: 'text-green-400' },
            REFUNDED: { label: 'Da hoan tien', class: 'text-gray-400' },
            FAILED: { label: 'Thanh toan loi', class: 'text-red-400' },
        };
        const state = statuses[paymentStatus] || statuses.UNPAID;
        return <span className={`text-xs ${state.class}`}>{state.label}</span>;
    };

    const filteredAppointments = appointments.filter((appointment) => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') {
            return appointment.scheduledAt && appointment.scheduledAt >= new Date() && appointment.status !== 'CANCELLED';
        }
        if (filter === 'completed') return appointment.status === 'COMPLETED';
        if (filter === 'cancelled') return appointment.status === 'CANCELLED';
        return true;
    });

    if (loading) {
        return <Loading fullScreen text="Dang tai lich hen..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Lich hen cua toi</h1>
                    <p className="text-gray-400 mt-1">Xem va quan ly cac lich hen kham benh</p>
                </div>
                <Link to="/dashboard/book">
                    <Button>
                        <Calendar className="w-4 h-4 mr-2" />
                        Dat lich moi
                    </Button>
                </Link>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                    { value: 'all', label: 'Tat ca' },
                    { value: 'upcoming', label: 'Sap toi' },
                    { value: 'completed', label: 'Hoan thanh' },
                    { value: 'cancelled', label: 'Da huy' },
                ].map((item) => (
                    <button
                        key={item.value}
                        onClick={() => setFilter(item.value)}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${filter === item.value
                            ? 'bg-primary-600 text-white'
                            : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                            }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {filteredAppointments.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-xl font-medium mb-2">Chua co lich hen nao</h3>
                        <p className="text-gray-400 mb-4">Dat lich kham ngay de duoc cham soc suc khoe</p>
                        <Link to="/dashboard/book"><Button>Dat lich ngay</Button></Link>
                    </div>
                </Card>
            ) : (
                <div className="space-y-4">
                    {filteredAppointments.map((appointment) => (
                        <Card key={appointment.id} className="hover:border-primary-500/50">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-bold text-xl">{appointment.doctor?.fullName?.[0] || 'B'}</span>
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold">BS. {appointment.doctor?.fullName || 'Bac si'}</h3>
                                        <p className="text-primary-400 text-sm">{appointment.doctor?.specialty || appointment.service}</p>
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
                                            <MapPin className="w-3 h-3" />
                                            <span>{appointment.doctor?.clinicName || 'Phong kham UIT Healthcare'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 lg:justify-end">
                                    <div className="text-center">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                            <Calendar className="w-4 h-4" />
                                            <span>Ngay kham</span>
                                        </div>
                                        <p className="text-white font-medium">
                                            {appointment.scheduledAt ? format(appointment.scheduledAt, 'dd/MM/yyyy') : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                                            <Clock className="w-4 h-4" />
                                            <span>Gio kham</span>
                                        </div>
                                        <p className="text-white font-medium">
                                            {appointment.scheduledAt ? format(appointment.scheduledAt, 'HH:mm') : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    {getStatusBadge(appointment.status)}
                                    {getPaymentBadge(appointment.paymentStatus)}

                                    <div className="flex gap-2 mt-2">
                                        {appointment.paymentStatus === 'REQUIRES_PAYMENT' && appointment.status === 'PENDING' && (
                                            <Link to={`/dashboard/payment/${appointment.id}`}>
                                                <Button size="sm" variant="secondary">
                                                    <CreditCard className="w-4 h-4 mr-1" />
                                                    Thanh toan
                                                </Button>
                                            </Link>
                                        )}
                                        {(appointment.status === 'PENDING' || appointment.status === 'CONFIRMED') && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300"
                                                onClick={() => handleCancel(appointment.id)}
                                                loading={cancelling === appointment.id}
                                            >
                                                Huy lich
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
