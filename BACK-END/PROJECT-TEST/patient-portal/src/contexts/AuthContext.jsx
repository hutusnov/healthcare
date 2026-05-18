/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    }, []);

    const loadUser = useCallback(async () => {
        try {
            const response = await authAPI.getCurrentUser();
            const userData = response.data?.user || response.data?.data?.user || response.data?.data;

            if (!userData) {
                throw new Error('Định dạng phản hồi không hợp lệ');
            }

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
    }, [logout]);

    useEffect(() => {
        if (token) {
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                try {
                    const userData = JSON.parse(savedUser);
                    if (userData.role === 'PATIENT') {
                        setUser(userData);
                        setLoading(false);
                        return;
                    }
                } catch (e) {
                    console.error('Không thể đọc thông tin user đã lưu', e);
                }
            }
            loadUser();
            return;
        }
        setLoading(false);
    }, [token, loadUser]);

    const login = async (email, password) => {
        try {
            const response = await authAPI.login({ email, password });
            const { token: authToken, user: authUser } = response.data.data || response.data;

            if (!authUser || !authToken) {
                throw new Error('Định dạng phản hồi không hợp lệ');
            }

            if (authUser.role !== 'PATIENT') {
                throw new Error('Chỉ bệnh nhân mới có thể đăng nhập vào cổng này.');
            }

            localStorage.setItem('token', authToken);
            localStorage.setItem('user', JSON.stringify(authUser));
            setToken(authToken);
            setUser(authUser);
            return { success: true };
        } catch (error) {
            if (error.response?.status === 401) {
                return { success: false, error: 'Tài khoản hoặc mật khẩu không đúng' };
            }

            const message = error.response?.data?.message || error.message || 'Đăng nhập thất bại';
            return { success: false, error: message };
        }
    };

    const register = async (data) => {
        try {
            const response = await authAPI.register({
                ...data,
                role: 'PATIENT',
            });

            const { token: authToken, user: authUser } = response.data.data || response.data;

            if (authToken && authUser) {
                localStorage.setItem('token', authToken);
                localStorage.setItem('user', JSON.stringify(authUser));
                setToken(authToken);
                setUser(authUser);
            }

            return { success: true, message: 'Đăng ký thành công!' };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Đăng ký thất bại';
            return { success: false, error: message };
        }
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
