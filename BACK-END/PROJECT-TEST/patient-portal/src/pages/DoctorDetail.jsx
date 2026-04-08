import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { Card, Button, Loading, Alert } from '../components/common';
import {
    MapPin,
    Star,
    Clock,
    Award,
    GraduationCap,
    Calendar,
    ChevronLeft,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { enUS } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { getApiData, getDoctorFee, getListData, normalizeDoctor, normalizeSlot } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

export const DoctorDetail = () => {
    const { language } = useUI();
    const { id } = useParams();
            const text = language === 'vi'
                    ? {
                            loading: 'Đang tải thông tin bác sĩ...',
                            loadError: 'Không thể tải thông tin bác sĩ',
                            notFound: 'Không tìm thấy bác sĩ',
                            back: 'Quay lại danh sách bác sĩ',
                            intro: 'Giới thiệu',
                            education: 'Học vấn và chứng chỉ',
                            years: 'năm kinh nghiệm',
                            fee: 'Phí khám',
                            selectDate: 'Chọn ngày',
                            selectTime: 'Chọn giờ',
                            loadingShort: 'Đang tải...',
                            noSlots: 'Không có lịch trống trong ngày này',
                            selectedDate: 'Ngày đã chọn',
                            loginToBook: 'Đăng nhập để đặt lịch',
                            doctor: 'Bác sĩ',
                        }
                    : {
                            loading: 'Loading doctor information...',
                            loadError: 'Unable to load doctor information',
                            notFound: 'Doctor not found',
                            back: 'Back to doctors',
                            intro: 'Introduction',
                            education: 'Education and certificates',
                            years: 'years experience',
                            fee: 'Consultation fee',
                            selectDate: 'Select date',
                            selectTime: 'Select time',
                            loadingShort: 'Loading...',
                            noSlots: 'No available slots on this date',
                            selectedDate: 'Selected date',
                            loginToBook: 'Login to book',
                            doctor: 'Doctor',
                        };

            const locale = language === 'vi' ? vi : enUS;

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
        setLoading(true);
        try {
            const response = await doctorAPI.getById(id);
            setDoctor(normalizeDoctor(getApiData(response)));
        } catch (err) {
            console.error('Lỗi khi tải thông tin bác sĩ:', err);
            setError(text.loadError);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSlots = async () => {
        setSlotsLoading(true);
        try {
            const response = await doctorAPI.getAvailable({
                view: 'slots',
                doctorUserId: id,
                day: format(selectedDate, 'yyyy-MM-dd'),
            });
            const slots = getListData(getApiData(response)).map(normalizeSlot);
            setAvailableSlots(slots);
        } catch (err) {
            console.error('Lỗi khi tải lịch trống:', err);
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleBookSlot = (slot) => {
        if (!user) {
            navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } });
            return;
        }

        navigate('/dashboard/book', {
            state: {
                doctorId: doctor.id,
                doctor,
                date: format(selectedDate, 'yyyy-MM-dd'),
                slotId: slot.id,
            },
        });
    };

    const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

    if (loading) {
        return <Loading fullScreen text={text.loading} />;
    }

    if (error || !doctor) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Alert type="error" message={error || 'Không tìm thấy bác sĩ'} />
                    <Link to="/doctors" className="text-primary-400 hover:text-primary-300 mt-4 inline-block">
                        ← {text.back}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link to="/doctors" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
                    <ChevronLeft className="w-4 h-4" />
                    {text.back}
                </Link>

                <div className="grid lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-3xl">{doctor.fullName[0]}</span>
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-2xl font-bold text-white mb-1">BS. {doctor.fullName}</h1>
                                    <p className="text-primary-400 font-medium">{doctor.specialty}</p>

                                    <div className="flex flex-wrap items-center gap-4 mt-3">
                                        <div className="flex items-center gap-1 text-yellow-400">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-medium">{doctor.rating || '0.0'}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Award className="w-4 h-4" />
                                            <span>{doctor.yearsExperience || 0} {text.years}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-semibold text-white mb-4">{text.intro}</h2>
                            <p className="text-gray-400 leading-relaxed">
                                {doctor.bio || `Bác sĩ ${doctor.fullName} chuyên khoa ${doctor.specialty}.`}
                            </p>
                        </Card>

                        <Card>
                            <h2 className="text-lg font-semibold text-white mb-4">{text.education}</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <GraduationCap className="w-5 h-5 text-primary-400 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">Bác sĩ Y khoa</p>
                                        <p className="text-gray-400 text-sm">Thông tin học vấn đang được cập nhật</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Award className="w-5 h-5 text-secondary-400 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">Phòng khám</p>
                                        <p className="text-gray-400 text-sm">{doctor.clinicName}</p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="lg:col-span-1">
                        <Card className="sticky top-24">
                            <h2 className="text-lg font-semibold text-white mb-4">Đặt lịch khám</h2>

                            <div className="flex items-center justify-between mb-4 pb-4 border-b border-dark-100">
                                <span className="text-gray-400">{text.fee}</span>
                                <span className="text-xl font-bold gradient-text">
                                    {getDoctorFee(doctor).toLocaleString('vi-VN')}đ
                                </span>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm text-gray-400 mb-2">{text.selectDate}</p>
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
                                            <div className="text-xs">{format(date, 'EEE', { locale })}</div>
                                            <div className="font-medium">{format(date, 'dd/MM')}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-gray-400 mb-2">{text.selectTime}</p>
                                {slotsLoading ? (
                                    <Loading text={text.loadingShort} />
                                ) : availableSlots.length === 0 ? (
                                    <p className="text-gray-500 text-sm text-center py-4">
                                        {text.noSlots}
                                    </p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot.id}
                                                onClick={() => handleBookSlot(slot)}
                                                className="px-3 py-2 bg-dark-300 hover:bg-primary-600 text-gray-300 hover:text-white rounded-lg text-sm transition-colors"
                                            >
                                                {slot.startLabel}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-4 border-t border-dark-100 space-y-2">
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <MapPin className="w-4 h-4" />
                                    <span>{doctor.clinicName}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>Đặt lịch trực tiếp trên cổng bệnh nhân</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                    <Calendar className="w-4 h-4" />
                                    <span>{text.selectedDate}: {format(selectedDate, 'dd/MM/yyyy')}</span>
                                </div>
                            </div>

                            {!user && (
                                <div className="mt-4">
                                    <Button fullWidth onClick={() => navigate('/login', { state: { from: { pathname: `/doctors/${id}` } } })}>
                                        {text.loginToBook}
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};
