import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { bn } from '../locales/bn.js';
import { en } from '../locales/en.js';
import { apiLogin, apiRegister, apiLogout, apiGetMe } from '../lib/api.js';

const AppContext = createContext(null);

const STORAGE_KEY_LANG = 'hisabkhata_lang';
const STORAGE_KEY_THEME = 'hisabkhata_theme';

export function AppProvider({ children }) {
  // 1. Language state: Bengali ('bn') is default
  const [language, setLanguageState] = useState(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY_LANG);
      if (savedLang === 'en' || savedLang === 'bn') {
        return savedLang;
      }
    } catch {
      // fallback
    }
    return 'bn';
  });

  // 2. Theme state: Light mode default, respect persisted preference
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // fallback
    }
    return 'light';
  });

  // 3. Navigation & Modal States
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    actionBadge: ''
  });

  // 4. Authentication State
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Restore current session on initial page load
  useEffect(() => {
    let mounted = true;

    async function checkCurrentSession() {
      try {
        const currentUser = await apiGetMe();
        if (mounted && currentUser) {
          setUser(currentUser);
        }
      } catch (err) {
        // Backend not ready or unauthenticated; remains guest
      } finally {
        if (mounted) {
          setIsAuthLoading(false);
        }
      }
    }

    checkCurrentSession();

    return () => {
      mounted = false;
    };
  }, []);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    try {
      localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch (e) {
      console.warn('Unable to persist theme to localStorage', e);
    }
  }, [theme]);

  // Sync language with html lang attribute and localStorage
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(STORAGE_KEY_LANG, language);
    } catch (e) {
      console.warn('Unable to persist language to localStorage', e);
    }
  }, [language]);

  // Set Language handler
  const setLanguage = useCallback((lang) => {
    if (lang === 'bn' || lang === 'en') {
      setLanguageState(lang);
    }
  }, []);

  // Set Theme handler
  const setTheme = useCallback((newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  }, []);

  // Toggle Theme handler
  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // Translation lookup helper
  const t = useCallback((path) => {
    const dict = language === 'bn' ? bn : en;
    const parts = path.split('.');
    let curr = dict;
    for (const part of parts) {
      if (curr && typeof curr === 'object' && part in curr) {
        curr = curr[part];
      } else {
        // Fallback to English if missing in Bengali
        let fallback = en;
        for (const fbPart of parts) {
          if (fallback && typeof fallback === 'object' && fbPart in fallback) {
            fallback = fallback[fbPart];
          } else {
            return path;
          }
        }
        return fallback || path;
      }
    }
    return curr;
  }, [language]);

  // Modal helpers
  const openPreviewModal = useCallback((title, message, actionBadge = '') => {
    setModalState({
      isOpen: true,
      title,
      message,
      actionBadge
    });
  }, []);

  const closeModal = useCallback(() => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const toggleMobileNav = useCallback(() => {
    setIsMobileNavOpen((prev) => !prev);
  }, []);

  const closeMobileNav = useCallback(() => {
    setIsMobileNavOpen(false);
  }, []);

  // Auth Modal helpers
  const openAuthModal = useCallback(() => {
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // Auth Actions
  const handleLogin = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    setUser(data.user);
    return data;
  }, []);

  const handleRegister = useCallback(async (fullName, email, password) => {
    const data = await apiRegister(fullName, email, password);
    setUser(data.user);
    return data;
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = {
    language,
    setLanguage,
    theme,
    setTheme,
    toggleTheme,
    t,
    activeNav,
    setActiveNav,
    isMobileNavOpen,
    toggleMobileNav,
    closeMobileNav,
    modalState,
    openPreviewModal,
    closeModal,
    // Auth context
    user,
    isAuthenticated: Boolean(user),
    isAuthLoading,
    isAuthModalOpen,
    openAuthModal,
    closeAuthModal,
    handleLogin,
    handleRegister,
    handleLogout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
