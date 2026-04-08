import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { Card, Loading, Input } from '../components/common';
import { Search, MapPin, Star, Clock, ChevronRight } from 'lucide-react';
import { getApiData, getDoctorFee, getListData, normalizeDoctor } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

export const Doctors = () => {
    const { language } = useUI();
    const [searchParams, setSearchParams] = useSearchParams();
            const text = language === 'vi'
                    ? {
                            title: 'Tìm bác sĩ',
                            subtitle: 'Tìm kiếm và đặt lịch khám với các bác sĩ chuyên khoa',
                            placeholder: 'Tìm theo tên bác sĩ...',
                            all: 'Tất cả',
                            found: 'Tìm thấy',
                            doctor: 'bác sĩ',
                            emptyTitle: 'Không tìm thấy bác sĩ',
                            emptyDesc: 'Thử với từ khóa khác hoặc đổi chuyên khoa.',
                            years: 'năm KN',
                            detail: 'Xem chi tiết',
                            loading: 'Đang tải danh sách bác sĩ...',
                        }
                    : {
                            title: 'Find doctors',
                            subtitle: 'Search and book appointments with specialists',
                            placeholder: 'Search by doctor name...',
                            all: 'All',
                            found: 'Found',
                            doctor: 'doctors',
                            emptyTitle: 'No doctors found',
                            emptyDesc: 'Try another keyword or specialty.',
                            years: 'years exp',
                            detail: 'View details',
                            loading: 'Loading doctors...',
                        };

    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
    const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');

    useEffect(() => {
        loadSpecialties();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            searchDoctors();
        }, 250);

        return () => clearTimeout(timeoutId);
    }, [searchTerm, selectedSpecialty]);

    const loadSpecialties = async () => {
        try {
            const specialtiesRes = await doctorAPI.getSpecialties();
            const data = getListData(getApiData(specialtiesRes));
            setSpecialties(data);
        } catch (err) {
            console.error('Lỗi khi tải chuyên khoa:', err);
        }
    };

    const searchDoctors = async () => {
        setLoading(true);
        try {
            const params = {};
            if (searchTerm) params.q = searchTerm;
            if (selectedSpecialty) params.specialty = selectedSpecialty;

            setSearchParams(params);

            const response = await doctorAPI.getAll(params);
            const data = getListData(getApiData(response)).map(normalizeDoctor);
            setDoctors(data);
        } catch (err) {
            console.error('Lỗi khi tìm kiếm bác sĩ:', err);
            setDoctors([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">{text.title}</h1>
                    <p className="text-gray-400">{text.subtitle}</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                            type="text"
                            placeholder={text.placeholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => setSelectedSpecialty('')}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${!selectedSpecialty
                                ? 'bg-primary-600 text-white'
                                : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                                }`}
                        >
                            {text.all}
                        </button>
                        {specialties.map((spec) => (
                            <button
                                key={spec.name || spec}
                                onClick={() => setSelectedSpecialty(spec.name || spec)}
                                className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${selectedSpecialty === (spec.name || spec)
                                    ? 'bg-primary-600 text-white'
                                    : 'bg-dark-200 text-gray-400 hover:bg-dark-100'
                                    }`}
                            >
                                {spec.name || spec}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <Loading fullScreen text={text.loading} />
                ) : (
                    <>
                        <p className="text-gray-400 mb-4">
                            {text.found} <span className="text-white font-medium">{doctors.length}</span> {text.doctor}
                        </p>

                        {doctors.length === 0 ? (
                            <div className="text-center py-16">
                                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                                <h3 className="text-white text-xl font-medium mb-2">{text.emptyTitle}</h3>
                                <p className="text-gray-400">{text.emptyDesc}</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {doctors.map((doctor) => (
                                    <Link key={doctor.id} to={`/doctors/${doctor.id}`}>
                                        <Card className="h-full group">
                                            <div className="flex items-start gap-4">
                                                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                                    <span className="text-white font-bold text-xl">{doctor.fullName[0]}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors">
                                                        BS. {doctor.fullName}
                                                    </h3>
                                                    <p className="text-primary-400 text-sm">{doctor.specialty}</p>
                                                    <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                                                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                        <span>{doctor.rating || '0.0'}</span>
                                                        <span className="mx-1">•</span>
                                                        <span>{doctor.yearsExperience || 0} {text.years}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="mt-4 space-y-2">
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="truncate">{doctor.clinicName}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                    <Clock className="w-4 h-4" />
                                                    <span>{getDoctorFee(doctor).toLocaleString('vi-VN')}đ</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
                                                <span className="text-primary-400 text-sm">{text.detail}</span>
                                                <ChevronRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
