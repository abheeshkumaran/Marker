import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        title: { type: String, required: true, trim: true, maxlength: 200 },
        status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
        completedAt: { type: Date, default: null },
    },
    { timestamps: true, collection: 'todos' },
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.Todo) mongoose.deleteModel('Todo');

export default mongoose.models.Todo || mongoose.model('Todo', TodoSchema);
