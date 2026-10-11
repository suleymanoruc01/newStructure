import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { hashPassword } from '../src/auth/password.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 8) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
}
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

const digits = BigInt(
  `0x${createHash('sha256').update(email).digest('hex').slice(0, 12)}`,
)
  .toString()
  .padStart(12, '0')
  .slice(0, 12);
const phoneE164 = `+999${digits}`;

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const passwordHash = await hashPassword(password);
const existing = await prisma.platformAdmin.findUnique({ where: { email } });
if (existing) {
  await prisma.platformAdmin.update({
    where: { id: existing.id },
    data: { passwordHash, role: 'ops' },
  });
} else {
  await prisma.user.create({
    data: {
      phoneE164,
      locale: 'tr-TR',
      status: 'active',
      platformAdmin: {
        create: { role: 'ops', email, passwordHash },
      },
    },
  });
}

await prisma.$disconnect();
await pool.end();
console.log('admin password set');
