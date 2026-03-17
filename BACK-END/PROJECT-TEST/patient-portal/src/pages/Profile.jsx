import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI, careProfileAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Loading } from '../components/common';
import { User, Phone, Mail, MapPin, Calendar, Shield, Edit2, Plus, Trash2 } from 'lucide-react';
import { getApiData, getListData, normalizeCareProfile } from '../utils/normalize';

const emptyCareProfile = {
    id: null,
    fullName: '',
    relation: '',
    dob: '',
    gender: '',
    phone: '',
    email: '',
    insuranceNo: '',
    note: '',
    country: 'Viet Nam',
    province: '',
    district: '',
    ward: '',
    address: '',
};

export const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [careProfiles, setCareProfiles] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [careProfileMode, setCareProfileMode] = useState('closed');
    const [profileForm, setProfileForm] = useState({
        dob: '',
        gender: '',
        address: '',
        insuranceNumber: '',
        emergencyContact: '',
    });
    const [careProfileForm, setCareProfileForm] = useState(emptyCareProfile);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [profileRes, careRes] = await Promise.all([
                patientAPI.getProfile(),
                careProfileAPI.getAll(),
            ]);

            const profileData = getApiData(profileRes);
            setProfileForm({
                dob: profileData?.dob?.split('T')[0] || '',
                gender: profileData?.gender || '',
                address: profileData?.address || '',
                insuranceNumber: profileData?.insuranceNumber || '',
                emergencyContact: profileData?.emergencyContact || '',
            });

            const careItems = getListData(getApiData(careRes)).map(normalizeCareProfile);
            setCareProfiles(careItems);
        } catch (err) {
            console.error('Loi khi tai ho so:', err);
            setError('Khong the tai ho so.');
        } finally {
            setLoading(false);
        }
    };

    const handleSavePatientProfile = async () => {
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await patientAPI.updateProfile({
                dob: profileForm.dob || null,
                gender: profileForm.gender || null,
                address: profileForm.address || null,
                insuranceNumber: profileForm.insuranceNumber || null,
                emergencyContact: profileForm.emergencyContact || null,
            });
            setSuccess('Cap nhat ho so benh nhan thanh cong.');
            setEditMode(false);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Khong the cap nhat ho so');
        } finally {
            setSaving(false);
        }
    };

    const openCreateCareProfile = () => {
        setCareProfileForm(emptyCareProfile);
        setCareProfileMode('create');
        setError('');
        setSuccess('');
    };

    const openEditCareProfile = (careProfile) => {
        setCareProfileForm({
            id: careProfile.id,
            fullName: careProfile.fullName || '',
            relation: careProfile.relation || '',
            dob: careProfile.dob ? String(careProfile.dob).split('T')[0] : '',
            gender: careProfile.gender || '',
            phone: careProfile.phone || '',
            email: careProfile.email || '',
            insuranceNo: careProfile.insuranceNo || '',
            note: careProfile.note || '',
            country: careProfile.country || 'Viet Nam',
            province: careProfile.province || '',
            district: careProfile.district || '',
            ward: careProfile.ward || '',
            address: careProfile.address || '',
        });
        setCareProfileMode('edit');
        setError('');
        setSuccess('');
    };

    const closeCareProfileForm = () => {
        setCareProfileMode('closed');
        setCareProfileForm(emptyCareProfile);
    };

    const validateCareProfile = () => {
        if (!careProfileForm.fullName.trim()) return 'Vui long nhap ho va ten.';
        if (!careProfileForm.relation.trim()) return 'Vui long nhap quan he.';
        if (!careProfileForm.dob) return 'Vui long chon ngay sinh.';
        if (!careProfileForm.province.trim() || !careProfileForm.district.trim() || !careProfileForm.ward.trim() || !careProfileForm.address.trim()) {
            return 'Vui long nhap day du tinh/thanh, quan/huyen, phuong/xa va dia chi.';
        }
        return '';
    };

    const handleSaveCareProfile = async () => {
        const validationError = validateCareProfile();
        if (validationError) {
            setError(validationError);
            return;
        }

        setSaving(true);
        setError('');
        setSuccess('');

        const payload = {
            fullName: careProfileForm.fullName.trim(),
            relation: careProfileForm.relation.trim(),
            dob: careProfileForm.dob,
            gender: careProfileForm.gender || null,
            phone: careProfileForm.phone || null,
            email: careProfileForm.email || null,
            insuranceNo: careProfileForm.insuranceNo || null,
            note: careProfileForm.note || null,
            country: careProfileForm.country || null,
            province: careProfileForm.province.trim(),
            district: careProfileForm.district.trim(),
            ward: careProfileForm.ward.trim(),
            address: careProfileForm.address.trim(),
        };

        try {
            if (careProfileMode === 'edit' && careProfileForm.id) {
                await careProfileAPI.update(careProfileForm.id, payload);
                setSuccess('Cap nhat ho so cham soc thanh cong.');
            } else {
                await careProfileAPI.create(payload);
                setSuccess('Tao ho so cham soc thanh cong.');
            }
            closeCareProfileForm();
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Khong the luu ho so cham soc.');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCareProfile = async (id) => {
        if (!confirm('Ban co chac chan muon xoa ho so cham soc nay?')) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await careProfileAPI.delete(id);
            setSuccess('Da xoa ho so cham soc.');
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || 'Khong the xoa ho so cham soc.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text="Dang tai ho so..." />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">Ho so ca nhan</h1>
                <p className="text-gray-400 mt-1">Quan ly thong tin benh nhan va ho so cham soc</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-400" />
                            Thong tin benh nhan
                        </CardTitle>
                        <Button variant={editMode ? 'ghost' : 'outline'} size="sm" onClick={() => setEditMode(!editMode)}>
                            {editMode ? 'Huy' : <><Edit2 className="w-4 h-4 mr-1" /> Chinh sua</>}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {editMode ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Ngay sinh" type="date" value={profileForm.dob} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Gioi tinh</label>
                                <select
                                    value={profileForm.gender}
                                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                    className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">Chon gioi tinh</option>
                                    <option value="Nam">Nam</option>
                                    <option value="Nu">Nu</option>
                                    <option value="Khac">Khac</option>
                                </select>
                            </div>
                            <Input label="Dia chi" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                            <Input label="So BHYT" value={profileForm.insuranceNumber} onChange={(e) => setProfileForm({ ...profileForm, insuranceNumber: e.target.value })} />
                            <div className="md:col-span-2">
                                <Input label="Lien he khan cap" value={profileForm.emergencyContact} onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <Button onClick={handleSavePatientProfile} loading={saving}>Luu thay doi</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3"><div className="p-2 bg-primary-600/20 rounded-lg"><User className="w-5 h-5 text-primary-400" /></div><div><p className="text-gray-400 text-sm">Ho va ten</p><p className="text-white font-medium">{user?.fullName || 'Chua cap nhat'}</p></div></div>
                            <div className="flex items-center gap-3"><div className="p-2 bg-green-600/20 rounded-lg"><Mail className="w-5 h-5 text-green-400" /></div><div><p className="text-gray-400 text-sm">Email</p><p className="text-white font-medium">{user?.email || 'Chua cap nhat'}</p></div></div>
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-600/20 rounded-lg"><Phone className="w-5 h-5 text-blue-400" /></div><div><p className="text-gray-400 text-sm">So dien thoai</p><p className="text-white font-medium">{user?.phone || 'Chua cap nhat'}</p></div></div>
                            <div className="flex items-center gap-3"><div className="p-2 bg-purple-600/20 rounded-lg"><Calendar className="w-5 h-5 text-purple-400" /></div><div><p className="text-gray-400 text-sm">Ngay sinh</p><p className="text-white font-medium">{profileForm.dob ? new Date(profileForm.dob).toLocaleDateString('vi-VN') : 'Chua cap nhat'}</p></div></div>
                            <div className="flex items-center gap-3 md:col-span-2"><div className="p-2 bg-orange-600/20 rounded-lg"><MapPin className="w-5 h-5 text-orange-400" /></div><div><p className="text-gray-400 text-sm">Dia chi</p><p className="text-white font-medium">{profileForm.address || 'Chua cap nhat'}</p></div></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-secondary-400" />
                            Ho so cham soc ({careProfiles.length})
                        </CardTitle>
                        <Button size="sm" onClick={openCreateCareProfile}>
                            <Plus className="w-4 h-4 mr-1" />
                            Tao ho so
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {careProfileMode !== 'closed' && (
                        <div className="mb-6 p-4 bg-dark-300 rounded-lg border border-dark-100">
                            <h3 className="text-white font-semibold mb-4">
                                {careProfileMode === 'edit' ? 'Cap nhat ho so cham soc' : 'Tao ho so cham soc moi'}
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label="Ho va ten" value={careProfileForm.fullName} onChange={(e) => setCareProfileForm({ ...careProfileForm, fullName: e.target.value })} />
                                <Input label="Quan he" value={careProfileForm.relation} onChange={(e) => setCareProfileForm({ ...careProfileForm, relation: e.target.value })} />
                                <Input label="Ngay sinh" type="date" value={careProfileForm.dob} onChange={(e) => setCareProfileForm({ ...careProfileForm, dob: e.target.value })} />
                                <Input label="Gioi tinh" value={careProfileForm.gender} onChange={(e) => setCareProfileForm({ ...careProfileForm, gender: e.target.value })} />
                                <Input label="So dien thoai" value={careProfileForm.phone} onChange={(e) => setCareProfileForm({ ...careProfileForm, phone: e.target.value })} />
                                <Input label="Email" type="email" value={careProfileForm.email} onChange={(e) => setCareProfileForm({ ...careProfileForm, email: e.target.value })} />
                                <Input label="So BHYT" value={careProfileForm.insuranceNo} onChange={(e) => setCareProfileForm({ ...careProfileForm, insuranceNo: e.target.value })} />
                                <Input label="Quoc gia" value={careProfileForm.country} onChange={(e) => setCareProfileForm({ ...careProfileForm, country: e.target.value })} />
                                <Input label="Tinh/Thanh pho" value={careProfileForm.province} onChange={(e) => setCareProfileForm({ ...careProfileForm, province: e.target.value })} />
                                <Input label="Quan/Huyen" value={careProfileForm.district} onChange={(e) => setCareProfileForm({ ...careProfileForm, district: e.target.value })} />
                                <Input label="Phuong/Xa" value={careProfileForm.ward} onChange={(e) => setCareProfileForm({ ...careProfileForm, ward: e.target.value })} />
                                <Input label="Dia chi chi tiet" value={careProfileForm.address} onChange={(e) => setCareProfileForm({ ...careProfileForm, address: e.target.value })} />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Ghi chu</label>
                                    <textarea
                                        value={careProfileForm.note}
                                        onChange={(e) => setCareProfileForm({ ...careProfileForm, note: e.target.value })}
                                        className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 min-h-[100px]"
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-3">
                                    <Button onClick={handleSaveCareProfile} loading={saving}>
                                        {careProfileMode === 'edit' ? 'Luu ho so' : 'Tao ho so'}
                                    </Button>
                                    <Button variant="ghost" onClick={closeCareProfileForm}>Huy</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {careProfiles.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">Chua co ho so cham soc nao</p>
                            <p className="text-gray-500 text-sm mt-1">Tao ho so de dat lich kham cho ban than hoac nguoi than.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {careProfiles.map((careProfile) => (
                                <div key={careProfile.id} className="flex items-center justify-between p-4 bg-dark-300 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-secondary-600/20 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-secondary-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{careProfile.fullName}</p>
                                            <p className="text-gray-400 text-sm">
                                                {careProfile.relation || 'Ban than'}
                                                {careProfile.dob ? ` • ${new Date(careProfile.dob).toLocaleDateString('vi-VN')}` : ''}
                                            </p>
                                            <p className="text-gray-500 text-xs">
                                                {[careProfile.ward, careProfile.district, careProfile.province].filter(Boolean).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEditCareProfile(careProfile)}>
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteCareProfile(careProfile.id)}>
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
