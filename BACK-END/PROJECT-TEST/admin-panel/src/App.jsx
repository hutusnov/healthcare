import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { UIProvider } from './contexts/UIContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { AddUser } from './pages/AddUser';
import { AddDoctor } from './pages/AddDoctor';
import { AddCareProfile } from './pages/AddCareProfile';
import { AddDoctorSlot } from './pages/AddDoctorSlot';
import { AddAppointment } from './pages/AddAppointment';
import { ManageUsers } from './pages/ManageUsers';
// import { ViewData } from './pages/ViewData';
import { ViewCareProfiles } from './pages/ViewCareProfiles';
import { ViewDoctorSlots } from './pages/ViewDoctorSlots';
import { ViewAppointments } from './pages/ViewAppointments';

function App() {
  return (
    <BrowserRouter>
      <UIProvider>
        <AuthProvider>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/add-user" element={<AddUser />} />
                    <Route path="/add-doctor" element={<AddDoctor />} />
                    <Route path="/add-care-profile" element={<AddCareProfile />} />
                    <Route path="/add-doctor-slot" element={<AddDoctorSlot />} />
                    <Route path="/add-appointment" element={<AddAppointment />} />
                    <Route path="/users" element={<ManageUsers />} />
                    {/* <Route path="/view-data" element={<ViewData />} /> */}
                    <Route path="/care-profiles" element={<ViewCareProfiles />} />
                    <Route path="/doctor-slots" element={<ViewDoctorSlots />} />
                    <Route path="/appointments" element={<ViewAppointments />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            }
          />
          </Routes>
        </AuthProvider>
      </UIProvider>
    </BrowserRouter>
  );
}

export default App;
