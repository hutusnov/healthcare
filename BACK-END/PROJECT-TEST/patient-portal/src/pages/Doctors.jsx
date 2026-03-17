import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorAPI } from '../services/api';
import { Card, Loading, Input, Button } from '../components/common';
import { Search, MapPin, Star, Clock, Filter, ChevronRight } from 'lucide-react';

export const Doctors = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
    const [selectedSpecialty, setSelectedSpecialty] = useState(searchParams.get('specialty') || '');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const params = {};
        if (searchTerm) params.search = searchTerm;
        if (selectedSpecialty) params.specialty = selectedSpecialty;
        setSearchParams(params);

        searchDoctors();
    }, [searchTerm, selectedSpecialty]);

    const loadData = async () => {
        try {
            const [doctorsRes, specialtiesRes] = await Promise.all([
                doctorAPI.getAll(),
                doctorAPI.getSpecialties(),
            ]);

            setDoctors(doctorsRes.data?.data || doctorsRes.data || []);
            setSpecialties(specialtiesRes.data?.data || specialtiesRes.data || []);
        } catch (err) {
            console.error('Lỗi khi tải dữ liệu:', err);
        } finally {
            setLoading(false);
        }
    };

    const searchDoctors = async () => {
        try {
            const params = {};
            if (searchTerm) params.search = searchTerm;
            if (selectedSpecialty) params.specialty = selectedSpecialty;

            const response = await doctorAPI.getAll(params);
            setDoctors(response.data?.data || response.data || []);
        } catch (err) {
            console.error('Lỗi khi tìm kiếm:', err);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Đang tải danh sách bác sĩ..." />;
    }

    return (
        <div className="min-h-screen py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Tìm bác sĩ</h1>
                    <p className="text-gray-400">Tìm kiếm và đặt lịch khám với các bác sĩ chuyên khoa</p>
                </div>

                {/* Search & Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                            type="text"
                            placeholder="Tìm theo tên bác sĩ..."
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
                            Tất cả
                        </button>
                        {specialties.map((spec) => (
                            <button
                                key={spec.id || spec}
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

                {/* Results Count */}
                <p className="text-gray-400 mb-4">
                    Tìm thấy <span className="text-white font-medium">{doctors.length}</span> bác sĩ
                </p>

                {/* Doctor List */}
                {doctors.length === 0 ? (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                        <h3 className="text-white text-xl font-medium mb-2">Không tìm thấy bác sĩ</h3>
                        <p className="text-gray-400">Thử tìm kiếm với từ khóa khác hoặc chọn chuyên khoa khác</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {doctors.map((doctor) => (
                            <Link key={doctor.id} to={`/doctors/${doctor.id}`}>
                                <Card className="h-full group">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <span className="text-white font-bold text-xl">
                                                {(doctor.user?.fullName || doctor.fullName || 'B')[0]}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-white font-semibold group-hover:text-primary-400 transition-colors">
                                                BS. {doctor.user?.fullName || doctor.fullName || 'Chưa có tên'}
                                            </h3>
                                            <p className="text-primary-400 text-sm">{doctor.specialty || 'Đa khoa'}</p>
                                            <div className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                <span>{doctor.rating || '4.5'}</span>
                                                <span className="mx-1">•</span>
                                                <span>{doctor.experience || '5'} năm KN</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 space-y-2">
                                        {doctor.hospital && (
                                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                                                <MapPin className="w-4 h-4" />
                                                <span className="truncate">{doctor.hospital}</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                                            <Clock className="w-4 h-4" />
                                            <span>{doctor.consultationFee ? `${doctor.consultationFee.toLocaleString()}đ` : 'Liên hệ'}</span>
                                        </div>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-dark-100 flex items-center justify-between">
                                        <span className="text-primary-400 text-sm">Xem chi tiết</span>
                                        <ChevronRight className="w-4 h-4 text-primary-400 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
