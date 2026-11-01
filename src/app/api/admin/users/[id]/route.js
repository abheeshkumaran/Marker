export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import User from '@/models/User';
import Expense from '@/models/Expense';
import ExpenseCategory from '@/models/ExpenseCategory';
import Income from '@/models/Income';
import IncomeSource from '@/models/IncomeSource';
import Payment from '@/models/Payment';
import RentalEntry from '@/models/RentalEntry';
import RentalRate from '@/models/RentalRate';
import RentalSource from '@/models/RentalSource';
import Todo from '@/models/Todo';
import { generateUniqueConnectingCode } from '@/lib/connectingCode';
import { getSuperAdmin } from '@/lib/authorization';
import { serializeAdminUser, validateUserInput } from '@/lib/adminUsers';
import { isEnvSuperAdmin } from '@/lib/superAdmin';

const ownedModels = [
    Income,
    Expense,
    IncomeSource,
    ExpenseCategory,
    Payment,
    RentalSource,
    RentalRate,
    RentalEntry,
    Todo,
];

async function findTarget(request, params) {
    const admin = await getSuperAdmin(request);
    if (!admin) {
        return { response: Response.json({ error: 'Super-admin access is required.' }, { status: 403 }) };
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { response: Response.json({ error: 'Invalid id.' }, { status: 400 }) };
    }

    await dbConnect();
    const user = await User.findById(id).select('+password');
    if (!user) return { response: Response.json({ error: 'User not found.' }, { status: 404 }) };
    if (isEnvSuperAdmin(user.username)) {
        return {
            response: Response.json(
                { error: 'The .env super-admin is managed in the .env file.' },
                { status: 403 },
            ),
        };
    }
    return { admin, user };
}

// PATCH /api/admin/users/:id  { username, password?, role }
// A blank password keeps the current one.
export async function PATCH(request, { params }) {
    const { admin, user, response } = await findTarget(request, params);
    if (response) return response;

    const data = await request.json().catch(() => ({}));
    const { username, password, role, errors } = validateUserInput(data, { isUpdate: true });
    if (String(user._id) === String(admin._id) && role !== 'superadmin') {
        errors.role = 'You cannot remove your own super-admin role.';
    }
    if (Object.keys(errors).length) return Response.json({ errors }, { status: 422 });

    if (await User.exists({ username, _id: { $ne: user._id } })) {
        return Response.json({ errors: { username: 'That username is already taken.' } }, { status: 422 });
    }

    user.username = username;
    user.role = role;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (role === 'user' && !user.connectingCode) {
        user.connectingCode = await generateUniqueConnectingCode(User);
    }

    try {
        await user.save();
    } catch (error) {
        if (error?.code === 11000) {
            return Response.json({ errors: { username: 'That username is already taken.' } }, { status: 422 });
        }
        throw error;
    }
    return Response.json({ user: serializeAdminUser(user) });
}

// DELETE /api/admin/users/:id — removes the account and all of its financial data.
export async function DELETE(request, { params }) {
    const { admin, user, response } = await findTarget(request, params);
    if (response) return response;

    if (String(user._id) === String(admin._id)) {
        return Response.json({ error: 'You cannot delete your own account.' }, { status: 403 });
    }

    await Promise.all(ownedModels.map((Model) => Model.deleteMany({ userId: user._id })));
    await user.deleteOne();
    return Response.json({ ok: true });
}
