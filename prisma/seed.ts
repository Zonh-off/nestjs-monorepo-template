import 'dotenv/config';
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { PrismaClient } from '@nestjs-monorepo-template/prisma';
import { authConfig } from '@nestjs-monorepo-template/auth';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function seed() {
    console.log('🚀 Seeding admin user...');

    // Construct local seed client with temporary pool
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    const auth = betterAuth({
        ...authConfig,
        database: prismaAdapter(prisma, {
            provider: 'postgresql',
        }),
    });

    try {
        await auth.api.signUpEmail({
            body: {
                email: 'admin@test.com',
                password: 'password123',
                name: 'Admin User',
            }
        });
        console.log('✅ Admin user created successfully!');
        console.log('📧 Email: admin@test.com');
        console.log('🔑 Password: password123');
    } catch (error: any) {
        if (error.message?.includes('already exists') || error.body?.message?.includes('already exists')) {
            console.log('ℹ️ Admin user already exists.');
        } else {
            console.error('❌ Error seeding admin user:', error);
        }
    } finally {
        // Cleanly terminate seed pool
        await pool.end();
    }
}

seed().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
});
