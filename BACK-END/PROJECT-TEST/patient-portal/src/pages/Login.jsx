import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert } from '../components/common';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const from = location.state?.from?.pathname || '/dashboard';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email, formData.password);

        if (result.success) {
            navigate(from, { replace: true });
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

                {/* Login Card */}
                <div className="card">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Đăng nhập</h1>
                        <p className="text-gray-400">Chào mừng bạn quay trở lại!</p>
                    </div>

                    {error && (
                        <div className="mb-4">
                            <Alert type="error" message={error} onClose={() => setError('')} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
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
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mật khẩu"
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

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-gray-400">
                                <input type="checkbox" className="rounded bg-dark-300 border-dark-100" />
                                <span>Ghi nhớ đăng nhập</span>
                            </label>
                            <Link to="/forgot-password" className="text-primary-400 hover:text-primary-300">
                                Quên mật khẩu?
                            </Link>
                        </div>

                        <Button type="submit" fullWidth loading={loading} size="lg">
                            Đăng nhập
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-gray-400">
                        Chưa có tài khoản?{' '}
                        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium">
                            Đăng ký ngay
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
