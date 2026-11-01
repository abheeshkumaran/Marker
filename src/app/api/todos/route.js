export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import dbConnect from '@/lib/mongoose';
import Todo from '@/models/Todo';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';
import { serializeTodo } from '@/lib/todos';

// GET /api/todos — all todos, newest first.
export async function GET(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    await dbConnect();
    const rows = await Todo.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
    return Response.json({ todos: rows.map(serializeTodo) });
}

// POST /api/todos  { title }
export async function POST(request) {
    const user = await getAuthenticatedUser(request);
    if (!user) return unauthorizedResponse();
    if (user.role === 'superadmin') return forbiddenResponse();

    const data = await request.json().catch(() => ({}));
    const title = typeof data.title === 'string' ? data.title.trim().replace(/\s+/g, ' ') : '';
    if (!title) return Response.json({ errors: { title: 'Write your todo.' } }, { status: 422 });
    if (title.length > 200) {
        return Response.json({ errors: { title: 'Todo can be up to 200 characters.' } }, { status: 422 });
    }

    await dbConnect();
    const todo = await Todo.create({ userId: user._id, title });
    return Response.json({ todo: serializeTodo(todo) }, { status: 201 });
}
