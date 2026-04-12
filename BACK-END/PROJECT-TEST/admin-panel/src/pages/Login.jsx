import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button, Input, Alert } from '../components/common';
import { useUI } from '../contexts/UIContext';

export const Login = () => {
  const { user, login } = useAuth();
  const { language, theme, toggleLanguage, toggleTheme, t } = useUI();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const text = language === 'vi'
    ? {
      passwordPlaceholder: 'Nhập mật khẩu của bạn',
      emailPlaceholder: 'admin@example.com',
      signingIn: 'Đang đăng nhập...',
      toggleLanguage: 'Ngôn ngữ',
      toggleTheme: 'Giao diện',
    }
    : {
      passwordPlaceholder: 'Enter your password',
      emailPlaceholder: 'admin@example.com',
      signingIn: 'Signing in...',
      toggleLanguage: 'Language',
      toggleTheme: 'Theme',
    };

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (!result.success) {
      setError(result.error);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8">
        <div className="flex items-center justify-end gap-2 mb-6">
          <button
            onClick={toggleLanguage}
            className="px-2.5 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            title={text.toggleLanguage}
          >
            {language === 'vi' ? 'VI' : 'EN'}
          </button>
          <button
            onClick={toggleTheme}
            className="px-2.5 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            title={text.toggleTheme}
          >
            {theme === 'dark' ? t('common.dark', 'Dark') : t('common.light', 'Light')}
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('common.adminPanel', 'Admin Panel')}</h1>
          <p className="text-gray-600">{t('common.signInHint', 'Sign in to access the dashboard')}</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert type="error" message={error} onClose={() => setError('')} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('common.email', 'Email')}
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder={text.emailPlaceholder}
          />

          <Input
            label={t('common.password', 'Password')}
            type="password"
            required
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder={text.passwordPlaceholder}
          />

          <Button
            type="submit"
            className="w-full"
            loading={loading}
            disabled={loading}
          >
            {loading ? text.signingIn : t('common.signIn', 'Sign In')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>{t('common.adminAccessRequired', 'Admin access required')}</p>
        </div>
      </div>
    </div>
  );
};
