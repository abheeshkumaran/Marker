import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema(
    {
        date: { type: Date, required: true },
        duePayment: { type: Number, required: true, min: 0 },
        transferTo: { type: String, required: true, trim: true },
        // total number of installments / pendings for this payment
        noOfPendings: { type: Number, required: true, min: 1 },
        // how many have been marked paid — shown as `${paidCount}/${noOfPendings}`
        paidCount: { type: Number, default: 0, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'paid'],
            default: 'pending',
        },
    },
    { timestamps: true },
);

export default mongoose.models.Payment || mongoose.model('Payment', PaymentSchema);
