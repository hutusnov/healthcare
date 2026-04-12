import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Alert, Button, Input } from '../components/common';

export const ForgotPassword = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        code: '',
        newPassword: '',
        confirmPassword: '',
    });

    const requestReset = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            await authAPI.forgotPassword(formData.email);
            setSuccess('Nếu email tồn tại, mã xác nhận đã được gửi.');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể gửi mã xác nhận.');
        } finally {
            setLoading(false);
        }
    };

    const submitReset = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);

        try {
            await authAPI.resetPassword({
                email: formData.email,
                code: formData.code,
                newPassword: formData.newPassword,
            });
            setSuccess('Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.');
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4">
            <div className="w-full max-w-md">
                <div className="card">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Quên mật khẩu</h1>
                        <p className="text-gray-400">
                            {step === 1 ? 'Nhập email để nhận mã xác nhận.' : 'Nhập mã và mật khẩu mới.'}
                        </p>
                    </div>

                    {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError('')} /></div>}
                    {success && <div className="mb-4"><Alert type="success" message={success} onClose={() => setSuccess('')} /></div>}

                    {step === 1 ? (
                        <form onSubmit={requestReset} className="space-y-4">
                            <Input
                                type="email"
                                label="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Button type="submit" fullWidth loading={loading}>
                                Gửi mã xác nhận
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={submitReset} className="space-y-4">
                            <Input
                                type="email"
                                label="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                            />
                            <Input
                                type="text"
                                label="Mã xác nhận"
                                value={formData.code}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                required
                            />
                            <Input
                                type="password"
                                label="Mật khẩu mới"
                                value={formData.newPassword}
                                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                required
                            />
                            <Input
                                type="password"
                                label="Xác nhận mật khẩu mới"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                            />
                            <Button type="submit" fullWidth loading={loading}>
                                Đặt lại mật khẩu
                            </Button>
                        </form>
                    )}

                    <div className="mt-6 text-center text-gray-400">
                        <Link to="/login" className="text-primary-400 hover:text-primary-300">
                            Quay lại đăng nhập
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};
