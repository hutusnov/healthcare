const prisma = require('../../config/db');

async function getHomeStats() {
  const [doctorCount, patientCount, appointmentCount, ratingAgg] = await Promise.all([
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.appointment.count(),
    prisma.doctorProfile.aggregate({
      _avg: { rating: true },
      where: { rating: { not: null } },
    }),
  ]);

  return {
    doctorCount,
    patientCount,
    appointmentCount,
    averageRating: Number(ratingAgg?._avg?.rating || 0),
  };
}

module.exports = { getHomeStats };
