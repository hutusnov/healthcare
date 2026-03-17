import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientAPI, paymentAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading } from '../components/common';
import { CreditCard, Calendar, Clock, User, CheckCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const Payment = () => {
    const { appointmentId } = useParams();
    const navigate = useNavigate();
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
            const appointments = response.data?.data || response.data || [];
            const apt = appointments.find(a => a.id === parseInt(appointmentId));

            if (!apt) {
                setError('Không tìm thấy lịch hẹn');
                return;
            }

            setAppointment(apt);
        } catch (err) {
            console.error('Lỗi khi tải lịch hẹn:', err);
            setError('Không thể tải thông tin lịch hẹn');
        } finally {
            setLoading(false);
        }
    };

    const handleMomoPayment = async () => {
        setProcessing(true);
        setError('');

        try {
            const response = await paymentAPI.createMomoPayment(appointmentId);
            const payUrl = response.data?.data?.payUrl || response.data?.payUrl;

            if (payUrl) {
                window.location.href = payUrl;
            } else {
                setError('Không thể tạo liên kết thanh toán');
            }
        } catch (err) {
            console.error('Lỗi thanh toán:', err);
            setError(err.response?.data?.message || 'Không thể khởi tạo thanh toán');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Đang tải thông tin thanh toán..." />;
    }

    if (!appointment) {
        return (
            <div className="text-center py-12">
                <Alert type="error" message={error || 'Không tìm thấy lịch hẹn'} />
                <Link to="/dashboard/appointments" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
                    ← Quay lại danh sách lịch hẹn
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">Thanh toán</h1>
                <p className="text-gray-400 mt-1">Hoàn tất thanh toán để xác nhận lịch hẹn</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}

            {/* Order Summary */}
            <Card>
                <CardHeader>
                    <CardTitle>Chi tiết lịch hẹn</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-dark-300 rounded-lg">
                        <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <User className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-semibold">
                                BS. {appointment.doctor?.user?.fullName || appointment.doctorName || 'Bác sĩ'}
                            </p>
                            <p className="text-primary-400 text-sm">
                                {appointment.doctor?.specialty || 'Đa khoa'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                            <Calendar className="w-5 h-5 text-blue-400" />
                            <div>
                                <p className="text-gray-400 text-xs">Ngày khám</p>
                                <p className="text-white font-medium">
                                    {appointment.date ? format(new Date(appointment.date), 'dd/MM/yyyy') : 'N/A'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-lg">
                            <Clock className="w-5 h-5 text-green-400" />
                            <div>
                                <p className="text-gray-400 text-xs">Giờ khám</p>
                                <p className="text-white font-medium">
                                    {appointment.slot?.startTime || appointment.time || 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Price */}
            <Card>
                <CardContent>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">Phí khám</span>
                        <span className="text-white">
                            {(appointment.doctor?.consultationFee || 300000).toLocaleString()}đ
                        </span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-gray-400">Phí dịch vụ</span>
                        <span className="text-white">0đ</span>
                    </div>
                    <hr className="border-dark-100 my-2" />
                    <div className="flex items-center justify-between py-2">
                        <span className="text-white font-semibold">Tổng cộng</span>
                        <span className="text-2xl font-bold gradient-text">
                            {(appointment.doctor?.consultationFee || 300000).toLocaleString()}đ
                        </span>
                    </div>
                </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
                <CardHeader>
                    <CardTitle>Phương thức thanh toán</CardTitle>
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
                            <p className="text-white font-semibold">Ví MoMo</p>
                            <p className="text-white/70 text-sm">Thanh toán qua ví điện tử MoMo</p>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white" />
                    </button>

                    <button
                        disabled
                        className="w-full flex items-center gap-4 p-4 bg-dark-300 rounded-lg opacity-50 cursor-not-allowed"
                    >
                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-white font-semibold">Thẻ tín dụng/Ghi nợ</p>
                            <p className="text-gray-500 text-sm">Sắp có</p>
                        </div>
                    </button>
                </CardContent>
            </Card>

            {/* Back Button */}
            <div className="text-center">
                <Link to="/dashboard/appointments" className="text-gray-400 hover:text-white">
                    ← Quay lại danh sách lịch hẹn
                </Link>
            </div>
        </div>
    );
};
