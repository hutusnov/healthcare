import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert } from '../components/common';
import { Mail, Lock, Eye, EyeOff, User, Phone } from 'lucide-react';

export const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        // Validation
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp');
            return;
        }

        if (formData.password.length < 8) {
            setError('Mật khẩu phải có ít nhất 8 ký tự');
            return;
        }

        setLoading(true);

        const result = await register({
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
        });

        if (result.success) {
            setSuccess(result.message);
            setTimeout(() => {
                navigate('/dashboard');
            }, 1500);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary-600/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-secondary-600/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-xl">UIT</span>
                        </div>
                        <span className="text-white font-semibold text-xl">Healthcare</span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="card">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Đăng ký tài khoản</h1>
                        <p className="text-gray-400">Tạo tài khoản để bắt đầu đặt lịch khám</p>
                    </div>

                    {error && (
                        <div className="mb-4">
                            <Alert type="error" message={error} onClose={() => setError('')} />
                        </div>
                    )}

                    {success && (
                        <div className="mb-4">
                            <Alert type="success" message={success} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type="text"
                                placeholder="Họ và tên"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                className="pl-10"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="pl-10"
                                required
                            />
                        </div>

                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type="tel"
                                placeholder="Số điện thoại"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="pl-10"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mật khẩu (ít nhất 8 ký tự)"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="pl-10 pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Xác nhận mật khẩu"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="pl-10"
                                required
                            />
                        </div>

                        <div className="text-sm text-gray-400">
                            <label className="flex items-start gap-2">
                                <input type="checkbox" className="mt-1 rounded bg-dark-300 border-dark-100" required />
                                <span>
                                    Tôi đồng ý với{' '}
                                    <a href="#" className="text-primary-400 hover:text-primary-300">Điều khoản sử dụng</a>
                                    {' '}và{' '}
                                    <a href="#" className="text-primary-400 hover:text-primary-300">Chính sách bảo mật</a>
                                </span>
                            </label>
                        </div>

                        <Button type="submit" fullWidth loading={loading} size="lg">
                            Đăng ký
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-gray-400">
                        Đã có tài khoản?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">
                            Đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
