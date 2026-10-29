import mongoose from 'mongoose';

const IncomeSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: Date, required: true },
        // name of the source at the time of saving ('opening_balance' for the starting balance)
        source: { type: String, required: true, trim: true, maxlength: 60 },
        // saved source picked from the dropdown; null when "Other" was used
        sourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'IncomeSource', default: null },
        isOther: { type: Boolean, default: false },
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
