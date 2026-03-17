export const getApiData = (response) => response?.data?.data ?? response?.data ?? null;

export const getListData = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.items)) return payload.items;
    return [];
};

export const formatCurrencyVnd = (amount) => {
    const value = Number(amount || 0);
    return `${value.toLocaleString('vi-VN')}d`;
};

export const getDoctorFee = (doctor) => {
    const directFee = Number(doctor?.fee);
    if (Number.isFinite(directFee) && directFee > 0) return directFee;
    return 150000;
};

export const normalizeDoctor = (doctor) => {
    if (!doctor) return null;

    const id = doctor.id ?? doctor.userId ?? doctor.doctorUserId ?? null;
    const fullName = doctor.user?.fullName || doctor.fullName || 'Bac si';
    const profile = doctor.doctor || doctor.profile || null;
    const specialty = doctor.specialty || profile?.specialty || 'Da khoa';
    const clinicName = doctor.clinicName || profile?.clinicName || doctor.hospital || 'Phong kham UIT Healthcare';
    const yearsExperience = doctor.yearsExperience ?? profile?.yearsExperience ?? doctor.experience ?? 0;
    const rating = doctor.rating ?? profile?.rating ?? 0;
    const fee = doctor.fee ?? profile?.fee ?? doctor.consultationFee ?? null;

    return {
        ...doctor,
        id,
        fullName,
        specialty,
        clinicName,
        yearsExperience,
        rating,
        fee,
    };
};

export const normalizeSlot = (slot) => {
    if (!slot) return null;

    const start = slot.start ? new Date(slot.start) : null;
    const end = slot.end ? new Date(slot.end) : null;
    const startLabel = start && !Number.isNaN(start.getTime())
        ? start.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';
    const endLabel = end && !Number.isNaN(end.getTime())
        ? end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : '';
    const dateLabel = start && !Number.isNaN(start.getTime())
        ? start.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
        : '';

    return {
        ...slot,
        start,
        end,
        startLabel,
        endLabel,
        dateLabel,
        timeLabel: startLabel && endLabel ? `${startLabel} - ${endLabel}` : startLabel,
    };
};

export const normalizeAppointment = (appointment) => {
    if (!appointment) return null;

    const doctor = normalizeDoctor(appointment.doctor);
    const scheduledAt = appointment.scheduledAt ? new Date(appointment.scheduledAt) : null;
    const slot = normalizeSlot(appointment.slot);
    const careProfile = appointment.careProfile
        ? {
            ...appointment.careProfile,
            relation: appointment.careProfile.relation || appointment.careProfile.relationship || '',
            dob: appointment.careProfile.dob || appointment.careProfile.dateOfBirth || null,
        }
        : null;

    return {
        ...appointment,
        doctor,
        slot,
        careProfile,
        scheduledAt,
        paymentAmount: appointment.payment?.amount || getDoctorFee(doctor),
        isPaid: appointment.paymentStatus === 'PAID',
    };
};

export const normalizeNotification = (notification) => ({
    ...notification,
    isRead: Boolean(notification?.readAt),
    content: notification?.body || notification?.message || notification?.content || '',
});

export const normalizeCareProfile = (careProfile) => ({
    ...careProfile,
    relation: careProfile?.relation || careProfile?.relationship || '',
    dob: careProfile?.dob || careProfile?.dateOfBirth || null,
});
