import mongoose from 'mongoose';

const IncomeSourceSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 60 },
        // lowercase copy of name so "Salary" and "salary" count as the same source
        key: { type: String, required: true },
    },
    { timestamps: true, collection: 'incomesources' },
);

IncomeSourceSchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.models.IncomeSource || mongoose.model('IncomeSource', IncomeSourceSchema);
