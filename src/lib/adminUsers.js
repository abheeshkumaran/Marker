import { isEnvSuperAdmin } from '@/lib/superAdmin';

export const roles = ['user', 'superadmin'];

export function serializeAdminUser(user) {
    return {
        id: String(user._id),
        username: user.username,
        role: user.role,
        connectingCode: user.connectingCode || null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        // the super-admin from .env is managed there, not from the panel
        managedByEnv: isEnvSuperAdmin(user.username),
    };
}

// Validates { username, password, role }. On update a blank password means "keep the current one".
export function validateUserInput(data, { isUpdate = false } = {}) {
    const username = String(data?.username ?? '').trim().toLowerCase();
    const password = String(data?.password ?? '');
    const role = data?.role ?? 'user';

    const errors = {};
    if (!username) errors.username = 'Username is required.';
    else if (username.length > 60) errors.username = 'Username can be up to 60 characters.';
    else if (/\s/.test(username)) errors.username = 'Username cannot contain spaces.';

    if (!password) {
        if (!isUpdate) errors.password = 'Password is required.';
    } else if (password.length < 4) {
        errors.password = 'Password must be at least 4 characters.';
    }

    if (!roles.includes(role)) errors.role = 'Choose a valid role.';
    if (isEnvSuperAdmin(username)) errors.username = 'That username is reserved for the .env super-admin.';

    return { username, password, role, errors };
}
