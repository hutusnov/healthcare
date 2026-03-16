// src/modules/users/users.service.js
const prisma = require('../../config/db');
const { toPagination } = require('../../utils/pagination');


async function me(userId) {
return prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, fullName: true, role: true } });
}

async function getAll(query = {}) {
  const { skip, take, page, pageSize } = toPagination(query);
  const [data, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take,
      select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count(),
  ]);
  return { data, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
}

async function getById(userId) {
return prisma.user.findUnique({
where: { id: userId },
select: { id: true, email: true, fullName: true, role: true, createdAt: true, updatedAt: true }
});
}


module.exports = { me, getAll, getById };