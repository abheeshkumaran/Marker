import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: Date, required: true },
        source: {
            type: String,
            required: true,
            enum: ['salary', 'business', 'investment', 'other', 'opening_balance'],
        },
        amount: { type: Number, required: true, min: 0 },
    },
    { timestamps: true, collection: 'income' },
);

IncomeSchema.index(
    { userId: 1, source: 1 },
    {
        unique: true,
        partialFilterExpression: { source: 'opening_balance' },
    },
);

export default mongoose.models.Income || mongoose.model('Income', IncomeSchema);
