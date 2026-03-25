import { prisma } from './prisma';

/**
 * 임시 사용자 조회/생성 헬퍼
 * Phase 8에서 NextAuth.js 인증으로 교체 예정
 */
export async function getOrCreateDefaultUser() {
  const defaultEmail = 'admin@blogpilot.local';

  let user = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        name: 'Admin',
      },
    });
  }

  return user;
}
