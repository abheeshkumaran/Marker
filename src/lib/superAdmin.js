import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';

export function getSuperAdminCredentials() {
    const username = process.env.SUPER_ADMIN_USERNAME?.trim().toLowerCase();
    const password = process.env.SUPER_ADMIN_PASSWORD;
    return username && password ? { username, password } : null;
}

export async function ensureSuperAdmin() {
    const credentials = getSuperAdminCredentials();
    if (!credentials) {
        throw new Error('SUPER_ADMIN_USERNAME and SUPER_ADMIN_PASSWORD must be configured.');
    }

    await dbConnect();
    let user = await User.findOne({ username: credentials.username }).select('+password');
    if (!user) {
        const password = await bcrypt.hash(credentials.password, 12);
        try {
            user = await User.create({
                username: credentials.username,
                password,
                role: 'superadmin',
            });
        } catch (error) {
            if (error?.code !== 11000) throw error;
            user = await User.findOne({ username: credentials.username }).select('+password');
        }
    }
    if (!user) throw new Error('Unable to initialize the super-admin account.');

    if (user.role !== 'superadmin') {
        throw new Error('The configured super-admin username is already used by a regular account.');
    }

    return user;
}
