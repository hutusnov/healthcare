export const LANGUAGE_STORAGE_KEY = 'portal_language';
export const THEME_STORAGE_KEY = 'portal_theme';

export const MESSAGES = {
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

export const getByPath = (obj, path) =>
  path.split('.').reduce((current, key) => current?.[key], obj);
