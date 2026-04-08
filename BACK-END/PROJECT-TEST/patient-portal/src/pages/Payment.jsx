import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { patientAPI, paymentAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading } from '../components/common';
import { CreditCard, Calendar, Clock, User, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { getApiData, getListData, normalizeAppointment } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

export const Payment = () => {
    const { language } = useUI();
    const { appointmentId } = useParams();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

        const text = language === 'vi'
                ? {
                        notFound: 'Không tìm thấy lịch hẹn',
                        loadError: 'Không thể tải thông tin lịch hẹn',
                        payLinkError: 'Không thể tạo liên kết thanh toán',
                        payInitError: 'Không thể khởi tạo thanh toán',
                        loading: 'Đang tải thông tin thanh toán...',
                        backToAppointments: '← Quay lại danh sách lịch hẹn',
                        title: 'Thanh toán',
                        subtitle: 'Hoàn tất thanh toán để xác nhận lịch hẹn',
                        detail: 'Chi tiết lịch hẹn',
                        doctor: 'Bác sĩ',
                        date: 'Ngày khám',
                        time: 'Giờ khám',
                        consultationFee: 'Phí khám',
                        serviceFee: 'Phí dịch vụ',
                        total: 'Tổng cộng',
                        paymentMethod: 'Phương thức thanh toán',
                        momoName: 'Ví MoMo',
                        momoDesc: 'Thanh toán qua ví điện tử MoMo',
                        cardName: 'Thẻ tín dụng/Ghi nợ',
                        cardSoon: 'Sắp có',
                    }
                : {
                        notFound: 'Appointment not found',
                        loadError: 'Unable to load appointment details',
                        payLinkError: 'Unable to create payment link',
                        payInitError: 'Unable to initialize payment',
                        loading: 'Loading payment information...',
                        backToAppointments: '← Back to appointments',
                        title: 'Payment',
                        subtitle: 'Complete payment to confirm your appointment',
                        detail: 'Appointment details',
                        doctor: 'Doctor',
                        date: 'Date',
                        time: 'Time',
                        consultationFee: 'Consultation fee',
                        serviceFee: 'Service fee',
                        total: 'Total',
                        paymentMethod: 'Payment method',
                        momoName: 'MoMo Wallet',
                        momoDesc: 'Pay via MoMo e-wallet',
                        cardName: 'Credit/Debit card',
                        cardSoon: 'Coming soon',
                    };

        const currency = (amount) => `${Number(amount || 0).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ`;

    useEffect(() => {
        loadAppointment();
    }, [appointmentId]);

    const loadAppointment = async () => {
        try {
            const response = await patientAPI.getAppointments();
            const appointments = getListData(getApiData(response)).map(normalizeAppointment);
            const selected = appointments.find((item) => item.id === appointmentId);

            if (!selected) {
                setError(text.notFound);
                return;
            }

            setAppointment(selected);
        } catch (err) {
            console.error('Lỗi khi tải lịch hẹn:', err);
            setError(text.loadError);
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
                setError(text.payLinkError);
            }
        } catch (err) {
            console.error('Lỗi thanh toán:', err);
            setError(err.response?.data?.message || text.payInitError);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text={text.loading} />;
    }

    if (!appointment) {
        return (
            <div className="text-center py-12">
                <Alert type="error" message={error || text.notFound} />
                <Link to="/dashboard/appointments" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
                    {text.backToAppointments}
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">{text.title}</h1>
                <p className="text-gray-400 mt-1">{text.subtitle}</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            <Card>
                <CardHeader>
                    <CardTitle>{text.detail}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-dark-300 rounded-lg">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold">BS. {appointment.doctor?.fullName || text.doctor}</p>
                            <p className="text-primary-400 text-sm">{appointment.doctor?.specialty || appointment.service}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-gray-400 text-xs">{text.date}</p>
                                <p className="text-white font-medium">
                                    {appointment.scheduledAt ? format(appointment.scheduledAt, 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                            <Clock className="w-5 h-5 text-green-400" />
                            <div>
                                <p className="text-gray-400 text-xs">{text.time}</p>
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
                        <span className="text-gray-400">{text.consultationFee}</span>
                        <span className="text-white">{currency(appointment.paymentAmount)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">{text.serviceFee}</span>
                        <span className="text-white">0d</span>
                    </div>
                    <hr className="border-dark-100 my-2" />
                    <div className="flex items-center justify-between py-2">
                        <span className="text-white font-semibold">{text.total}</span>
                        <span className="text-2xl font-bold gradient-text">
                            {currency(appointment.paymentAmount)}
                        </span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{text.paymentMethod}</CardTitle>
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
                            <p className="text-white font-semibold">{text.momoName}</p>
                            <p className="text-white/70 text-sm">{text.momoDesc}</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white" />
                    </button>

                    <button disabled className="w-full flex items-center gap-4 p-4 bg-dark-300 rounded-lg opacity-50 cursor-not-allowed">
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-semibold">{text.cardName}</p>
                            <p className="text-gray-500 text-sm">{text.cardSoon}</p>
                        </div>
                    </button>
                </CardContent>
            </Card>

            <div className="text-center">
                <Link to="/dashboard/appointments" className="text-gray-400 hover:text-white">
                    {text.backToAppointments}
                </Link>
            </div>
        </div>
    );
};
