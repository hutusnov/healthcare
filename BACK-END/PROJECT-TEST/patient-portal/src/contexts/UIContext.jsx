import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const UIContext = createContext(null);

const LANGUAGE_STORAGE_KEY = 'portal_language';
const THEME_STORAGE_KEY = 'portal_theme';

const MESSAGES = {
  vi: {
    common: {
      home: 'Trang chủ',
      doctors: 'Bác sĩ',
      login: 'Đăng nhập',
      register: 'Đăng ký',
      dashboard: 'Bảng điều khiển',
      profile: 'Hồ sơ cá nhân',
      notifications: 'Thông báo',
      ocr: 'Quét CCCD',
      logout: 'Đăng xuất',
      language: 'Ngôn ngữ',
      theme: 'Giao diện',
      light: 'Sáng',
      dark: 'Tối',
      english: 'Anh',
      vietnamese: 'Việt',
      loadingAuth: 'Đang tải thông tin đăng nhập...',
    },
  },
  en: {
    common: {
      home: 'Home',
      doctors: 'Doctors',
      login: 'Login',
      register: 'Register',
      dashboard: 'Dashboard',
      profile: 'Profile',
      notifications: 'Notifications',
      ocr: 'OCR Scan',
      logout: 'Logout',
      language: 'Language',
      theme: 'Theme',
      light: 'Light',
      dark: 'Dark',
      english: 'English',
      vietnamese: 'Vietnamese',
      loadingAuth: 'Loading authentication...',
    },
  },
};

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'vi';
};

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
};

const getByPath = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj);
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
    root.classList.toggle('theme-light', theme === 'light');
  }, [theme]);

  const value = useMemo(() => {
    const t = (key, fallback = '') => {
      const dictionary = MESSAGES[language] || MESSAGES.vi;
      return getByPath(dictionary, key) ?? fallback;
    };

    const toggleLanguage = () => setLanguage((prev) => (prev === 'vi' ? 'en' : 'vi'));
    const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

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

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
