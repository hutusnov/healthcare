import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    User,
    Calendar,
    CalendarPlus,
    Bell,
    FileText,
    CreditCard
} from 'lucide-react';

const navItems = [
    { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard, end: true },
    { to: '/dashboard/profile', label: 'Hồ sơ cá nhân', icon: User },
    { to: '/dashboard/appointments', label: 'Lịch hẹn của tôi', icon: Calendar },
    { to: '/dashboard/book', label: 'Đặt lịch khám', icon: CalendarPlus },
    { to: '/dashboard/notifications', label: 'Thông báo', icon: Bell },
    { to: '/dashboard/ocr', label: 'Quét đơn thuốc', icon: FileText },
];

export const Sidebar = () => {
    return (
        <aside className="w-64 bg-dark-200 border-r border-dark-100 min-h-screen fixed left-0 top-16 pt-6 hidden lg:block">
            <nav className="px-4 space-y-1">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive
                                ? 'bg-primary-600/20 text-primary-400 border-l-4 border-primary-500'
                                : 'text-gray-400 hover:text-white hover:bg-dark-100'
                            }
            `}
                    >
                        <item.icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            {/* OCR Feature Highlight */}
            <div className="mx-4 mt-8 p-4 bg-gradient-to-br from-primary-600/20 to-secondary-600/20 rounded-xl border border-primary-500/30">
                <FileText className="w-8 h-8 text-primary-400 mb-2" />
                <h4 className="text-white font-medium text-sm mb-1">Quét đơn thuốc</h4>
                <p className="text-gray-400 text-xs">
                    Tải ảnh đơn thuốc để trích xuất thông tin tự động bằng AI.
                </p>
            </div>
        </aside>
    );
};
