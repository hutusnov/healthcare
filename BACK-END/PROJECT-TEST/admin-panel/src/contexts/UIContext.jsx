import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

const LANGUAGE_STORAGE_KEY = 'admin_language';
const THEME_STORAGE_KEY = 'admin_theme';

const MESSAGES = {
  vi: {
    common: {
      adminPanel: 'Bảng quản trị',
      logout: 'Đăng xuất',
      language: 'Ngôn ngữ',
      theme: 'Giao diện',
      light: 'Sáng',
      dark: 'Tối',
      signIn: 'Đăng nhập',
      signInHint: 'Đăng nhập để truy cập hệ thống',
      password: 'Mật khẩu',
      email: 'Email',
      adminAccessRequired: 'Yêu cầu quyền quản trị viên',
      refresh: 'Làm mới',
    },
  },
  en: {
    common: {
      adminPanel: 'Admin Panel',
      logout: 'Logout',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      signIn: 'Sign In',
      signInHint: 'Sign in to access the dashboard',
      password: 'Password',
      email: 'Email',
      adminAccessRequired: 'Admin access required',
      refresh: 'Refresh',
    },
  },
};

const getByPath = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'vi' ? 'vi' : 'en';
};

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
};

export const UIProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const root = document.documentElement;
    root.classList.toggle('theme-dark', theme === 'dark');
  }, [theme]);

  const value = useMemo(() => {
    const t = (key, fallback = '') => {
      const dictionary = MESSAGES[language] || MESSAGES.en;
      return getByPath(dictionary, key) ?? fallback;
    };

    const toggleLanguage = () => setLanguage((prev) => (prev === 'en' ? 'vi' : 'en'));
    const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

    return {
      language,
      setLanguage,
      toggleLanguage,
      theme,
      setTheme,
      toggleTheme,
      t,
    };
  }, [language, theme]);

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
