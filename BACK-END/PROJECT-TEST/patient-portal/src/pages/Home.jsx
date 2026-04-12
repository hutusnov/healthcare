import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/common';
import { publicAPI } from '../services/api';
import {
    Calendar,
    Shield,
    Clock,
    Star,
    Stethoscope,
    Heart,
    Brain,
    Eye,
    Bone,
    Baby,
    ArrowRight
} from 'lucide-react';
import { getApiData } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

const specialties = [
    { name: 'TIM MẠCH', icon: Heart, color: 'from-red-500 to-pink-500' },
    { name: 'THẦN KINH', icon: Brain, color: 'from-purple-500 to-indigo-500' },
    { name: 'MẮT', icon: Eye, color: 'from-blue-500 to-cyan-500' },
    { name: 'BỆNH LÝ CỘT SỐNG', icon: Bone, color: 'from-orange-500 to-amber-500' },
    { name: 'HUYẾT HỌC', icon: Baby, color: 'from-green-500 to-emerald-500' },
    { name: 'KHÁM VÀ TƯ VẤN DINH DƯỠNG', icon: Stethoscope, color: 'from-primary-500 to-secondary-500' },
];

const features = [
    {
        icon: Calendar,
        title: 'Đặt lịch dễ dàng',
        description: 'Chọn bác sĩ và lịch bác sĩ phù hợp chỉ trong vài bước đơn giản.',
    },
    {
        icon: Shield,
        title: 'Bảo mật thông tin',
        description: 'Thông tin y tế của bạn được bảo vệ an toàn trong suốt quá trình sử dụng.',
    },
    {
        icon: Clock,
        title: 'Tiết kiệm thời gian',
        description: 'Không cần xếp hàng, đến đúng lịch hẹn và chủ động theo dõi hồ sơ khám.',
    },
    {
        icon: Star,
        title: 'Bác sĩ chất lượng',
        description: 'Đội ngũ bác sĩ chuyên khoa với dữ liệu và lịch hẹn được cập nhật thực tế.',
    },
];

const defaultStats = {
    doctorCount: 0,
    patientCount: 0,
    appointmentCount: 0,
    averageRating: 0,
};

const formatCount = (value) => Number(value || 0).toLocaleString('vi-VN');

export const Home = () => {
        const { language } = useUI();
    const [stats, setStats] = useState(defaultStats);

        const text = language === 'vi'
                ? {
                        line1: 'Chăm sóc sức khỏe',
                        line2: 'thông minh và tiện lợi',
                        subtitle: 'Đặt lịch khám với các bác sĩ chuyên khoa hàng đầu. Theo dõi sức khỏe và quản lý lịch hẹn mọi lúc, mọi nơi.',
                        ctaStart: 'Bắt đầu ngay',
                        ctaDoctors: 'Xem danh sách bác sĩ',
                        statDoctors: 'Bác sĩ',
                        statPatients: 'Bệnh nhân',
                        statAppointments: 'Lịch khám',
                        statRating: 'Đánh giá',
                        specialtiesTitle: 'Chuyên khoa',
                        specialtiesDesc: 'Đa dạng các chuyên khoa đáp ứng mọi nhu cầu khám chữa bệnh của bạn',
                        whyTitle: 'Tại sao chọn chúng tôi?',
                        whyDesc: 'Trải nghiệm dịch vụ y tế hiện đại với nhiều tiện ích vượt trội',
                        finalTitle: 'Sẵn sàng chăm sóc sức khỏe của bạn?',
                        finalDesc: 'Đăng ký ngay hôm nay để trải nghiệm dịch vụ đặt lịch khám hiện đại nhất.',
                        finalBtn: 'Đăng ký miễn phí',
                    }
                : {
                        line1: 'Smart Healthcare',
                        line2: 'made simple',
                        subtitle: 'Book appointments with top specialists. Track your health and manage schedules anywhere, anytime.',
                        ctaStart: 'Get Started',
                        ctaDoctors: 'Browse Doctors',
                        statDoctors: 'Doctors',
                        statPatients: 'Patients',
                        statAppointments: 'Appointments',
                        statRating: 'Rating',
                        specialtiesTitle: 'Specialties',
                        specialtiesDesc: 'A wide range of specialties for your healthcare needs',
                        whyTitle: 'Why choose us?',
                        whyDesc: 'Experience modern healthcare with practical features',
                        finalTitle: 'Ready to take care of your health?',
                        finalDesc: 'Sign up today to experience modern appointment booking.',
                        finalBtn: 'Sign Up Free',
                    };

    useEffect(() => {
        const loadStats = async () => {
            try {
                const response = await publicAPI.getHomeStats();
                const payload = getApiData(response);
                setStats({
                    doctorCount: Number(payload?.doctorCount || 0),
                    patientCount: Number(payload?.patientCount || 0),
                    appointmentCount: Number(payload?.appointmentCount || 0),
                    averageRating: Number(payload?.averageRating || 0),
                });
            } catch (error) {
                console.error('Không thể tải thống kê trang chủ:', error);
            }
        };

        loadStats();
    }, []);

    const statCards = [
        { value: formatCount(stats.doctorCount), label: text.statDoctors },
        { value: formatCount(stats.patientCount), label: text.statPatients },
        { value: formatCount(stats.appointmentCount), label: text.statAppointments },
        { value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0', label: text.statRating },
    ];

    return (
        <div className="min-h-screen">
            <section className="relative overflow-hidden py-20 lg:py-32">
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-600/20 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            <span className="gradient-text">{text.line1}</span>
                            <br />
                            <span className="text-white">{text.line2}</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                            {text.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="xl" className="group">
                                    {text.ctaStart}
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/doctors">
                                <Button variant="outline" size="xl">
                                    {text.ctaDoctors}
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {statCards.map((stat) => (
                            <div key={stat.label} className="card text-center">
                                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                                <div className="text-gray-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16 bg-dark-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">{text.specialtiesTitle}</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            {text.specialtiesDesc}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {specialties.map((specialty, index) => (
                            <Link
                                key={index}
                                to={`/doctors?specialty=${specialty.name}`}
                                className="card group text-center hover:scale-105"
                            >
                                <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${specialty.color} flex items-center justify-center group-hover:animate-pulse-glow`}>
                                    <specialty.icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-white font-medium text-sm">{specialty.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">{text.whyTitle}</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            {text.whyDesc}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div key={index} className="card group">
                                <div className="w-12 h-12 bg-primary-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-600/30 transition-colors">
                                    <feature.icon className="w-6 h-6 text-primary-400" />
                                </div>
                                <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                                <p className="text-gray-400 text-sm">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-8 md:p-12">
                        <div className="relative text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                {text.finalTitle}
                            </h2>
                            <p className="text-white/80 mb-6 max-w-xl mx-auto">
                                {text.finalDesc}
                            </p>
                            <Link to="/register">
                                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                                    {text.finalBtn}
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
