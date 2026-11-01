export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import mongoose from 'mongoose';
import dbConnect from '@/lib/mongoose';
import Todo from '@/models/Todo';
import { getAuthenticatedUser, forbiddenResponse, unauthorizedResponse } from '@/lib/authorization';
import { serializeTodo } from '@/lib/todos';

async function findTodo(request, params) {
    const user = await getAuthenticatedUser(request);
    if (!user) return { response: unauthorizedResponse() };
    if (user.role === 'superadmin') return { response: forbiddenResponse() };

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return { response: Response.json({ error: 'Invalid id.' }, { status: 400 }) };
    }

    await dbConnect();
    const todo = await Todo.findOne({ _id: id, userId: user._id });
    if (!todo) return { response: Response.json({ error: 'Todo not found.' }, { status: 404 }) };
    return { todo };
}

// PATCH /api/todos/:id  { status: 'pending' | 'completed' }
export async function PATCH(request, { params }) {
    const { todo, response } = await findTodo(request, params);
    if (response) return response;

    const data = await request.json().catch(() => ({}));
    if (!['pending', 'completed'].includes(data.status)) {
        return Response.json({ error: 'Status must be pending or completed.' }, { status: 422 });
    }

    todo.status = data.status;
    todo.completedAt = data.status === 'completed' ? new Date() : null;
    await todo.save();
    return Response.json({ todo: serializeTodo(todo) });
}

// DELETE /api/todos/:id
export async function DELETE(request, { params }) {
    const { todo, response } = await findTodo(request, params);
    if (response) return response;

    await todo.deleteOne();
    return Response.json({ ok: true });
}
