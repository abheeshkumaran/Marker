import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: Date, required: true },
        purpose: { type: String, required: true, trim: true },
        amount: { type: Number, required: true, min: 0 },
    },
    { timestamps: true, collection: 'expenses' },
);

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
