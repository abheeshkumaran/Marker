import PaymentReminders from '../PaymentReminders';

export default function PaymentsPage() {
    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-5xl">
                <h1 className="text-2xl font-bold text-gray-900">Payment Reminders</h1>
                <p className="mb-4 text-sm text-gray-500">
                    Track upcoming installments and mark them paid as you go.
                </p>
                <PaymentReminders />
            </div>
        </main>
    );
}
