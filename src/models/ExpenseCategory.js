import mongoose from 'mongoose';

const ExpenseCategorySchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 60 },
        // lowercase copy of name so "Food" and "food" count as the same category
        key: { type: String, required: true },
    },
    { timestamps: true, collection: 'expensecategories' },
);

ExpenseCategorySchema.index({ userId: 1, key: 1 }, { unique: true });

export default mongoose.models.ExpenseCategory ||
    mongoose.model('ExpenseCategory', ExpenseCategorySchema);
