import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Youtube } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-dark-300 border-t border-dark-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">UIT</span>
                            </div>
                            <span className="text-white font-semibold text-lg">Healthcare</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-4 max-w-md">
                            Nền tảng chăm sóc sức khỏe trực tuyến, kết nối bệnh nhân với các bác sĩ
                            chuyên khoa hàng đầu. Đặt lịch khám dễ dàng, nhanh chóng và an toàn.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="p-2 bg-dark-200 hover:bg-primary-600 rounded-lg transition-colors">
                                <Facebook className="w-5 h-5 text-gray-400 hover:text-white" />
                            </a>
                            <a href="#" className="p-2 bg-dark-200 hover:bg-red-600 rounded-lg transition-colors">
                                <Youtube className="w-5 h-5 text-gray-400 hover:text-white" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Liên kết nhanh</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/doctors" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Tìm bác sĩ
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/book" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Đặt lịch khám
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/appointments" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Lịch hẹn của tôi
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/ocr" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                                    Quét đơn thuốc
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Liên hệ</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-2 text-gray-400 text-sm">
                                <MapPin className="w-4 h-4 text-primary-500" />
                                <span>Khu phố 6, P.Linh Trung, TP.Thủ Đức, TP.HCM</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-400 text-sm">
                                <Phone className="w-4 h-4 text-primary-500" />
                                <span>(028) 3725 2002</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-400 text-sm">
                                <Mail className="w-4 h-4 text-primary-500" />
                                <span>healthcare@uit.edu.vn</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-8 pt-8 border-t border-dark-100 text-center">
                    <p className="text-gray-500 text-sm">
                        © 2026 UIT Healthcare. Đồ án môn NT114 - Nhóm 15.
                    </p>
                </div>
            </div>
        </footer>
    );
};
