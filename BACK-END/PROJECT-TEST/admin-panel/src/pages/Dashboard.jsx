import { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { Card, Alert } from '../components/common';
import {
  Users,
  UserCheck,
  Stethoscope,
  FolderHeart,
  Calendar,
  Clock,
  CheckCircle,
  DollarSign,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { useUI } from '../contexts/UIContext';

// eslint-disable-next-line no-unused-vars
const StatCard = ({ title, value, icon: Icon, color, subtitle }) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    indigo: 'bg-indigo-500',
    teal: 'bg-teal-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-shadow">
      <div className={`${colors[color]} p-4 rounded-full text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-gray-600 text-sm font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { language, t } = useUI();
  const [stats, setStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [doctorSlots, setDoctorSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const text = language === 'vi'
    ? {
      failedLoad: 'Không thể tải dữ liệu',
      dashboard: 'Bảng điều khiển',
      totalUsers: 'Tổng người dùng',
      admins: 'quản trị viên',
      totalDoctors: 'Tổng bác sĩ',
      totalPatients: 'Tổng bệnh nhân',
      careProfiles: 'Hồ sơ chăm sóc',
      totalAppointments: 'Tổng lịch hẹn',
      pending: 'Chờ xử lý',
      completed: 'Hoàn thành',
      paidAppointments: 'Lịch hẹn đã thanh toán',
      unpaid: 'chưa thanh toán',
      apptStatus: 'Trạng thái lịch hẹn',
      revenueByMonth: 'Doanh thu theo tháng (PAID)',
      revenueVnd: 'Doanh thu (VND)',
      monthLabel: 'Tháng',
      userRoles: 'Phân bố vai trò người dùng',
      doctorSlotsByMonth: 'Lịch bác sĩ theo tháng (năm hiện tại)',
      doctorSlots: 'Lịch bác sĩ',
      systemOverview: 'Tổng quan hệ thống',
      adminUsers: 'Người dùng admin',
      doctorSlotsTotal: 'Lịch bác sĩ',
      availableSlots: 'Lịch trống',
      bookedSlots: 'Lịch đã đặt',
      userRolesData: {
        admins: 'Quản trị viên',
        doctors: 'Bác sĩ',
        patients: 'Bệnh nhân',
      },
    }
    : {
      failedLoad: 'Failed to load data',
      dashboard: 'Dashboard',
      totalUsers: 'Total Users',
      admins: 'admins',
      totalDoctors: 'Total Doctors',
      totalPatients: 'Total Patients',
      careProfiles: 'Care Profiles',
      totalAppointments: 'Total Appointments',
      pending: 'Pending',
      completed: 'Completed',
      paidAppointments: 'Paid Appointments',
      unpaid: 'unpaid',
      apptStatus: 'Appointment Status',
      revenueByMonth: 'Revenue by Month (PAID)',
      revenueVnd: 'Revenue (VND)',
      monthLabel: 'Month',
      userRoles: 'User Roles Distribution',
      doctorSlotsByMonth: 'Doctor Slots per Month (current year)',
      doctorSlots: 'Doctor Slots',
      systemOverview: 'System Overview',
      adminUsers: 'Admin Users',
      doctorSlotsTotal: 'Doctor Slots',
      availableSlots: 'Available Slots',
      bookedSlots: 'Booked Slots',
      userRolesData: {
        admins: 'Admins',
        doctors: 'Doctors',
        patients: 'Patients',
      },
    };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, appointmentsRes, slotsRes] = await Promise.all([
        adminAPI.getStatistics(),
        adminAPI.getAppointments(),
        adminAPI.getDoctorSlots({ limit: 1000 }),
      ]);

      setStats(statsRes.data.data || statsRes.data);

      const apptData = appointmentsRes.data.data || appointmentsRes.data;
      setAppointments(apptData.appointments || apptData || []);

      const slotData = slotsRes.data.data || slotsRes.data;
      setDoctorSlots(slotData.slots || slotData || []);

      setError('');
    } catch (err) {
      setError(err.response?.data?.message || text.failedLoad);
    } finally {
      setLoading(false);
    }
  };

  // --------- Chart data helpers ----------

  const getAppointmentStatusData = () => {
    if (!Array.isArray(appointments)) return [];

    const statusCounts = appointments.reduce((acc, apt) => {
      acc[apt.status] = (acc[apt.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const getUserRoleData = () => {
    return [
      { name: text.userRolesData.admins, value: stats?.adminUsers || 0 },
      { name: text.userRolesData.doctors, value: stats?.totalDoctors || 0 },
      { name: text.userRolesData.patients, value: stats?.totalPatients || 0 },
    ];
  };

  // Doctor slots per month (current year) – vẫn giữ nếu em muốn
  const getDoctorSlotsMonthlyData = () => {
    if (!Array.isArray(doctorSlots)) return [];

    const year = new Date().getFullYear();
    const counts = Array(12).fill(0);

    doctorSlots.forEach((slot) => {
      const createdAt = slot.createdAt ? new Date(slot.createdAt) : null;
      if (!createdAt) return;
      if (createdAt.getFullYear() !== year) return;
      const monthIndex = createdAt.getMonth(); // 0-11
      counts[monthIndex] += 1;
    });

    return counts.map((value, index) => ({
      month: `${index + 1}`,
      value,
    }));
  };

  // *** Revenue by month from PAID payments ***
  const getRevenueByMonthData = () => {
    if (!Array.isArray(appointments)) return [];

    const year = new Date().getFullYear();
    const totals = Array(12).fill(0);

    appointments.forEach((apt) => {
      if (apt.paymentStatus !== 'PAID') return;

      const payment = apt.payment || {};
      const dateRaw = payment.createdAt || apt.scheduledAt || apt.createdAt;
      if (!dateRaw) return;

      const date = new Date(dateRaw);
      if (date.getFullYear() !== year) return;

      const monthIndex = date.getMonth(); // 0-11
      const amount = typeof payment.amount === 'number' ? payment.amount : 0;

      totals[monthIndex] += amount;
    });

    return totals.map((revenue, index) => ({
      month: `${index + 1}`,
      revenue,
    }));
  };

  const COLORS = {
    PENDING: '#F59E0B',
    CONFIRMED: '#3B82F6',
    COMPLETED: '#10B981',
    CANCELLED: '#EF4444',
    PAID: '#10B981',
    UNPAID: '#EF4444',
    REFUNDED: '#8B5CF6',
  };

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return <Alert type="error" message={error} />;
  }

  const paidCount = appointments.filter((a) => a.paymentStatus === 'PAID').length;
  const unpaidCount = appointments.filter((a) => a.paymentStatus === 'UNPAID').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">{text.dashboard}</h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t('common.refresh', 'Refresh')}
        </button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={text.totalUsers}
          value={stats?.totalUsers || 0}
          icon={Users}
          color="blue"
          subtitle={`${stats?.adminUsers || 0} ${text.admins}`}
        />
        <StatCard
          title={text.totalDoctors}
          value={stats?.totalDoctors || 0}
          icon={Stethoscope}
          color="green"
        />
        <StatCard
          title={text.totalPatients}
          value={stats?.totalPatients || 0}
          icon={UserCheck}
          color="purple"
        />
        <StatCard
          title={text.careProfiles}
          value={stats?.totalCareProfiles || 0}
          icon={FolderHeart}
          color="orange"
        />
      </div>

      {/* Appointment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={text.totalAppointments}
          value={stats?.totalAppointments || 0}
          icon={Calendar}
          color="indigo"
        />
        <StatCard
          title={text.pending}
          value={stats?.pendingAppointments || 0}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title={text.completed}
          value={stats?.completedAppointments || 0}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title={text.paidAppointments}
          value={paidCount}
          icon={DollarSign}
          color="teal"
          subtitle={`${unpaidCount} ${text.unpaid}`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Status Chart */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{text.apptStatus}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getAppointmentStatusData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#3B82F6">
                {getAppointmentStatusData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name] || PIE_COLORS[index]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Revenue by Month (PAID) */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{text.revenueByMonth}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getRevenueByMonthData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) =>
                  `${Number(value || 0).toLocaleString('vi-VN')} đ`
                }
                labelFormatter={(label) => `${text.monthLabel} ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                name={text.revenueVnd}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* User Roles Distribution */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{text.userRoles}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={getUserRoleData()}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {getUserRoleData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Doctor Slots per Month (current year) */}
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {text.doctorSlotsByMonth}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={getDoctorSlotsMonthlyData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" name={text.doctorSlots} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Quick Stats Table */}
      <Card title={text.systemOverview}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">{text.adminUsers}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.adminUsers || 0}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-600 text-sm font-medium">{text.doctorSlotsTotal}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats?.totalDoctorSlots || 0}</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-green-600 text-sm font-medium">{text.availableSlots}</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats?.availableSlots || 0}</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-red-600 text-sm font-medium">{text.bookedSlots}</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats?.bookedSlots || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
