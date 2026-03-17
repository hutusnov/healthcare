import { Link } from 'react-router-dom';
import { Button } from '../components/common';
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

const specialties = [
    { name: 'Nội khoa', icon: Heart, color: 'from-red-500 to-pink-500' },
    { name: 'Thần kinh', icon: Brain, color: 'from-purple-500 to-indigo-500' },
    { name: 'Mắt', icon: Eye, color: 'from-blue-500 to-cyan-500' },
    { name: 'Cơ xương khớp', icon: Bone, color: 'from-orange-500 to-amber-500' },
    { name: 'Nhi khoa', icon: Baby, color: 'from-green-500 to-emerald-500' },
    { name: 'Đa khoa', icon: Stethoscope, color: 'from-primary-500 to-secondary-500' },
];

const features = [
    {
        icon: Calendar,
        title: 'Đặt lịch dễ dàng',
        description: 'Chọn bác sĩ và khung giờ phù hợp chỉ trong vài bước đơn giản.',
    },
    {
        icon: Shield,
        title: 'Bảo mật thông tin',
        description: 'Thông tin y tế của bạn được mã hóa và bảo vệ an toàn tuyệt đối.',
    },
    {
        icon: Clock,
        title: 'Tiết kiệm thời gian',
        description: 'Không cần xếp hàng, đến đúng giờ hẹn và được khám ngay.',
    },
    {
        icon: Star,
        title: 'Bác sĩ chất lượng',
        description: 'Đội ngũ bác sĩ giàu kinh nghiệm, được đánh giá cao.',
    },
];

export const Home = () => {
    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 lg:py-32">
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-600/20 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                            <span className="gradient-text">Chăm sóc sức khỏe</span>
                            <br />
                            <span className="text-white">thông minh và tiện lợi</span>
                        </h1>
                        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                            Đặt lịch khám với các bác sĩ chuyên khoa hàng đầu.
                            Theo dõi sức khỏe và quản lý lịch hẹn mọi lúc, mọi nơi.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button size="xl" className="group">
                                    Bắt đầu ngay
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <Link to="/doctors">
                                <Button variant="outline" size="xl">
                                    Xem danh sách bác sĩ
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { value: '50+', label: 'Bác sĩ' },
                            { value: '10k+', label: 'Bệnh nhân' },
                            { value: '20k+', label: 'Lịch khám' },
                            { value: '4.9', label: 'Đánh giá' },
                        ].map((stat, index) => (
                            <div key={index} className="card text-center">
                                <div className="text-3xl font-bold gradient-text mb-1">{stat.value}</div>
                                <div className="text-gray-400 text-sm">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Specialties Section */}
            <section className="py-16 bg-dark-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Chuyên khoa</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Đa dạng các chuyên khoa đáp ứng mọi nhu cầu khám chữa bệnh của bạn
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

            {/* Features Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Tại sao chọn chúng tôi?</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Trải nghiệm dịch vụ y tế hiện đại với nhiều tiện ích vượt trội
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

            {/* CTA Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-600 to-secondary-600 p-8 md:p-12">
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10"></div>
                        <div className="relative text-center">
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                Sẵn sàng chăm sóc sức khỏe của bạn?
                            </h2>
                            <p className="text-white/80 mb-6 max-w-xl mx-auto">
                                Đăng ký ngay hôm nay để trải nghiệm dịch vụ đặt lịch khám hiện đại nhất.
                            </p>
                            <Link to="/register">
                                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-primary-600">
                                    Đăng ký miễn phí
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
