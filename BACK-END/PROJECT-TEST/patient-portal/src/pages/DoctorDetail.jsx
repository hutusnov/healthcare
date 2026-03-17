import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI } from '../services/api';
import { Card, Button, Loading, Alert } from '../components/common';
import {
    MapPin,
    Star,
    Clock,
    Phone,
    Mail,
    Award,
    GraduationCap,
    Calendar,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';

export const DoctorDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    useEffect(() => {
        loadDoctor();
    }, [id]);

    useEffect(() => {
        if (doctor) {
            loadAvailableSlots();
        }
    }, [doctor, selectedDate]);

    const loadDoctor = async () => {
        try {
            const response = await doctorAPI.getById(id);
            setDoctor(response.data?.data || response.data);
        } catch (err) {
            console.error('Lỗi khi tải thông tin bác sĩ:', err);
            setError('Không thể tải thông tin bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSlots = async () => {
        setSlotsLoading(true);
        try {
            const response = await appointmentAPI.getAvailableSlots(
                id,
                format(selectedDate, 'yyyy-MM-dd')
            );
            setAvailableSlots(response.data?.data || response.data || []);
        } catch (err) {
            console.error('Lỗi khi tải lịch trống:', err);
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleBookSlot = (slot) => {
        if (!user) {
            navigate('/login', { state: { from: `/doctors/${id}` } });
            return;
        }
        navigate('/dashboard/book', {
            state: {
                doctorId: id,
                doctor,
                date: format(selectedDate, 'yyyy-MM-dd'),
                slotId: slot.id
            }
        });
    };

    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    if (loading) {
        return <Loading fullScreen text="Đang tải thông tin bác sĩ..." />;
    }

    if (error || !doctor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Alert type="error" message={error || 'Không tìm thấy bác sĩ'} />
                    <Link to="/doctors" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
                        ← Quay lại danh sách bác sĩ
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link to="/doctors" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                    <ChevronLeft className="w-4 h-4" />
                    Quay lại danh sách bác sĩ
                </Link>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Doctor Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-3xl">
                                        {(doctor.user?.fullName || doctor.fullName || 'B')[0]}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-white mb-1">
                                        BS. {doctor.user?.fullName || doctor.fullName}
                                    </h1>
                                    <p className="text-primary-400 font-medium">{doctor.specialty || 'Đa khoa'}</p>

                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1 text-yellow-400">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-medium">{doctor.rating || '4.5'}</span>
                                            <span className="text-gray-400">({doctor.reviews || 120} đánh giá)</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Award className="w-4 h-4" />
                                            <span>{doctor.experience || 5} năm kinh nghiệm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* About */}
                        <Card>
                            <h2 className="text-lg font-semibold text-white mb-4">Giới thiệu</h2>
                            <p className="text-gray-400 leading-relaxed">
                                {doctor.bio || `BS. ${doctor.user?.fullName || doctor.fullName} là bác sĩ chuyên khoa ${doctor.specialty || 'Đa khoa'} 
                với nhiều năm kinh nghiệm trong lĩnh vực y khoa. Bác sĩ luôn tận tâm với bệnh nhân và không ngừng 
                cập nhật kiến thức mới để mang lại dịch vụ chăm sóc sức khỏe tốt nhất.`}
                            </p>
                        </Card>

                        {/* Education & Experience */}
                        <Card>
                            <h2 className="text-lg font-semibold text-white mb-4">Học vấn & Chứng chỉ</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <GraduationCap className="w-5 h-5 text-primary-400 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">Bác sĩ Y khoa</p>
                                        <p className="text-gray-400 text-sm">{doctor.education || 'Đại học Y Dược TP.HCM'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Award className="w-5 h-5 text-secondary-400 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">Chứng chỉ chuyên khoa</p>
                                        <p className="text-gray-400 text-sm">{doctor.certifications || 'Chứng chỉ hành nghề Bộ Y tế'}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Booking Card */}
                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <h2 className="text-lg font-semibold text-white mb-4">Đặt lịch khám</h2>

                            {/* Price */}
                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-100">
                                <span className="text-gray-400">Phí khám</span>
                                <span className="text-xl font-bold gradient-text">
                                    {doctor.consultationFee?.toLocaleString() || '300.000'}đ
                                </span>
                            </div>

                            {/* Date Picker */}
                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-2">Chọn ngày</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {dates.map((date) => (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 px-3 py-2 rounded-lg text-center transition-colors ${format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                                }`}
                                        >
                                            <div className="text-xs">
                                                {format(date, 'EEE', { locale: vi })}
                                            </div>
                                            <div className="font-medium">
                                                {format(date, 'dd/MM')}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Time Slots */}
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Chọn giờ</p>
                                {slotsLoading ? (
                                    <Loading text="Đang tải..." />
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        Không có lịch trống trong ngày này
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.id}
                                                onClick={() => handleBookSlot(slot)}
                                                className="px-3 py-2 bg-dark-300 hover:bg-primary-600 text-gray-400 hover:text-white rounded-lg text-sm transition-colors"
                                            >
                                                {slot.startTime}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Contact */}
                            <div className="mt-6 pt-4 border-t border-dark-100 space-y-2">
                                {doctor.hospital && (
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        <span>{doctor.hospital}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>Thứ 2 - Thứ 7: 8:00 - 17:00</span>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
