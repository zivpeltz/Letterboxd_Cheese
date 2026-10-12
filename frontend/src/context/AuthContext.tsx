import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, User, Cheese } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  
  // Modals state
  authModalOpen: boolean;
  authModalMode: 'signin' | 'register';
  openAuthModal: (mode?: 'signin' | 'register') => void;
  closeAuthModal: () => void;

  logModalOpen: boolean;
  activeCheeseForLog: Cheese | null;
  openLogModal: (cheese?: Cheese) => void;
  closeLogModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('cheeseboxd_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal states
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [activeCheeseForLog, setActiveCheeseForLog] = useState<Cheese | null>(null);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const data = await api.getMe();
        setUser(data.user);
      } catch (err) {
        console.warn('Session expired or invalid token');
        localStorage.removeItem('cheeseboxd_token');
        setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (usernameOrEmail: string, password: string) => {
    const data = await api.login(usernameOrEmail, password);
    localStorage.setItem('cheeseboxd_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
  };

  const register = async (username: string, email: string, password: string, displayName: string) => {
    const data = await api.register(username, email, password, displayName);
    localStorage.setItem('cheeseboxd_token', data.token);
    setToken(data.token);
    setUser(data.user);
    setAuthModalOpen(false);
  };

  const logout = () => {
    localStorage.removeItem('cheeseboxd_token');
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const data = await api.getMe();
      setUser(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  const openAuthModal = (mode: 'signin' | 'register' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  const openLogModal = (cheese?: Cheese) => {
    if (!user) {
      openAuthModal('signin');
      return;
    }
    setActiveCheeseForLog(cheese || null);
    setLogModalOpen(true);
  };

  const closeLogModal = () => {
    setLogModalOpen(false);
    setActiveCheeseForLog(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        logModalOpen,
        activeCheeseForLog,
        openLogModal,
        closeLogModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
