import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI, careProfileAPI, locationAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Loading } from '../components/common';
import { User, Phone, Mail, MapPin, Calendar, Shield, Plus, Edit2, Trash2 } from 'lucide-react';

export const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [profile, setProfile] = useState(null);
    const [careProfiles, setCareProfiles] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, careRes] = await Promise.all([
                patientAPI.getProfile(),
                careProfileAPI.getAll(),
            ]);

            const profileData = profileRes.data?.data || profileRes.data;
            setProfile(profileData);
            setFormData({
                fullName: profileData?.user?.fullName || user?.fullName || '',
                phone: profileData?.phone || user?.phone || '',
                dateOfBirth: profileData?.dateOfBirth?.split('T')[0] || '',
                gender: profileData?.gender || '',
                address: profileData?.address || '',
            });

            setCareProfiles(careRes.data?.data || careRes.data || []);
        } catch (err) {
            console.error('Lỗi khi tải hồ sơ:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await patientAPI.updateProfile(formData);
            setSuccess('Cập nhật hồ sơ thành công!');
            setEditMode(false);
            loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Không thể cập nhật hồ sơ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Đang tải hồ sơ..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Hồ sơ cá nhân</h1>
                    <p className="text-gray-400 mt-1">Quản lý thông tin cá nhân và hồ sơ chăm sóc</p>
                </div>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            {/* Personal Info */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-400" />
                            Thông tin cá nhân
                        </CardTitle>
                        <Button
                            variant={editMode ? 'ghost' : 'outline'}
                            size="sm"
                            onClick={() => setEditMode(!editMode)}
                        >
                            {editMode ? 'Hủy' : <><Edit2 className="w-4 h-4 mr-1" /> Chỉnh sửa</>}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {editMode ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input
                                label="Họ và tên"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            />
                            <Input
                                label="Số điện thoại"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                            <Input
                                label="Ngày sinh"
                                type="date"
                                value={formData.dateOfBirth}
                                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Giới tính</label>
                                <select
                                    value={formData.gender}
                                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                    className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">Chọn giới tính</option>
                                    <option value="MALE">Nam</option>
                                    <option value="FEMALE">Nữ</option>
                                    <option value="OTHER">Khác</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <Input
                                    label="Địa chỉ"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <Button onClick={handleSave} loading={saving}>
                                    Lưu thay đổi
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary-600/20 rounded-lg">
                                    <User className="w-5 h-5 text-primary-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Họ và tên</p>
                                    <p className="text-white font-medium">{formData.fullName || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-600/20 rounded-lg">
                                    <Mail className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Email</p>
                                    <p className="text-white font-medium">{user?.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-600/20 rounded-lg">
                                    <Phone className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Số điện thoại</p>
                                    <p className="text-white font-medium">{formData.phone || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-600/20 rounded-lg">
                                    <Calendar className="w-5 h-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Ngày sinh</p>
                                    <p className="text-white font-medium">
                                        {formData.dateOfBirth
                                            ? new Date(formData.dateOfBirth).toLocaleDateString('vi-VN')
                                            : 'Chưa cập nhật'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 md:col-span-2">
                                <div className="p-2 bg-orange-600/20 rounded-lg">
                                    <MapPin className="w-5 h-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Địa chỉ</p>
                                    <p className="text-white font-medium">{formData.address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Care Profiles */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-secondary-400" />
                            Hồ sơ chăm sóc ({careProfiles.length})
                        </CardTitle>
                        <Button variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-1" /> Thêm hồ sơ
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {careProfiles.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Chưa có hồ sơ chăm sóc nào</p>
                            <p className="text-gray-500 text-sm mt-1">
                                Thêm hồ sơ để đặt lịch khám cho người thân
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {careProfiles.map((cp) => (
                                <div
                                    key={cp.id}
                                    className="flex items-center justify-between p-4 bg-dark-300 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-secondary-600/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-secondary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{cp.fullName}</p>
                                            <p className="text-gray-400 text-sm">
                                                {cp.relationship || 'Bản thân'} • {cp.dateOfBirth ? new Date(cp.dateOfBirth).toLocaleDateString('vi-VN') : ''}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
