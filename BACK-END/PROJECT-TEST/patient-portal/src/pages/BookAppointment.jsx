import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';
import { Calendar, Clock, User, ChevronLeft, ChevronRight, Check, Shield } from 'lucide-react';
import { doctorAPI, appointmentAPI, careProfileAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert, Loading } from '../components/common';
import {
    getApiData,
    getDoctorFee,
    getListData,
    normalizeCareProfile,
    normalizeDoctor,
    normalizeSlot,
} from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

const STEP_PROFILE = 1;
const STEP_DOCTOR = 2;
const STEP_SLOT = 3;
const STEP_CONFIRM = 4;

export const BookAppointment = () => {
    const { language } = useUI();
    const location = useLocation();
    const navigate = useNavigate();
        const text = language === 'vi'
                ? {
                        stepProfile: 'Chọn hồ sơ khám',
                        stepDoctor: 'Chọn bác sĩ',
                        stepSlot: 'Chọn lịch bác sĩ',
                        stepConfirm: 'Xác nhận',
                        loadError: 'Không thể tải dữ liệu. Vui lòng thử lại.',
                        selectProfileFirst: 'Vui lòng chọn hồ sơ khám trước khi tiếp tục.',
                        submitMissing: 'Vui lòng chọn hồ sơ khám, lịch bác sĩ và nhập dịch vụ khám.',
                        bookingSuccess: 'Đặt lịch thành công. Đang chuyển đến trang thanh toán...',
                        bookingFailed: 'Không thể đặt lịch. Vui lòng thử lại.',
                        loading: 'Đang tải...',
                        title: 'Đặt lịch khám',
                        subtitle: 'Chọn hồ sơ khám, bác sĩ và lịch bác sĩ phù hợp',
                        selectProfile: 'Chọn hồ sơ khám',
                        profileRequired: 'Bạn cần tạo hồ sơ chăm sóc trước khi đặt lịch theo flow backend.',
                        openProfilePage: 'Mở trang hồ sơ chăm sóc',
                        self: 'Bản thân',
                        continue: 'Tiếp tục',
                        manageProfiles: 'Tạo / Sửa hồ sơ chăm sóc',
                        selectDoctorAndSpecialty: 'Chọn chuyên khoa và bác sĩ',
                        back: 'Quay lại',
                        activeProfile: 'Hồ sơ đang chọn',
                        specialty: 'Chuyên khoa',
                        all: 'Tất cả',
                        selectSlot: 'Chọn lịch bác sĩ',
                        profileLabel: 'Hồ sơ khám',
                        availableSlot: 'Lịch bác sĩ còn trống',
                        noSlot: 'Bác sĩ hiện chưa có lịch trống để đặt.',
                        confirmBooking: 'Xác nhận đặt lịch',
                        doctor: 'Bác sĩ',
                        date: 'Ngày khám',
                        schedule: 'Lịch bác sĩ',
                        service: 'Dịch vụ khám',
                        servicePlaceholder: 'Ví dụ: Khám tổng quát, Tư vấn tim mạch',
                        submit: 'Xác nhận đặt lịch',
                        doctorLabel: 'Bác sĩ',
                    }
                : {
                        stepProfile: 'Select profile',
                        stepDoctor: 'Select doctor',
                        stepSlot: 'Select schedule',
                        stepConfirm: 'Confirm',
                        loadError: 'Unable to load data. Please try again.',
                        selectProfileFirst: 'Please select a care profile before continuing.',
                        submitMissing: 'Please select profile, schedule, and enter service.',
                        bookingSuccess: 'Booking successful. Redirecting to payment...',
                        bookingFailed: 'Unable to book appointment. Please try again.',
                        loading: 'Loading...',
                        title: 'Book appointment',
                        subtitle: 'Choose profile, doctor, and schedule that fits you',
                        selectProfile: 'Select profile',
                        profileRequired: 'You need to create a care profile before booking an appointment.',
                        openProfilePage: 'Open care profile page',
                        self: 'Self',
                        continue: 'Continue',
                        manageProfiles: 'Create / Edit care profiles',
                        selectDoctorAndSpecialty: 'Choose specialty and doctor',
                        back: 'Back',
                        activeProfile: 'Selected profile',
                        specialty: 'Specialty',
                        all: 'All',
                        selectSlot: 'Choose doctor schedule',
                        profileLabel: 'Care profile',
                        availableSlot: 'Available doctor schedules',
                        noSlot: 'This doctor has no available schedule at the moment.',
                        confirmBooking: 'Confirm appointment',
                        doctor: 'Doctor',
                        date: 'Date',
                        schedule: 'Schedule',
                        service: 'Service',
                        servicePlaceholder: 'Example: General checkup, Cardiology consult',
                        submit: 'Confirm booking',
                        doctorLabel: 'Doctor',
                    };

        const locale = language === 'vi' ? vi : enUS;
        const currency = (amount) => `${Number(amount || 0).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}đ`;


    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [careProfiles, setCareProfiles] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);

    const [step, setStep] = useState(STEP_PROFILE);
    const [selectedSpecialty, setSelectedSpecialty] = useState(location.state?.doctor?.specialty || '');
    const [selectedDoctor, setSelectedDoctor] = useState(
        location.state?.doctor ? normalizeDoctor(location.state.doctor) : null
    );
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedCareProfile, setSelectedCareProfile] = useState(null);
    const [service, setService] = useState(location.state?.doctor?.specialty || '');

    const filteredDoctors = selectedSpecialty
        ? doctors.filter((doctor) => doctor.specialty === selectedSpecialty)
        : doctors;
    const steps = [
        { num: STEP_PROFILE, label: text.stepProfile },
        { num: STEP_DOCTOR, label: text.stepDoctor },
        { num: STEP_SLOT, label: text.stepSlot },
        { num: STEP_CONFIRM, label: text.stepConfirm },
    ];

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (selectedDoctor) {
            loadAvailableSlots(selectedDoctor.id);
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDoctor]);

    const loadInitialData = async () => {
        try {
            const [doctorsRes, specialtiesRes, careRes] = await Promise.all([
                doctorAPI.getAll(),
                doctorAPI.getSpecialties(),
                careProfileAPI.getAll(),
            ]);

            const doctorItems = getListData(getApiData(doctorsRes)).map(normalizeDoctor);
            const careItems = getListData(getApiData(careRes)).map(normalizeCareProfile);

            setDoctors(doctorItems);
            setSpecialties(getListData(getApiData(specialtiesRes)));
            setCareProfiles(careItems);

            if (location.state?.doctorId) {
                const doctorFromList = doctorItems.find((item) => item.id === location.state.doctorId);
                if (doctorFromList) {
                    setSelectedDoctor(doctorFromList);
                    setSelectedSpecialty(doctorFromList.specialty || '');
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu:', err);
            setError(text.loadError);
        } finally {
            setLoading(false);
        }
    };

    const loadAvailableSlots = async (doctorId) => {
        try {
            const response = await appointmentAPI.getAvailableSlots(doctorId);
            const slots = getListData(getApiData(response)).map(normalizeSlot);
            setAvailableSlots(slots);

            if (location.state?.slotId) {
                const slotFromList = slots.find((slot) => slot.id === location.state.slotId);
                if (slotFromList) {
                    setSelectedSlot(slotFromList);
                }
            }
        } catch (err) {
            console.error('Lỗi khi tải lịch trống:', err);
            setAvailableSlots([]);
        }
    };

    const goToDoctorStep = () => {
        if (!selectedCareProfile) {
            setError(text.selectProfileFirst);
            return;
        }

        setError('');
        setStep(STEP_DOCTOR);
    };

    const handleSelectDoctor = (doctor) => {
        setSelectedDoctor(doctor);
        setSelectedSlot(null);
        setService((currentService) => currentService || doctor.specialty || '');
        setStep(STEP_SLOT);
    };

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        setStep(STEP_CONFIRM);
    };

    const handleSubmit = async () => {
        if (!selectedCareProfile || !selectedDoctor || !selectedSlot || !service.trim()) {
            setError(text.submitMissing);
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            const response = await appointmentAPI.book({
                slotId: selectedSlot.id,
                careProfileId: selectedCareProfile.id,
                service: service.trim(),
            });

            const createdAppointment = getApiData(response);
            setSuccess(text.bookingSuccess);

            setTimeout(() => {
                navigate(`/dashboard/payment/${createdAppointment.id}`);
            }, 800);
        } catch (err) {
            setError(err.response?.data?.message || text.bookingFailed);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text={text.loading} />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">{text.title}</h1>
                <p className="text-gray-400 mt-1">{text.subtitle}</p>
            </div>

            <div className="flex items-center justify-center gap-4 flex-wrap">
                {steps.map((item, index) => (
                    <div key={item.num} className="flex items-center">
                        <div className={`flex items-center gap-2 ${step >= item.num ? 'text-primary-400' : 'text-gray-500'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step > item.num
                                ? 'bg-primary-600 text-white'
                                : step === item.num
                                    ? 'bg-primary-600/20 border-2 border-primary-500 text-primary-400'
                                    : 'bg-dark-300 text-gray-500'
                                }`}>
                                {step > item.num ? <Check className="w-4 h-4" /> : item.num}
                            </div>
                            <span className="hidden sm:block text-sm">{item.label}</span>
                        </div>
                        {index < steps.length - 1 && <ChevronRight className="w-4 h-4 text-gray-600 mx-2" />}
                    </div>
                ))}
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} />}

            {step === STEP_PROFILE && (
                <Card>
                    <CardHeader>
                        <CardTitle>{text.selectProfile}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {careProfiles.length === 0 ? (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-300 text-sm">
                                    {text.profileRequired}
                                </p>
                                <div className="mt-3">
                                    <Button onClick={() => navigate('/dashboard/profile')}>
                                        {text.openProfilePage}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                            {careProfiles.map((careProfile) => (
                                <button
                                    key={careProfile.id}
                                    onClick={() => setSelectedCareProfile(careProfile)}
                                    className={`w-full p-4 rounded-lg border text-left transition-all ${selectedCareProfile?.id === careProfile.id
                                        ? 'border-primary-500 bg-primary-600/10'
                                        : 'border-dark-100 bg-dark-300 hover:border-primary-500/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-secondary-600/20 rounded-xl flex items-center justify-center">
                                            <Shield className="w-6 h-6 text-secondary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{careProfile.fullName}</p>
                                            <p className="text-gray-400 text-sm">
                                                {careProfile.relation || text.self}
                                                {careProfile.dob ? ` • ${new Date(careProfile.dob).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <div className="pt-2 flex gap-3 flex-wrap">
                                <Button onClick={goToDoctorStep}>{text.continue}</Button>
                                <Button variant="outline" onClick={() => navigate('/dashboard/profile')}>
                                    {text.manageProfiles}
                                </Button>
                            </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {step === STEP_DOCTOR && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{text.selectDoctorAndSpecialty}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_PROFILE)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> {text.back}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCareProfile && (
                            <div className="mb-6 p-4 bg-dark-300 rounded-lg">
                                <p className="text-gray-400 text-sm">{text.activeProfile}</p>
                                <p className="text-white font-medium">{selectedCareProfile.fullName}</p>
                                <p className="text-gray-500 text-sm">{selectedCareProfile.relation || text.self}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">{text.specialty}</p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedSpecialty('')}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${!selectedSpecialty
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                        }`}
                                >
                                    {text.all}
                                </button>
                                {specialties.map((spec) => (
                                    <button
                                        key={spec.name || spec}
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

                        <div className="grid md:grid-cols-2 gap-4">
                            {filteredDoctors.map((doctor) => (
                                <div
                                    key={doctor.id}
                                    onClick={() => handleSelectDoctor(doctor)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedDoctor?.id === doctor.id
                                        ? 'border-primary-500 bg-primary-600/10'
                                        : 'border-dark-100 bg-dark-300 hover:border-primary-500/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                            <span className="text-white font-bold">{doctor.fullName[0]}</span>
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">BS. {doctor.fullName}</p>
                                            <p className="text-primary-400 text-sm">{doctor.specialty}</p>
                                            <p className="text-gray-400 text-xs mt-1">{currency(getDoctorFee(doctor))}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === STEP_SLOT && selectedDoctor && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                        <CardTitle>{text.selectSlot}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_DOCTOR)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> {text.back}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCareProfile && (
                            <div className="mb-4 p-4 bg-dark-300 rounded-lg">
                                <p className="text-gray-400 text-sm">{text.profileLabel}</p>
                                <p className="text-white font-medium">{selectedCareProfile.fullName}</p>
                                <p className="text-gray-500 text-sm">{selectedCareProfile.relation || text.self}</p>
                            </div>
                        )}

                        <div className="flex items-center gap-4 p-4 bg-dark-300 rounded-lg mb-6">
                            <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                <span className="text-white font-bold">{selectedDoctor.fullName[0]}</span>
                            </div>
                            <div>
                                <p className="text-white font-medium">BS. {selectedDoctor.fullName}</p>
                                <p className="text-primary-400 text-sm">{selectedDoctor.specialty}</p>
                                <p className="text-gray-400 text-xs mt-1">
                                    {currency(getDoctorFee(selectedDoctor))}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">{text.availableSlot}</p>
                            {availableSlots.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    {text.noSlot}
                                </p>
                            ) : (
                                <div className="grid md:grid-cols-2 gap-3">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot.id}
                                            onClick={() => handleSelectSlot(slot)}
                                            className={`p-4 rounded-lg text-left border transition-colors ${selectedSlot?.id === slot.id
                                                ? 'bg-primary-600/10 border-primary-500 text-white'
                                                : 'bg-dark-300 border-dark-100 text-gray-300 hover:border-primary-500 hover:text-white'
                                                }`}
                                        >
                                            <p className="text-sm text-gray-400">{slot.dateLabel}</p>
                                            <p className="font-medium mt-1">{slot.startLabel} - {slot.endLabel}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === STEP_CONFIRM && selectedDoctor && selectedSlot && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>{text.confirmBooking}</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_SLOT)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> {text.back}
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {selectedCareProfile && (
                            <div className="p-4 bg-dark-300 rounded-lg">
                                <p className="text-gray-400 text-sm">{text.profileLabel}</p>
                                <p className="text-white font-medium">{selectedCareProfile.fullName}</p>
                                <p className="text-gray-500 text-sm">{selectedCareProfile.relation || text.self}</p>
                            </div>
                        )}

                        <div className="p-4 bg-dark-300 rounded-lg space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">{text.doctor}</p>
                                    <p className="text-white font-medium">BS. {selectedDoctor.fullName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">{text.date}</p>
                                    <p className="text-white font-medium">
                                        {selectedSlot.dateLabel || format(selectedSlot.start, 'EEEE, dd/MM/yyyy', { locale })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">{text.schedule}</p>
                                    <p className="text-white font-medium">{selectedSlot.startLabel} - {selectedSlot.endLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">{text.service}</label>
                            <input
                                value={service}
                                onChange={(event) => setService(event.target.value)}
                                placeholder={text.servicePlaceholder}
                                className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            />
                        </div>

                        <Button onClick={handleSubmit} loading={submitting} fullWidth size="lg">
                            {text.submit}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
