import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientAPI, careProfileAPI } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Alert, Loading } from '../components/common';
import { User, Phone, Mail, MapPin, Calendar, Shield, Edit2, Plus, Trash2 } from 'lucide-react';
import { getApiData, getListData, normalizeCareProfile } from '../utils/normalize';
import { useUI } from '../contexts/UIContext';

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
    country: 'Việt Nam',
    province: '',
    district: '',
    ward: '',
    address: '',
};

export const Profile = () => {
    const { language } = useUI();
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

        const text = language === 'vi'
                ? {
                        loadError: 'Không thể tải hồ sơ.',
                        savePatientSuccess: 'Cập nhật hồ sơ bệnh nhân thành công.',
                        savePatientError: 'Không thể cập nhật hồ sơ',
                        saveCareSuccess: 'Cập nhật hồ sơ chăm sóc thành công.',
                        createCareSuccess: 'Tạo hồ sơ chăm sóc thành công.',
                        saveCareError: 'Không thể lưu hồ sơ chăm sóc.',
                        deleteConfirm: 'Bạn có chắc chắn muốn xóa hồ sơ chăm sóc này?',
                        deleteSuccess: 'Đã xóa hồ sơ chăm sóc.',
                        deleteError: 'Không thể xóa hồ sơ chăm sóc.',
                        loading: 'Đang tải hồ sơ...',
                        pageTitle: 'Hồ sơ cá nhân',
                        pageSubtitle: 'Quản lý thông tin bệnh nhân và hồ sơ chăm sóc',
                        patientInfo: 'Thông tin bệnh nhân',
                        cancel: 'Hủy',
                        edit: 'Chỉnh sửa',
                        dob: 'Ngày sinh',
                        gender: 'Giới tính',
                        selectGender: 'Chọn giới tính',
                        male: 'Nam',
                        female: 'Nữ',
                        other: 'Khác',
                        address: 'Địa chỉ',
                        insuranceNo: 'Số BHYT',
                        emergencyContact: 'Liên hệ khẩn cấp',
                        saveChanges: 'Lưu thay đổi',
                        fullName: 'Họ và tên',
                        email: 'Email',
                        phone: 'Số điện thoại',
                        notUpdated: 'Chưa cập nhật',
                        careProfiles: 'Hồ sơ chăm sóc',
                        createProfile: 'Tạo hồ sơ',
                        editCare: 'Cập nhật hồ sơ chăm sóc',
                        createCare: 'Tạo hồ sơ chăm sóc mới',
                        relation: 'Quan hệ',
                        country: 'Quốc gia',
                        province: 'Tỉnh/Thành phố',
                        district: 'Quận/Huyện',
                        ward: 'Phường/Xã',
                        detailedAddress: 'Địa chỉ chi tiết',
                        note: 'Ghi chú',
                        saveProfile: 'Lưu hồ sơ',
                        createCareBtn: 'Tạo hồ sơ',
                        noCareProfiles: 'Chưa có hồ sơ chăm sóc nào',
                        noCareProfilesDesc: 'Tạo hồ sơ để đặt lịch khám cho bản thân hoặc người thân.',
                        self: 'Bản thân',
                        validationName: 'Vui lòng nhập họ và tên.',
                        validationRelation: 'Vui lòng nhập quan hệ.',
                        validationDob: 'Vui lòng chọn ngày sinh.',
                        validationAddress: 'Vui lòng nhập đầy đủ tỉnh/thành, quận/huyện, phường/xã và địa chỉ.',
                    }
                : {
                        loadError: 'Unable to load profile.',
                        savePatientSuccess: 'Patient profile updated successfully.',
                        savePatientError: 'Unable to update profile',
                        saveCareSuccess: 'Care profile updated successfully.',
                        createCareSuccess: 'Care profile created successfully.',
                        saveCareError: 'Unable to save care profile.',
                        deleteConfirm: 'Are you sure you want to delete this care profile?',
                        deleteSuccess: 'Care profile deleted.',
                        deleteError: 'Unable to delete care profile.',
                        loading: 'Loading profile...',
                        pageTitle: 'Profile',
                        pageSubtitle: 'Manage patient information and care profiles',
                        patientInfo: 'Patient information',
                        cancel: 'Cancel',
                        edit: 'Edit',
                        dob: 'Date of birth',
                        gender: 'Gender',
                        selectGender: 'Select gender',
                        male: 'Male',
                        female: 'Female',
                        other: 'Other',
                        address: 'Address',
                        insuranceNo: 'Health insurance number',
                        emergencyContact: 'Emergency contact',
                        saveChanges: 'Save changes',
                        fullName: 'Full name',
                        email: 'Email',
                        phone: 'Phone number',
                        notUpdated: 'Not updated',
                        careProfiles: 'Care profiles',
                        createProfile: 'Create profile',
                        editCare: 'Update care profile',
                        createCare: 'Create new care profile',
                        relation: 'Relationship',
                        country: 'Country',
                        province: 'Province/City',
                        district: 'District',
                        ward: 'Ward',
                        detailedAddress: 'Detailed address',
                        note: 'Note',
                        saveProfile: 'Save profile',
                        createCareBtn: 'Create profile',
                        noCareProfiles: 'No care profiles yet',
                        noCareProfilesDesc: 'Create a profile to book appointments for yourself or your family.',
                        self: 'Self',
                        validationName: 'Please enter full name.',
                        validationRelation: 'Please enter relationship.',
                        validationDob: 'Please select date of birth.',
                        validationAddress: 'Please provide province/city, district, ward, and detailed address.',
                    };

        const dateLocale = language === 'vi' ? 'vi-VN' : 'en-US';

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
            console.error('Lỗi khi tải hồ sơ:', err);
            setError(text.loadError);
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
            setSuccess(text.savePatientSuccess);
            setEditMode(false);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || text.savePatientError);
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
            country: careProfile.country || 'Việt Nam',
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
        if (!careProfileForm.fullName.trim()) return text.validationName;
        if (!careProfileForm.relation.trim()) return text.validationRelation;
        if (!careProfileForm.dob) return text.validationDob;
        if (!careProfileForm.province.trim() || !careProfileForm.district.trim() || !careProfileForm.ward.trim() || !careProfileForm.address.trim()) {
            return text.validationAddress;
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
                setSuccess(text.saveCareSuccess);
            } else {
                await careProfileAPI.create(payload);
                setSuccess(text.createCareSuccess);
            }
            closeCareProfileForm();
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || text.saveCareError);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCareProfile = async (id) => {
        if (!confirm(text.deleteConfirm)) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            await careProfileAPI.delete(id);
            setSuccess(text.deleteSuccess);
            await loadData();
        } catch (err) {
            setError(err.response?.data?.message || text.deleteError);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <Loading fullScreen text={text.loading} />;
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div>
                <h1 className="text-2xl font-bold text-white">{text.pageTitle}</h1>
                <p className="text-gray-400 mt-1">{text.pageSubtitle}</p>
            </div>

            {error && <Alert type="error" message={error} onClose={() => setError('')} />}
            {success && <Alert type="success" message={success} onClose={() => setSuccess('')} />}

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-primary-400" />
                            {text.patientInfo}
                        </CardTitle>
                        <Button variant={editMode ? 'ghost' : 'outline'} size="sm" onClick={() => setEditMode(!editMode)}>
                            {editMode ? text.cancel : <><Edit2 className="w-4 h-4 mr-1" /> {text.edit}</>}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {editMode ? (
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label={text.dob} type="date" value={profileForm.dob} onChange={(e) => setProfileForm({ ...profileForm, dob: e.target.value })} />
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{text.gender}</label>
                                <select
                                    value={profileForm.gender}
                                    onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                                    className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">{text.selectGender}</option>
                                    <option value="Nam">{text.male}</option>
                                    <option value="Nữ">{text.female}</option>
                                    <option value="Khác">{text.other}</option>
                                </select>
                            </div>
                            <Input label={text.address} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} />
                            <Input label={text.insuranceNo} value={profileForm.insuranceNumber} onChange={(e) => setProfileForm({ ...profileForm, insuranceNumber: e.target.value })} />
                            <div className="md:col-span-2">
                                <Input label={text.emergencyContact} value={profileForm.emergencyContact} onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })} />
                            </div>
                            <div className="md:col-span-2">
                                <Button onClick={handleSavePatientProfile} loading={saving}>{text.saveChanges}</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3"><div className="p-2 bg-primary-600/20 rounded-lg"><User className="w-5 h-5 text-primary-400" /></div><div><p className="text-gray-400 text-sm">{text.fullName}</p><p className="text-white font-medium">{user?.fullName || text.notUpdated}</p></div></div>
                            <div className="flex items-center gap-3"><div className="p-2 bg-green-600/20 rounded-lg"><Mail className="w-5 h-5 text-green-400" /></div><div><p className="text-gray-400 text-sm">{text.email}</p><p className="text-white font-medium">{user?.email || text.notUpdated}</p></div></div>
                            <div className="flex items-center gap-3"><div className="p-2 bg-blue-600/20 rounded-lg"><Phone className="w-5 h-5 text-blue-400" /></div><div><p className="text-gray-400 text-sm">{text.phone}</p><p className="text-white font-medium">{user?.phone || text.notUpdated}</p></div></div>
                            <div className="flex items-center gap-3"><div className="p-2 bg-purple-600/20 rounded-lg"><Calendar className="w-5 h-5 text-purple-400" /></div><div><p className="text-gray-400 text-sm">{text.dob}</p><p className="text-white font-medium">{profileForm.dob ? new Date(profileForm.dob).toLocaleDateString(dateLocale) : text.notUpdated}</p></div></div>
                            <div className="flex items-center gap-3 md:col-span-2"><div className="p-2 bg-orange-600/20 rounded-lg"><MapPin className="w-5 h-5 text-orange-400" /></div><div><p className="text-gray-400 text-sm">{text.address}</p><p className="text-white font-medium">{profileForm.address || text.notUpdated}</p></div></div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-secondary-400" />
                            {text.careProfiles} ({careProfiles.length})
                        </CardTitle>
                        <Button size="sm" onClick={openCreateCareProfile}>
                            <Plus className="w-4 h-4 mr-1" />
                            {text.createProfile}
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {careProfileMode !== 'closed' && (
                        <div className="mb-6 p-4 bg-dark-300 rounded-lg border border-dark-100">
                            <h3 className="text-white font-semibold mb-4">
                                {careProfileMode === 'edit' ? text.editCare : text.createCare}
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <Input label={text.fullName} value={careProfileForm.fullName} onChange={(e) => setCareProfileForm({ ...careProfileForm, fullName: e.target.value })} />
                                <Input label={text.relation} value={careProfileForm.relation} onChange={(e) => setCareProfileForm({ ...careProfileForm, relation: e.target.value })} />
                                <Input label={text.dob} type="date" value={careProfileForm.dob} onChange={(e) => setCareProfileForm({ ...careProfileForm, dob: e.target.value })} />
                                <Input label={text.gender} value={careProfileForm.gender} onChange={(e) => setCareProfileForm({ ...careProfileForm, gender: e.target.value })} />
                                <Input label={text.phone} value={careProfileForm.phone} onChange={(e) => setCareProfileForm({ ...careProfileForm, phone: e.target.value })} />
                                <Input label={text.email} type="email" value={careProfileForm.email} onChange={(e) => setCareProfileForm({ ...careProfileForm, email: e.target.value })} />
                                <Input label={text.insuranceNo} value={careProfileForm.insuranceNo} onChange={(e) => setCareProfileForm({ ...careProfileForm, insuranceNo: e.target.value })} />
                                <Input label={text.country} value={careProfileForm.country} onChange={(e) => setCareProfileForm({ ...careProfileForm, country: e.target.value })} />
                                <Input label={text.province} value={careProfileForm.province} onChange={(e) => setCareProfileForm({ ...careProfileForm, province: e.target.value })} />
                                <Input label={text.district} value={careProfileForm.district} onChange={(e) => setCareProfileForm({ ...careProfileForm, district: e.target.value })} />
                                <Input label={text.ward} value={careProfileForm.ward} onChange={(e) => setCareProfileForm({ ...careProfileForm, ward: e.target.value })} />
                                <Input label={text.detailedAddress} value={careProfileForm.address} onChange={(e) => setCareProfileForm({ ...careProfileForm, address: e.target.value })} />
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{text.note}</label>
                                    <textarea
                                        value={careProfileForm.note}
                                        onChange={(e) => setCareProfileForm({ ...careProfileForm, note: e.target.value })}
                                        className="w-full bg-dark-300 border border-dark-100 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary-500 min-h-[100px]"
                                    />
                                </div>
                                <div className="md:col-span-2 flex gap-3">
                                    <Button onClick={handleSaveCareProfile} loading={saving}>
                                        {careProfileMode === 'edit' ? text.saveProfile : text.createCareBtn}
                                    </Button>
                                    <Button variant="ghost" onClick={closeCareProfileForm}>{text.cancel}</Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {careProfiles.length === 0 ? (
                        <div className="text-center py-8">
                            <Shield className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400">{text.noCareProfiles}</p>
                            <p className="text-gray-500 text-sm mt-1">{text.noCareProfilesDesc}</p>
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
                                                {careProfile.relation || text.self}
                                                {careProfile.dob ? ` • ${new Date(careProfile.dob).toLocaleDateString(dateLocale)}` : ''}
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
