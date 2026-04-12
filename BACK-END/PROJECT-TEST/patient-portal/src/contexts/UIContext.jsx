import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { LANGUAGE_STORAGE_KEY, THEME_STORAGE_KEY, MESSAGES, getByPath } from './uiMessages';

const UIContext = createContext(null);

const getInitialLanguage = () => {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return stored === 'en' ? 'en' : 'vi';
};

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
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

// eslint-disable-next-line react-refresh/only-export-components
export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
