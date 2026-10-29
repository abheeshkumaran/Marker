'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import OverviewChart from './OverviewChart';

function formatAmount(amount) {
    return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString(undefined, { timeZone: 'UTC' });
}

export default function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function loadDashboard() {
            try {
                const [transactionsResponse, paymentsResponse] = await Promise.all([
                    fetch('/api/transactions', { cache: 'no-store' }),
                    fetch('/api/payments', { cache: 'no-store' }),
                ]);
                const [transactionsResult, paymentsResult] = await Promise.all([
                    transactionsResponse.json(),
                    paymentsResponse.json(),
                ]);
                if (!transactionsResponse.ok) {
                    throw new Error(transactionsResult.error || 'Unable to load transactions.');
                }
                if (!paymentsResponse.ok) {
                    throw new Error(paymentsResult.error || 'Unable to load payments.');
                }
                setTransactions(transactionsResult.transactions);
                setPayments(paymentsResult.payments);
            } catch (error) {
                setErrorMessage(error.message || 'Unable to load your dashboard.');
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const totalIncome = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpenses = transactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0);
    const pendingPayments = payments.filter((payment) => payment.status === 'pending');

    const cards = [
        {
            label: 'Current balance',
            value: formatAmount(totalIncome - totalExpenses),
            className: 'text-gray-900',
        },
        {
            label: 'Total income',
            value: `+${formatAmount(totalIncome)}`,
            className: 'text-emerald-700',
        },
        {
            label: 'Total expenses',
            value: `-${formatAmount(totalExpenses)}`,
            className: 'text-rose-700',
        },
        {
            label: 'Pending payments',
            value: pendingPayments.length,
            className: 'text-amber-700',
        },
    ];

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

                {errorMessage && (
                    <p role="alert" className="mb-6 text-sm text-red-600">
                        {errorMessage}
                    </p>
                )}

                <section
                    aria-label="Summary"
                    className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                    {cards.map(({ label, value, className }) => (
                        <article key={label} className="rounded-lg bg-white p-4 shadow-sm">
                            <h2 className="text-sm font-medium text-gray-500">{label}</h2>
                            <p className={`mt-1 text-xl font-bold ${className}`}>
                                {isLoading ? '…' : value}
                            </p>
                        </article>
                    ))}
                </section>

                <OverviewChart
                    transactions={transactions}
                    payments={payments}
                    isLoading={isLoading}
                />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <section className="rounded-lg bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Recent transactions</h2>
                            <Link
                                href="/payment-chart"
                                className="text-sm font-medium text-indigo-600 hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        {!isLoading && transactions.length === 0 ? (
                            <p className="text-sm text-gray-500">
                                No income or expense transactions yet.
                            </p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {transactions.slice(0, 5).map((transaction) => (
                                    <li
                                        key={`${transaction.type}-${transaction.id}`}
                                        className="flex items-center justify-between gap-4 py-2 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium capitalize text-gray-900">
                                                {transaction.description}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {formatDate(transaction.date)}
                                            </p>
                                        </div>
                                        <span
                                            className={
                                                'whitespace-nowrap font-semibold ' +
                                                (transaction.type === 'income'
                                                    ? 'text-emerald-700'
                                                    : 'text-rose-700')
                                            }
                                        >
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatAmount(transaction.amount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    <section className="rounded-lg bg-white p-4 shadow-sm">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-900">Pending payments</h2>
                            <Link
                                href="/payments"
                                className="text-sm font-medium text-indigo-600 hover:underline"
                            >
                                View all
                            </Link>
                        </div>
                        {!isLoading && pendingPayments.length === 0 ? (
                            <p className="text-sm text-gray-500">No pending payments.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {pendingPayments.slice(0, 5).map((payment) => (
                                    <li
                                        key={payment.id}
                                        className="flex items-center justify-between gap-4 py-2 text-sm"
                                    >
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {payment.transferTo}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Due {formatDate(payment.date)} · installment{' '}
                                                {payment.paidCount + 1}/{payment.noOfPendings}
                                            </p>
                                        </div>
                                        <span className="whitespace-nowrap font-semibold text-amber-700">
                                            {formatAmount(payment.duePayment)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>
            </div>
        </main>
    );
}
