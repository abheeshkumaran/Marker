'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

function formatAmount(amount) {
    return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

export default function PaymentChartPage() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        async function loadTransactions() {
            try {
                const response = await fetch('/api/transactions');
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Unable to load transactions.');
                }
                setTransactions(result.transactions);
            } catch (error) {
                setErrorMessage(error.message || 'Unable to load transactions.');
            } finally {
                setIsLoading(false);
            }
        }

        loadTransactions();
    }, []);

    const totalIncome = transactions
        .filter((transaction) => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0);
    const totalExpenses = transactions
        .filter((transaction) => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0);

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-5xl">
                <header className="mb-6 flex items-center justify-between gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Transaction Statement</h1>
                    <Link href="/" className="text-sm font-medium text-indigo-600 underline">
                        Back to home
                    </Link>
                </header>

                <section
                    aria-label="Transaction totals"
                    className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
                >
                    <article className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-500">Net balance</h2>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {formatAmount(totalIncome - totalExpenses)}
                        </p>
                    </article>
                    <article className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-500">Total income</h2>
                        <p className="mt-1 text-xl font-bold text-emerald-700">
                            +{formatAmount(totalIncome)}
                        </p>
                    </article>
                    <article className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-500">Total expenses</h2>
                        <p className="mt-1 text-xl font-bold text-rose-700">
                            -{formatAmount(totalExpenses)}
                        </p>
                    </article>
                </section>

                {isLoading && <p className="text-sm text-gray-500">Loading transactions...</p>}
                {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
                {!isLoading && !errorMessage && (
                    <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 text-gray-500">
                                    <th className="px-4 py-3 font-medium">Date</th>
                                    <th className="px-4 py-3 font-medium">Type</th>
                                    <th className="px-4 py-3 font-medium">Description</th>
                                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-6 text-gray-500">
                                            No income or expense transactions yet.
                                        </td>
                                    </tr>
                                )}
                                {transactions.map((transaction) => (
                                    <tr
                                        key={`${transaction.type}-${transaction.id}`}
                                        className="border-b border-gray-100 last:border-0"
                                    >
                                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                            {formatDate(transaction.date)}
                                        </td>
                                        <td
                                            className={
                                                'px-4 py-3 font-medium capitalize ' +
                                                (transaction.type === 'income'
                                                    ? 'text-emerald-700'
                                                    : 'text-rose-700')
                                            }
                                        >
                                            {transaction.type}
                                        </td>
                                        <td className="px-4 py-3 text-gray-900">
                                            {transaction.description}
                                        </td>
                                        <td
                                            className={
                                                'whitespace-nowrap px-4 py-3 text-right font-semibold ' +
                                                (transaction.type === 'income'
                                                    ? 'text-emerald-700'
                                                    : 'text-rose-700')
                                            }
                                        >
                                            {transaction.type === 'income' ? '+' : '-'}
                                            {formatAmount(transaction.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </main>
    );
}
