import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      // Try to load user from localStorage first
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.role === 'ADMIN') {
            setUser(userData);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('Failed to parse saved user', e);
        }
      }
      // If no saved user or invalid, try to load from API
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const loadUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data?.user || response.data?.data?.user;

      if (!userData) {
        throw new Error('Invalid response format');
      }

      if (userData.role !== 'ADMIN') {
        throw new Error('Not authorized. Admin access required.');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Failed to load user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login({ email, password });
      // Response format: { success, message, data: { token, user } }
      const { token, user } = response.data.data || response.data;

      if (!user || !token) {
        throw new Error('Invalid response format');
      }

      if (user.role !== 'ADMIN') {
        throw new Error('Not authorized. Admin access required.');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (error) {
      if (error.response?.status === 401) {
        return { success: false, error: 'Tài khoản hoặc mật khẩu không đúng' };
      }

      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
