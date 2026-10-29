import mongoose from 'mongoose';

const ExpenseSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: Date, required: true },
        // name of the expense category at the time of saving, or the "Other" text
        purpose: { type: String, required: true, trim: true, maxlength: 60 },
        // saved category picked from the dropdown; null when "Other" was used
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', default: null },
        isOther: { type: Boolean, default: false },
        amount: { type: Number, required: true, min: 0 },
    },
    { timestamps: true, collection: 'expenses' },
);

export default mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);
