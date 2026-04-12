import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { useUI } from '../../contexts/UIContext';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, theme, toggleLanguage, toggleTheme, t } = useUI();

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-gray-900">
              {t('common.adminPanel', 'Admin Panel')}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                title={t('common.language', 'Language')}
              >
                {language === 'vi' ? 'VI' : 'EN'}
              </button>
              <button
                onClick={toggleTheme}
                className="px-2.5 py-1.5 text-xs rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
                title={t('common.theme', 'Theme')}
              >
                {theme === 'dark' ? t('common.dark', 'Dark') : t('common.light', 'Light')}
              </button>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-700">{user?.fullName}</p>
              <p className="text-gray-500">{user?.email}</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              {t('common.logout', 'Logout')}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
