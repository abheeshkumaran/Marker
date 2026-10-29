'use client';

import { useEffect, useState } from 'react';

function todayString() {
    const today = new Date();
    return new Date(today.getTime() - today.getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 10);
}

export default function ExpensePage() {
    const [expenseDate, setExpenseDate] = useState('');
    const [categories, setCategories] = useState([]);
    const [categoryId, setCategoryId] = useState('');
    const [otherPurpose, setOtherPurpose] = useState('');
    const [amount, setAmount] = useState('');
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [isSavingCategory, setIsSavingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState('');

    useEffect(() => {
        setExpenseDate(todayString());

        async function loadCategories() {
            try {
                const response = await fetch('/api/expense-categories', { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Unable to load expenses.');
                setCategories(result.items);
            } catch (error) {
                setErrorMessage(error.message || 'Unable to load expenses.');
            } finally {
                setIsLoadingCategories(false);
            }
        }

        loadCategories();
    }, []);

    async function createCategory() {
        setIsSavingCategory(true);
        setCategoryError('');
        try {
            const response = await fetch('/api/expense-categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCategory }),
            });
            const result = await response.json();
            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save expense.');
            }
            setCategories((list) =>
                [...list, result.item].sort((a, b) => a.name.localeCompare(b.name)),
            );
            setCategoryId(result.item.id);
            setNewCategory('');
            setShowNewCategory(false);
        } catch (error) {
            setCategoryError(error.message || 'Unable to save expense.');
        } finally {
            setIsSavingCategory(false);
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const response = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ date: expenseDate, categoryId, otherPurpose, amount }),
            });
            const result = await response.json();

            if (!response.ok) {
                const validationMessage = result.errors
                    ? Object.values(result.errors).join(' ')
                    : result.error;
                throw new Error(validationMessage || 'Unable to save expense.');
            }

            setSuccessMessage(`Marked ${result.expense.amount} for ${result.expense.purpose}.`);
            setCategoryId('');
            setOtherPurpose('');
            setAmount('');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to save expense.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6">
            <section
                aria-labelledby="expense-title"
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            >
                <h1 id="expense-title" className="mb-5 text-xl font-bold text-gray-900">
                    Mark Your Expense
                </h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Expense Date
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={(event) => setExpenseDate(event.target.value)}
                            required
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>

                    <div className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        <label htmlFor="expense-for">Expense For</label>
                        <div className="flex gap-2">
                            <select
                                id="expense-for"
                                value={categoryId}
                                onChange={(event) => setCategoryId(event.target.value)}
                                required
                                className="min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                            >
                                <option value="" disabled>
                                    {isLoadingCategories ? 'Loading expenses...' : 'Choose an expense'}
                                </option>
                                {categories.map((category) => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                                <option value="other">Other</option>
                            </select>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowNewCategory((shown) => !shown);
                                    setCategoryError('');
                                }}
                                aria-expanded={showNewCategory}
                                className="whitespace-nowrap rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                + New
                            </button>
                        </div>
                    </div>

                    {showNewCategory && (
                        <div className="flex flex-col gap-2 rounded-md bg-gray-50 p-3">
                            <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                                New main expense
                                <input
                                    type="text"
                                    value={newCategory}
                                    onChange={(event) => setNewCategory(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            if (newCategory.trim()) createCategory();
                                        }
                                    }}
                                    maxLength={60}
                                    placeholder="e.g. Food, Rent, Travel"
                                    className="rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900"
                                />
                            </label>
                            {categoryError && (
                                <p role="alert" className="text-xs text-red-600">
                                    {categoryError}
                                </p>
                            )}
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowNewCategory(false)}
                                    className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={createCategory}
                                    disabled={isSavingCategory || !newCategory.trim()}
                                    className="rounded-md bg-gray-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {isSavingCategory ? 'Saving...' : 'Save expense'}
                                </button>
                            </div>
                        </div>
                    )}

                    {categoryId === 'other' && (
                        <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                            Your Expense
                            <input
                                type="text"
                                value={otherPurpose}
                                onChange={(event) => setOtherPurpose(event.target.value)}
                                required
                                maxLength={60}
                                placeholder="What was the expense for?"
                                className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                            />
                        </label>
                    )}

                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        Amount
                        <input
                            type="number"
                            value={amount}
                            onChange={(event) => setAmount(event.target.value)}
                            min="0"
                            step="0.01"
                            required
                            placeholder="Enter expense amount"
                            className="rounded-md border border-gray-300 px-3 py-2 text-gray-900"
                        />
                    </label>
                    {errorMessage && (
                        <p role="alert" className="text-sm text-red-600">
                            {errorMessage}
                        </p>
                    )}
                    {successMessage && (
                        <p role="status" className="text-sm text-emerald-700">
                            {successMessage}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white shadow transition hover:bg-rose-700 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Saving...' : 'Mark Your Expense'}
                    </button>
                </form>
            </section>
        </main>
    );
}
