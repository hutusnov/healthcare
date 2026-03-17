import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientAPI, paymentAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading } from '../components/common';
import { CreditCard, Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { getApiData, getListData, normalizeAppointment } from '../utils/normalize';

export const Payment = () => {
    const { appointmentId } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAppointment();
    }, [appointmentId]);

    const loadAppointment = async () => {
        try {
            const response = await patientAPI.getAppointments();
            const appointments = getListData(getApiData(response)).map(normalizeAppointment);
            const selected = appointments.find((item) => item.id === appointmentId);

            if (!selected) {
                setError('Khong tim thay lich hen');
                return;
            }

            setAppointment(selected);
        } catch (err) {
            console.error('Loi khi tai lich hen:', err);
            setError('Khong the tai thong tin lich hen');
        } finally {
            setLoading(false);
        }
    };

    const handleMomoPayment = async () => {
        setProcessing(true);
        setError('');

        try {
            const response = await paymentAPI.createMomoPayment(appointmentId);
            const payUrl = getApiData(response)?.payUrl;

            if (payUrl) {
                window.location.href = payUrl;
            } else {
                setError('Khong the tao lien ket thanh toan');
            }
        } catch (err) {
            console.error('Loi thanh toan:', err);
            setError(err.response?.data?.message || 'Khong the khoi tao thanh toan');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Dang tai thong tin thanh toan..." />;
    }

    if (!appointment) {
        return (
            <div className="text-center py-12">
                <Alert type="error" message={error || 'Khong tim thay lich hen'} />
                <Link to="/dashboard/appointments" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
                    ← Quay lai danh sach lich hen
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">Thanh toan</h1>
                <p className="text-gray-400 mt-1">Hoan tat thanh toan de xac nhan lich hen</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <Card>
                <CardHeader>
                    <CardTitle>Chi tiet lich hen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-dark-300 rounded-lg">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold">BS. {appointment.doctor?.fullName || 'Bac si'}</p>
                            <p className="text-primary-400 text-sm">{appointment.doctor?.specialty || appointment.service}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-gray-400 text-xs">Ngay kham</p>
                                <p className="text-white font-medium">
                                    {appointment.scheduledAt ? format(appointment.scheduledAt, 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                            <Clock className="w-5 h-5 text-green-400" />
                            <div>
                                <p className="text-gray-400 text-xs">Gio kham</p>
                                <p className="text-white font-medium">
                                    {appointment.scheduledAt ? format(appointment.scheduledAt, 'HH:mm') : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">Phi kham</span>
                        <span className="text-white">{appointment.paymentAmount.toLocaleString('vi-VN')}d</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">Phi dich vu</span>
                        <span className="text-white">0d</span>
                    </div>
                    <hr className="border-dark-100 my-2" />
                    <div className="flex items-center justify-between py-2">
                        <span className="text-white font-semibold">Tong cong</span>
                        <span className="text-2xl font-bold gradient-text">
                            {appointment.paymentAmount.toLocaleString('vi-VN')}d
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Phuong thuc thanh toan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <button
                        onClick={handleMomoPayment}
                        disabled={processing}
                        className="w-full flex items-center gap-4 p-4 bg-[#ae2070] hover:bg-[#c52583] rounded-lg transition-colors disabled:opacity-50"
                    >
                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                            <span className="text-[#ae2070] font-bold text-lg">M</span>
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-semibold">Vi MoMo</p>
                            <p className="text-white/70 text-sm">Thanh toan qua vi dien tu MoMo</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white" />
                    </button>

                    <button disabled className="w-full flex items-center gap-4 p-4 bg-dark-300 rounded-lg opacity-50 cursor-not-allowed">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-semibold">The tin dung/Ghi no</p>
                            <p className="text-gray-500 text-sm">Sap co</p>
                        </div>
                    </button>
                </CardContent>
            </Card>

            <div className="text-center">
                <Link to="/dashboard/appointments" className="text-gray-400 hover:text-white">
                    ← Quay lai danh sach lich hen
                </Link>
            </div>
        </div>
    );
};
