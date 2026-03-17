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

const specialties = [
    { name: 'TIM M?CH', icon: Heart, color: 'from-red-500 to-pink-500' },
    { name: 'TH?N KINH', icon: Brain, color: 'from-purple-500 to-indigo-500' },
    { name: 'M?T', icon: Eye, color: 'from-blue-500 to-cyan-500' },
    { name: 'B?NH L? C?T S?NG', icon: Bone, color: 'from-orange-500 to-amber-500' },
    { name: 'HUY?T H?C', icon: Baby, color: 'from-green-500 to-emerald-500' },
    { name: 'KHAM VA TU VAN DINH DUONG', icon: Stethoscope, color: 'from-primary-500 to-secondary-500' },
];

const features = [
    {
        icon: Calendar,
        title: 'Dat lich de dang',
        description: 'Chon bac si va lich bac si phu hop chi trong vai buoc don gian.',
    },
    {
        icon: Shield,
        title: 'Bao mat thong tin',
        description: 'Thong tin y te cua ban duoc bao ve an toan trong suot qua trinh su dung.',
    },
    {
        icon: Clock,
        title: 'Tiet kiem thoi gian',
        description: 'Khong can xep hang, den dung lich hen va chu dong theo doi ho so kham.',
    },
    {
        icon: Star,
        title: 'Bac si chat luong',
        description: 'Doi ngu bac si chuyen khoa voi du lieu va lich hen duoc cap nhat thuc te.',
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
    const [stats, setStats] = useState(defaultStats);

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
                console.error('Khong the tai thong ke trang chu:', error);
            }
        };

        loadStats();
    }, []);

    const statCards = [
        { value: formatCount(stats.doctorCount), label: 'Bac si' },
        { value: formatCount(stats.patientCount), label: 'Benh nhan' },
        { value: formatCount(stats.appointmentCount), label: 'Lich kham' },
        { value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0', label: 'Danh gia' },
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
                            <span className="gradient-text">Cham soc suc khoe</span>
                            <br />
                            <span className="text-white">thong minh va tien loi</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                            Dat lich kham voi cac bac si chuyen khoa hang dau.
                            Theo doi suc khoe va quan ly lich hen moi luc, moi noi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="xl" className="group">
                                    Bat dau ngay
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/doctors">
                                <Button variant="outline" size="xl">
                                    Xem danh sach bac si
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
                        <h2 className="text-3xl font-bold text-white mb-4">Chuyen khoa</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Da dang cac chuyen khoa dap ung moi nhu cau kham chua benh cua ban
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
                        <h2 className="text-3xl font-bold text-white mb-4">Tai sao chon chung toi?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Trai nghiem dich vu y te hien dai voi nhieu tien ich vuot troi
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
                                San sang cham soc suc khoe cua ban?
                            </h2>
                            <p className="text-white/80 mb-6 max-w-xl mx-auto">
                                Dang ky ngay hom nay de trai nghiem dich vu dat lich kham hien dai nhat.
                            </p>
                            <Link to="/register">
                                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                                    Dang ky mien phi
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
