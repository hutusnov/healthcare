import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Stethoscope,
  FolderHeart,
  Calendar,
  CalendarPlus,
  FileText,
  Clock,
  CalendarCheck,
} from 'lucide-react';
import { useUI } from '../../contexts/UIContext';

export const Sidebar = () => {
  const { language } = useUI();

  const menuItems = language === 'vi'
    ? [
      { path: '/', icon: LayoutDashboard, label: 'Bảng điều khiển' },
      { path: '/users', icon: Users, label: 'Quản lý người dùng' },
      { path: '/add-user', icon: UserPlus, label: 'Thêm người dùng' },
      { path: '/add-doctor', icon: Stethoscope, label: 'Thêm bác sĩ' },
      { path: '/add-care-profile', icon: FolderHeart, label: 'Thêm hồ sơ chăm sóc' },
      { path: '/care-profiles', icon: FileText, label: 'Xem hồ sơ chăm sóc' },
      { path: '/add-doctor-slot', icon: Calendar, label: 'Thêm lịch bác sĩ' },
      { path: '/doctor-slots', icon: Clock, label: 'Xem lịch bác sĩ' },
      { path: '/add-appointment', icon: CalendarPlus, label: 'Thêm lịch hẹn' },
      { path: '/appointments', icon: CalendarCheck, label: 'Xem lịch hẹn' },
    ]
    : [
      { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/users', icon: Users, label: 'Manage Users' },
      { path: '/add-user', icon: UserPlus, label: 'Add User' },
      { path: '/add-doctor', icon: Stethoscope, label: 'Add Doctor' },
      { path: '/add-care-profile', icon: FolderHeart, label: 'Add Care Profile' },
      { path: '/care-profiles', icon: FileText, label: 'View Care Profiles' },
      { path: '/add-doctor-slot', icon: Calendar, label: 'Add Doctor Slot' },
      { path: '/doctor-slots', icon: Clock, label: 'View Doctor Slots' },
      { path: '/add-appointment', icon: CalendarPlus, label: 'Add Appointment' },
      { path: '/appointments', icon: CalendarCheck, label: 'View Appointments' },
    ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-8">{language === 'vi' ? 'Quản trị y tế' : 'Medical Admin'}</h2>
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
