import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
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

const STEP_PROFILE = 1;
const STEP_DOCTOR = 2;
const STEP_SLOT = 3;
const STEP_CONFIRM = 4;

export const BookAppointment = () => {
    const location = useLocation();
    const navigate = useNavigate();

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
        { num: STEP_PROFILE, label: 'Chon ho so kham' },
        { num: STEP_DOCTOR, label: 'Chon bac si' },
        { num: STEP_SLOT, label: 'Chon lich bac si' },
        { num: STEP_CONFIRM, label: 'Xac nhan' },
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
            console.error('Loi khi tai du lieu:', err);
            setError('Khong the tai du lieu. Vui long thu lai.');
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
            console.error('Loi khi tai lich trong:', err);
            setAvailableSlots([]);
        }
    };

    const goToDoctorStep = () => {
        if (!selectedCareProfile) {
            setError('Vui long chon ho so kham truoc khi tiep tuc.');
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
            setError('Vui long chon ho so kham, lich bac si va nhap dich vu kham.');
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
            setSuccess('Dat lich thanh cong. Dang chuyen den trang thanh toan...');

            setTimeout(() => {
                navigate(`/dashboard/payment/${createdAppointment.id}`);
            }, 800);
        } catch (err) {
            setError(err.response?.data?.message || 'Khong the dat lich. Vui long thu lai.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Dang tai..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">Dat lich kham</h1>
                <p className="text-gray-400 mt-1">Chon ho so kham, bac si va lich bac si phu hop</p>
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
                        <CardTitle>Chon ho so kham</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {careProfiles.length === 0 ? (
                            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                <p className="text-yellow-300 text-sm">
                                    Ban can tao ho so cham soc truoc khi dat lich theo flow backend.
                                </p>
                                <div className="mt-3">
                                    <Button onClick={() => navigate('/dashboard/profile')}>
                                        Mo trang ho so cham soc
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
                                                {careProfile.relation || 'Ban than'}
                                                {careProfile.dob ? ` • ${new Date(careProfile.dob).toLocaleDateString('vi-VN')}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}

                            <div className="pt-2 flex gap-3 flex-wrap">
                                <Button onClick={goToDoctorStep}>Tiep tuc</Button>
                                <Button variant="outline" onClick={() => navigate('/dashboard/profile')}>
                                    Tao / Sua ho so cham soc
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
                            <CardTitle>Chon chuyen khoa va bac si</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_PROFILE)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lai
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCareProfile && (
                            <div className="mb-6 p-4 bg-dark-300 rounded-lg">
                                <p className="text-gray-400 text-sm">Ho so dang chon</p>
                                <p className="text-white font-medium">{selectedCareProfile.fullName}</p>
                                <p className="text-gray-500 text-sm">{selectedCareProfile.relation || 'Ban than'}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">Chuyen khoa</p>
                            <div className="flex gap-2 flex-wrap">
                                <button
                                    onClick={() => setSelectedSpecialty('')}
                                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${!selectedSpecialty
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-dark-300 text-gray-400 hover:bg-dark-100'
                                        }`}
                                >
                                    Tat ca
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
                                            <p className="text-gray-400 text-xs mt-1">{getDoctorFee(doctor).toLocaleString('vi-VN')}d</p>
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
                        <CardTitle>Chon lich bac si</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_DOCTOR)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lai
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {selectedCareProfile && (
                            <div className="mb-4 p-4 bg-dark-300 rounded-lg">
                                <p className="text-gray-400 text-sm">Ho so kham</p>
                                <p className="text-white font-medium">{selectedCareProfile.fullName}</p>
                                <p className="text-gray-500 text-sm">{selectedCareProfile.relation || 'Ban than'}</p>
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
                                    {getDoctorFee(selectedDoctor).toLocaleString('vi-VN')}d
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-sm text-gray-400 mb-2">Lich bac si con trong</p>
                            {availableSlots.length === 0 ? (
                                <p className="text-gray-500 text-center py-8">
                                    Bac si hien chua co lich trong de dat.
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
                            <CardTitle>Xac nhan dat lich</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setStep(STEP_SLOT)}>
                                <ChevronLeft className="w-4 h-4 mr-1" /> Quay lai
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {selectedCareProfile && (
                            <div className="p-4 bg-dark-300 rounded-lg">
                                <p className="text-gray-400 text-sm">Ho so kham</p>
                                <p className="text-white font-medium">{selectedCareProfile.fullName}</p>
                                <p className="text-gray-500 text-sm">{selectedCareProfile.relation || 'Ban than'}</p>
                            </div>
                        )}

                        <div className="p-4 bg-dark-300 rounded-lg space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Bac si</p>
                                    <p className="text-white font-medium">BS. {selectedDoctor.fullName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="w-6 h-6 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Ngay kham</p>
                                    <p className="text-white font-medium">
                                        {selectedSlot.dateLabel || format(selectedSlot.start, 'EEEE, dd/MM/yyyy', { locale: vi })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-600/20 rounded-xl flex items-center justify-center">
                                    <Clock className="w-6 h-6 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Lich bac si</p>
                                    <p className="text-white font-medium">{selectedSlot.startLabel} - {selectedSlot.endLabel}</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm text-gray-400 mb-2 block">Dich vu kham</label>
                            <input
                                value={service}
                                onChange={(event) => setService(event.target.value)}
                                placeholder="Vi du: Kham tong quat, Tu van tim mach"
                                className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                            />
                        </div>

                        <Button onClick={handleSubmit} loading={submitting} fullWidth size="lg">
                            Xac nhan dat lich
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
