/* eslint-disable react-refresh/only-export-components */
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
                    // Patient portal: accept PATIENT role
                    if (userData.role === 'PATIENT') {
                        setUser(userData);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error('Không thể đọc thông tin user đã lưu', e);
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
            const userData = response.data?.user || response.data?.data?.user || response.data?.data;

            if (!userData) {
                throw new Error('Định dạng phản hồi không hợp lệ');
            }

            // Patient portal accepts PATIENT role only
            if (userData.role !== 'PATIENT') {
                throw new Error('Chỉ bệnh nhân mới có thể truy cập. Vui lòng sử dụng ứng dụng phù hợp.');
            }

            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
            console.error('Không thể tải thông tin user:', error);
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
                throw new Error('Định dạng phản hồi không hợp lệ');
            }

            // Only allow PATIENT role
            if (user.role !== 'PATIENT') {
                throw new Error('Chỉ bệnh nhân mới có thể đăng nhập vào cổng này.');
            }

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            setToken(token);
            setUser(user);
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
            return { success: false, error: message };
        }
    };

    const register = async (data) => {
        try {
            const response = await authAPI.register({
                ...data,
                role: 'PATIENT', // Force PATIENT role
            });

            const { token, user } = response.data.data || response.data;

            if (token && user) {
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                setToken(token);
                setUser(user);
            }

            return { success: true, message: 'Đăng ký thành công!' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Đăng ký thất bại';
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
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth phải được sử dụng trong AuthProvider');
    }
    return context;
};
