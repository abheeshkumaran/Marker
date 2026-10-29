import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';

// Shared handlers for the per-user dropdown lists (income sources, expense categories).

const reservedNames = new Set(['other', 'opening_balance']);

function cleanName(value) {
    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function serialize(doc) {
    return { id: String(doc._id), name: doc.name };
}

async function requireUser(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return { response: unauthorizedResponse() };
    if (user.role === 'superadmin') return { response: forbiddenResponse() };
    return { user };
}

export function createListHandlers(Model, label) {
    async function GET(request) {
        const { user, response } = await requireUser(request);
        if (response) return response;

        try {
            await dbConnect();
            const docs = await Model.find({ userId: user._id }).sort({ key: 1 }).lean();
            return Response.json({ items: docs.map(serialize) });
        } catch (error) {
            console.error(`Failed to load ${label} list:`, error);
            return Response.json({ error: `Unable to load ${label} list.` }, { status: 500 });
        }
    }

    async function POST(request) {
        const { user, response } = await requireUser(request);
        if (response) return response;

        const data = await request.json().catch(() => null);
        const name = cleanName(data?.name);
        if (!name || name.length > 60) {
            return Response.json(
                { errors: { name: `Enter a ${label} name (up to 60 characters).` } },
                { status: 422 },
            );
        }
        if (reservedNames.has(name.toLowerCase())) {
            return Response.json(
                { errors: { name: `"${name}" is reserved. Choose another name.` } },
                { status: 422 },
            );
        }

        try {
            await dbConnect();
            const key = name.toLowerCase();
            // the unique index also guards this, but it may not be built yet on a fresh collection
            if (await Model.exists({ userId: user._id, key })) {
                return Response.json(
                    { errors: { name: `This ${label} already exists.` } },
                    { status: 409 },
                );
            }
            const created = await Model.create({ userId: user._id, name, key });
            return Response.json({ item: serialize(created) }, { status: 201 });
        } catch (error) {
            if (error?.code === 11000) {
                return Response.json(
                    { errors: { name: `This ${label} already exists.` } },
                    { status: 409 },
                );
            }
            console.error(`Failed to save ${label}:`, error);
            return Response.json({ error: `Unable to save ${label}.` }, { status: 500 });
        }
    }

    return { GET, POST };
}

export function createDeleteHandler(Model, label) {
    return async function DELETE(request, { params }) {
        const { user, response } = await requireUser(request);
        if (response) return response;

        const { id } = await params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return Response.json({ error: 'Invalid id.' }, { status: 400 });
        }

        await dbConnect();
        const result = await Model.deleteOne({ _id: id, userId: user._id });
        if (!result.deletedCount) {
            return Response.json({ error: `${label} not found.` }, { status: 404 });
        }
        return Response.json({ ok: true });
    };
}

// Resolves the dropdown choice sent by the income/expense forms: a saved item's id,
// or 'other' together with the typed text. Returns { name, refId, isOther } or { error }.
export async function resolveOption(Model, userId, optionId, otherText, label) {
    if (optionId === 'other') {
        const name = cleanName(otherText);
        if (!name || name.length > 60) {
            return { error: `Enter the ${label} (up to 60 characters).` };
        }
        if (name.toLowerCase() === 'opening_balance') {
            return { error: `"${name}" is reserved. Enter another ${label}.` };
        }
        return { name, refId: null, isOther: true };
    }

    if (typeof optionId !== 'string' || !mongoose.Types.ObjectId.isValid(optionId)) {
        return { error: `Select a ${label}.` };
    }
    const doc = await Model.findOne({ _id: optionId, userId }).lean();
    if (!doc) return { error: `Select a valid ${label}.` };
    return { name: doc.name, refId: doc._id, isOther: false };
}
