import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doctorAPI, appointmentAPI, careProfileAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Loading } from '../components/common';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';

export const BookAppointment = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Data
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [careProfiles, setCareProfiles] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    // Form
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState(location.state?.doctor || null);
    const [selectedDate, setSelectedDate] = useState(
        location.state?.date ? new Date(location.state.date) : new Date()
    );
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedCareProfile, setSelectedCareProfile] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedDoctor && selectedDate) {
            loadAvailableSlots();
        }
    }, [selectedDoctor, selectedDate]);

    const loadInitialData = async () => {
        try {
            const [doctorsRes, specialtiesRes, careRes] = await Promise.all([
                doctorAPI.getAll(),
                doctorAPI.getSpecialties(),
                careProfileAPI.getAll(),
            ]);

            setDoctors(doctorsRes.data?.data || doctorsRes.data || []);
            setSpecialties(specialtiesRes.data?.data || specialtiesRes.data || []);
            setCareProfiles(careRes.data?.data || careRes.data || []);

            // If came from doctor detail page
            if (location.state?.doctorId) {
                const doc = (doctorsRes.data?.data || doctorsRes.data || [])
                    .find(d => d.id === parseInt(location.state.doctorId));
                if (doc) {
                    setSelectedDoctor(doc);
                    setStep(2);
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu:', err);
            setError('Không thể tải dữ liệu. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSlots = async () => {
        try {
            const response = await appointmentAPI.getAvailableSlots(
                selectedDoctor.id,
                format(selectedDate, 'yyyy-MM-dd')
            );
            setAvailableSlots(response.data?.data || response.data || []);
        } catch (err) {
            console.error('Lỗi khi tải lịch trống:', err);
            setAvailableSlots([]);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDoctor || !selectedSlot) {
            setError('Vui lòng chọn bác sĩ và thời gian khám');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await appointmentAPI.book({
                doctorSlotId: selectedSlot.id,
                careProfileId: selectedCareProfile?.id,
                notes,
            });

            setSuccess('Đặt lịch thành công! Chuyển đến trang thanh toán...');
            setTimeout(() => {
                navigate('/dashboard/appointments');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đặt lịch. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const dates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

    const filteredDoctors = selectedSpecialty
        ? doctors.filter(d => d.specialty === selectedSpecialty)
        : doctors;

    if (loading) {
        return <Loading fullScreen text="Đang tải..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">Đặt lịch khám</h1>
                <p className="text-gray-400 mt-1">Chọn bác sĩ và thời gian phù hợp</p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4">
                {[
                    { num: 1, label: 'Chọn bác sĩ' },
                    { num: 2, label: 'Chọn thời gian' },
                    { num: 3, label: 'Xác nhận' },
                ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                        <div className={`flex items-center gap-2 ${step >= s.num ? 'text-primary-400' : 'text-gray-500'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > s.num
                                    ? 'bg-primary-600 text-white'
                                    : step === s.num
                                        ? 'bg-primary-600/20 border-2 border-primary-500 text-primary-400'
                                        : 'bg-dark-300 text-gray-500'
                                }`}>
                                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                            </div>
                            <span className="hidden sm:block text-sm">{s.label}</span>
                        </div>
                        {i < 2 && <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />}
                    </div>
                ))}
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} />}

            {/* Step 1: Select Doctor */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Chọn chuyên khoa và bác sĩ</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Specialty Filter */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">Chuyên khoa</p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedSpecialty('')}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${!selectedSpecialty
                                            ? 'bg-primary-600 text-white'
                                            : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                        }`}
                                >
                                    Tất cả
                                </button>
                                {specialties.map((spec) => (
                                    <button
                                        key={spec.id || spec}
                                        onClick={() => setSelectedSpecialty(spec.name || spec)}
                                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedSpecialty === (spec.name || spec)
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                            }`}
                                    >
                                        {spec.name || spec}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Doctor List */}
                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredDoctors.map((doctor) => (
                                <div
                                    key={doctor.id}
                                    onClick={() => {
                                        setSelectedDoctor(doctor);
                                        setStep(2);
                                    }}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedDoctor?.id === doctor.id
                                            ? 'border-primary-500 bg-primary-600/10'
                                            : 'border-dark-100 bg-dark-300 hover:border-primary-500/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                            <span className="text-white font-bold">
                                                {(doctor.user?.fullName || doctor.fullName || 'B')[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">
                                                BS. {doctor.user?.fullName || doctor.fullName}
                                            </p>
                                            <p className="text-primary-400 text-sm">{doctor.specialty || 'Đa khoa'}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 2: Select Date & Time */}
            {step === 2 && selectedDoctor && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Chọn ngày và giờ khám</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Selected Doctor */}
                        <div className="flex items-center gap-4 p-4 bg-dark-300 rounded-lg mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold">
                                    {(selectedDoctor.user?.fullName || selectedDoctor.fullName || 'B')[0]}
                                </span>
                            </div>
                            <div>
                                <p className="text-white font-medium">
                                    BS. {selectedDoctor.user?.fullName || selectedDoctor.fullName}
                                </p>
                                <p className="text-primary-400 text-sm">{selectedDoctor.specialty || 'Đa khoa'}</p>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">Chọn ngày</p>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {dates.map((date) => (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => {
                                            setSelectedDate(date);
                                            setSelectedSlot(null);
                                        }}
                                        className={`flex-shrink-0 px-4 py-3 rounded-lg text-center transition-colors ${format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                            }`}
                                    >
                                        <div className="text-xs opacity-75">
                                            {format(date, 'EEEE', { locale: vi })}
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
                            <p className="text-sm text-gray-400 mb-2">Chọn giờ khám</p>
                            {availableSlots.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Không có lịch trống trong ngày này. Vui lòng chọn ngày khác.
                                </p>
                            ) : (
                                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => {
                                                setSelectedSlot(slot);
                                                setStep(3);
                                            }}
                                            className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${selectedSlot?.id === slot.id
                                                    ? 'bg-primary-600 text-white'
                                                    : 'bg-dark-300 text-gray-400 hover:bg-primary-600 hover:text-white'
                                                }`}
                                        >
                                            {slot.startTime}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && selectedDoctor && selectedSlot && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Xác nhận đặt lịch</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lại
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Summary */}
                        <div className="p-4 bg-dark-300 rounded-lg space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Bác sĩ</p>
                                    <p className="text-white font-medium">
                                        BS. {selectedDoctor.user?.fullName || selectedDoctor.fullName}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Ngày khám</p>
                                    <p className="text-white font-medium">
                                        {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Giờ khám</p>
                                    <p className="text-white font-medium">{selectedSlot.startTime}</p>
                                </div>
                            </div>
                        </div>

                        {/* Care Profile Selection */}
                        {careProfiles.length > 0 && (
                            <div>
                                <p className="text-sm text-gray-400 mb-2">Đặt lịch cho</p>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => setSelectedCareProfile(null)}
                                        className={`w-full p-3 rounded-lg text-left transition-colors ${!selectedCareProfile
                                                ? 'bg-primary-600/20 border border-primary-500 text-white'
                                                : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                            }`}
                                    >
                                        Bản thân
                                    </button>
                                    {careProfiles.map((cp) => (
                                        <button
                                            key={cp.id}
                                            onClick={() => setSelectedCareProfile(cp)}
                                            className={`w-full p-3 rounded-lg text-left transition-colors ${selectedCareProfile?.id === cp.id
                                                    ? 'bg-primary-600/20 border border-primary-500 text-white'
                                                    : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                                }`}
                                        >
                                            {cp.fullName} ({cp.relationship || 'Người thân'})
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Triệu chứng / Ghi chú</label>
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Mô tả triệu chứng hoặc lý do khám..."
                                className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 min-h-[100px]"
                            />
                        </div>

                        {/* Submit */}
                        <Button onClick={handleSubmit} loading={submitting} fullWidth size="lg">
                            Xác nhận đặt lịch
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
