import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Menu, X, User, Bell, LogOut, Home, Calendar, Stethoscope, FileText } from 'lucide-react';
import { Button } from '../common/Button';
import { useUI } from '../../contexts/UIContext';

export const Header = () => {
    const { user, logout } = useAuth();
    const { language, theme, toggleLanguage, toggleTheme, t } = useUI();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const publicLinks = [
        { to: '/', label: t('common.home', 'Trang chủ'), icon: Home },
        { to: '/doctors', label: t('common.doctors', 'Bác sĩ'), icon: Stethoscope },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 glass">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">UIT</span>
                        </div>
                        <span className="text-white font-semibold text-lg hidden sm:block">Healthcare</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-6">
                        {publicLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="text-gray-300 hover:text-white transition-colors flex items-center gap-2"
                            >
                                <link.icon className="w-4 h-4" />
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Auth Buttons / User Menu */}
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex items-center gap-2">
                            <button
                                onClick={toggleLanguage}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-100 text-gray-300 hover:text-white"
                                title={t('common.language', 'Ngôn ngữ')}
                            >
                                {language === 'vi' ? 'VI' : 'EN'}
                            </button>
                            <button
                                onClick={toggleTheme}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-100 text-gray-300 hover:text-white"
                                title={t('common.theme', 'Giao diện')}
                            >
                                {theme === 'dark' ? t('common.dark', 'Tối') : t('common.light', 'Sáng')}
                            </button>
                        </div>

                        {user ? (
                            <>
                                {/* Notifications */}
                                <Link
                                    to="/dashboard/notifications"
                                    className="p-2 text-gray-400 hover:text-white hover:bg-dark-100 rounded-lg transition-all relative"
                                >
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </Link>

                                {/* User Menu */}
                                <div className="relative">
                                    <button
                                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                                        className="flex items-center gap-2 p-2 text-gray-300 hover:text-white hover:bg-dark-100 rounded-lg transition-all"
                                    >
                                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="hidden sm:block text-sm">{user.fullName || (language === 'vi' ? 'Người dùng' : 'User')}</span>
                                    </button>

                                    {userMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-dark-200 border border-dark-100 rounded-lg shadow-xl py-2 animate-fadeIn">
                                            <Link
                                                to="/dashboard"
                                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-100"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <Calendar className="w-4 h-4" />
                                                {t('common.dashboard', 'Bảng điều khiển')}
                                            </Link>
                                            <Link
                                                to="/dashboard/profile"
                                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-100"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <User className="w-4 h-4" />
                                                {t('common.profile', 'Hồ sơ cá nhân')}
                                            </Link>
                                            <Link
                                                to="/dashboard/ocr"
                                                className="flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white hover:bg-dark-100"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <FileText className="w-4 h-4" />
                                                {t('common.ocr', 'Quét CCCD')}
                                            </Link>
                                            <hr className="my-2 border-dark-100" />
                                            <button
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-dark-100 w-full"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                {t('common.logout', 'Đăng xuất')}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="hidden sm:flex items-center gap-3">
                                <Link to="/login">
                                    <Button variant="ghost">{t('common.login', 'Đăng nhập')}</Button>
                                </Link>
                                <Link to="/register">
                                    <Button variant="primary">{t('common.register', 'Đăng ký')}</Button>
                                </Link>
                            </div>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 text-gray-400 hover:text-white"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-dark-200 border-t border-dark-100 animate-fadeIn">
                    <div className="px-4 py-4 space-y-2">
                        {publicLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-100 rounded-lg"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <link.icon className="w-5 h-5" />
                                {link.label}
                            </Link>
                        ))}
                        {!user && (
                            <>
                                <hr className="border-dark-100" />
                                <Link
                                    to="/login"
                                    className="block px-3 py-2 text-gray-300 hover:text-white hover:bg-dark-100 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('common.login', 'Đăng nhập')}
                                </Link>
                                <Link
                                    to="/register"
                                    className="block px-3 py-2 text-primary-400 hover:text-primary-300 hover:bg-dark-100 rounded-lg"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    {t('common.register', 'Đăng ký')}
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};
