import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Loading } from './components/common';
import { PublicLayout } from './components/layout/PublicLayout';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Public pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Register } from './pages/Register';
import { Doctors } from './pages/Doctors';
import { DoctorDetail } from './pages/DoctorDetail';

// Protected pages
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Appointments } from './pages/Appointments';
import { BookAppointment } from './pages/BookAppointment';
import { Payment } from './pages/Payment';
import { PaymentReturn } from './pages/PaymentReturn';
import { Notifications } from './pages/Notifications';
import { OCRScan } from './pages/OCRScan';

function RootEntry() {
    const { user, loading } = useAuth();

    if (loading) {
        return <Loading fullScreen text="Dang tai thong tin dang nhap..." />;
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Home />;
}

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <Routes>
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<RootEntry />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/doctors" element={<Doctors />} />
                        <Route path="/doctors/:id" element={<DoctorDetail />} />
                    </Route>

                    <Route
                        path="/dashboard"
                        element={
                            <ProtectedRoute>
                                <DashboardLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Dashboard />} />
                        <Route path="profile" element={<Profile />} />
                        <Route path="appointments" element={<Appointments />} />
                        <Route path="book" element={<BookAppointment />} />
                        <Route path="payment/:appointmentId" element={<Payment />} />
                        <Route path="notifications" element={<Notifications />} />
                        <Route path="ocr" element={<OCRScan />} />
                    </Route>

                    <Route path="/payment/return" element={<PaymentReturn />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
