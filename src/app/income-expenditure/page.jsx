'use client';

import { useEffect, useMemo, useState } from 'react';

const chartHeight = 360;
const padding = { top: 20, right: 24, bottom: 40, left: 72 };
const pointStep = 56;
const minChartWidth = 720;
const tooltipWidth = 240;
const incomeColor = '#10b981';
const expenseColor = '#f43f5e';
const balanceColor = '#6b7280';

const reports = [
    { value: 'all', label: 'All', description: 'Running totals of all your income and expenses over time.' },
    { value: 'daily', label: 'Daily', description: 'Total income and expenses for each day.' },
    { value: 'monthly', label: 'Monthly', description: 'Total income and expenses for each month.' },
    { value: 'yearly', label: 'Yearly', description: 'Total income and expenses for each year.' },
];

function formatAmount(amount) {
    return Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

// Dates are stored as UTC midnight, so group on the UTC calendar.
function periodKey(date, report) {
    const iso = new Date(date).toISOString();
    if (report === 'yearly') return iso.slice(0, 4);
    if (report === 'monthly') return iso.slice(0, 7);
    return iso.slice(0, 10);
}

function periodLabel(date, report) {
    const options =
        report === 'yearly'
            ? { year: 'numeric', timeZone: 'UTC' }
            : report === 'monthly'
              ? { month: 'short', year: 'numeric', timeZone: 'UTC' }
              : { timeZone: 'UTC' };
    return new Date(date).toLocaleDateString(undefined, options);
}

// One point per day / month / year with that period's income and expense totals.
// "all" uses days too, but the totals keep accumulating so the lines show the running total.
// The opening balance is not income, so it stays out of the income line; instead the balance
// line starts from it and moves with every income and expense (balance at the end of each period).
function buildPoints(transactions, report, openingBalance) {
    const ordered = transactions
        .filter((t) => t.description !== 'Net Balance')
        .sort(
            (a, b) =>
                new Date(a.date) - new Date(b.date) ||
                new Date(a.createdAt) - new Date(b.createdAt),
        );

    const points = [];
    for (const transaction of ordered) {
        const key = periodKey(transaction.date, report === 'all' ? 'daily' : report);
        let point = points[points.length - 1];
        if (!point || point.key !== key) {
            point = {
                key,
                label: periodLabel(transaction.date, report === 'all' ? 'daily' : report),
                income: 0,
                expense: 0,
                incomeItems: [],
                expenseItems: [],
            };
            points.push(point);
        }
        point[transaction.type] += transaction.amount;
        point[`${transaction.type}Items`].push(transaction);
    }

    let balance = openingBalance;
    for (const point of points) {
        balance += point.income - point.expense;
        point.balance = balance;
    }

    if (report === 'all') {
        let income = 0;
        let expense = 0;
        for (const point of points) {
            income += point.income;
            expense += point.expense;
            point.periodIncome = point.income;
            point.periodExpense = point.expense;
            point.income = income;
            point.expense = expense;
        }
    }
    return points;
}

// Smooth curve through the points (monotone cubic, so it never overshoots between two points).
function smoothPath(coords) {
    if (!coords.length) return '';
    const [first] = coords;
    if (coords.length === 1) return `M${first.x},${first.y}`;

    const slopes = coords
        .slice(0, -1)
        .map((point, index) => (coords[index + 1].y - point.y) / (coords[index + 1].x - point.x));
    const tangents = coords.map((_, index) => {
        if (index === 0) return slopes[0];
        if (index === coords.length - 1) return slopes[index - 1];
        const before = slopes[index - 1];
        const after = slopes[index];
        return before * after <= 0 ? 0 : (before + after) / 2;
    });
    slopes.forEach((slope, index) => {
        if (slope === 0) {
            tangents[index] = 0;
            tangents[index + 1] = 0;
            return;
        }
        const a = tangents[index] / slope;
        const b = tangents[index + 1] / slope;
        const sum = a * a + b * b;
        if (sum > 9) {
            const scale = 3 / Math.sqrt(sum);
            tangents[index] = scale * a * slope;
            tangents[index + 1] = scale * b * slope;
        }
    });

    let path = `M${first.x},${first.y}`;
    for (let index = 1; index < coords.length; index += 1) {
        const from = coords[index - 1];
        const to = coords[index];
        const third = (to.x - from.x) / 3;
        path += ` C${from.x + third},${from.y + tangents[index - 1] * third} ${to.x - third},${to.y - tangents[index] * third} ${to.x},${to.y}`;
    }
    return path;
}

function ticks(min, max, count = 5) {
    return Array.from({ length: count }, (_, index) => min + ((max - min) / (count - 1)) * index);
}

function ItemList({ items, color }) {
    if (!items.length) return null;
    return (
        <ul className="mt-0.5 space-y-0.5 pl-2">
            {items.slice(0, 3).map((item) => (
                <li key={`${item.type}-${item.id}`} className="flex justify-between gap-2 text-gray-300">
                    <span className="truncate capitalize">{item.description}</span>
                    <span className={color}>{formatAmount(item.amount)}</span>
                </li>
            ))}
            {items.length > 3 && <li className="text-gray-400">+{items.length - 3} more</li>}
        </ul>
    );
}

export default function IncomeExpenditurePage() {
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [report, setReport] = useState('all');
    const [activeIndex, setActiveIndex] = useState(null);
    const [balanceInput, setBalanceInput] = useState('');
    const [balanceMessage, setBalanceMessage] = useState({ type: '', text: '' });
    const [isSavingBalance, setIsSavingBalance] = useState(false);

    async function loadTransactions() {
        try {
            const response = await fetch('/api/transactions', { cache: 'no-store' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Unable to load transactions.');
            setTransactions(result.transactions);
            const opening = result.transactions.find((t) => t.description === 'Net Balance');
            setBalanceInput(opening ? String(opening.amount) : '');
        } catch (error) {
            setErrorMessage(error.message || 'Unable to load transactions.');
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        loadTransactions();
    }, []);

    const openingBalance = transactions
        .filter((t) => t.description === 'Net Balance')
        .reduce((total, t) => total + t.amount, 0);
    const hasOpeningBalance = transactions.some((t) => t.description === 'Net Balance');

    const points = useMemo(
        () => buildPoints(transactions, report, openingBalance),
        [transactions, report, openingBalance],
    );

    const sumType = (type) =>
        transactions
            .filter((t) => t.type === type && t.description !== 'Net Balance')
            .reduce((total, t) => total + t.amount, 0);
    const totalIncome = sumType('income');
    const totalExpenses = sumType('expense');

    async function saveBalance(event) {
        event.preventDefault();
        setBalanceMessage({ type: '', text: '' });
        setIsSavingBalance(true);
        try {
            const response = await fetch('/api/current-balance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: balanceInput }),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(result.errors?.amount || result.error || 'Unable to save current balance.');
            }
            await loadTransactions();
            setBalanceMessage({
                type: 'success',
                text: hasOpeningBalance ? 'Current balance updated.' : 'Current balance saved.',
            });
        } catch (error) {
            setBalanceMessage({ type: 'error', text: error.message });
        } finally {
            setIsSavingBalance(false);
        }
    }

    const width = Math.max(minChartWidth, points.length * pointStep + padding.left + padding.right);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    // the balance can drop below zero, so the scale may need room under the axis
    const values = points.flatMap((point) => [point.income, point.expense, point.balance]);
    const yMax = Math.max(1, ...values) * 1.1;
    const lowest = Math.min(0, ...values);
    const yMin = lowest < 0 ? lowest * 1.1 : 0;
    const y = (value) => padding.top + plotHeight - ((value - yMin) / (yMax - yMin)) * plotHeight;
    const slot = points.length ? plotWidth / points.length : plotWidth;
    const x = (index) => padding.left + slot * index + slot / 2;
    const labelEvery = Math.max(1, Math.ceil(points.length / Math.floor(plotWidth / 80)));

    const linePath = (field) =>
        smoothPath(points.map((point, index) => ({ x: x(index), y: y(point[field]) })));

    const active = activeIndex !== null ? points[activeIndex] : null;
    const reportInfo = reports.find(({ value }) => value === report);
    const lineColors = { income: incomeColor, expense: expenseColor, balance: balanceColor };
    const dotOutlines = { income: '#047857', expense: '#be123c', balance: '#374151' };
    const plotBottom = padding.top + plotHeight;

    function changeReport(value) {
        setReport(value);
        setActiveIndex(null);
    }

    return (
        <main className="min-h-screen bg-gray-100 p-6">
            <div className="mx-auto max-w-5xl">
                <h1 className="mb-1 text-2xl font-bold text-gray-900">Income &amp; Expenditure</h1>
                <p className="mb-6 text-sm text-gray-600">
                    {reportInfo.description} Hover the chart to see the details.
                </p>

                <form
                    onSubmit={saveBalance}
                    className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow-sm"
                >
                    <label className="block min-w-[200px] flex-1 text-sm font-medium text-gray-700">
                        Current balance
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={balanceInput}
                            onChange={(event) => setBalanceInput(event.target.value)}
                            placeholder="e.g. 1000"
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500"
                        />
                    </label>
                    <button
                        type="submit"
                        disabled={isSavingBalance || isLoading}
                        className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                        {isSavingBalance ? 'Saving…' : hasOpeningBalance ? 'Update Balance' : 'Save Balance'}
                    </button>
                    <p className="w-full text-xs text-gray-500">
                        Your balance before the income and expenses below. The gray line starts here, goes up
                        with income and down with expenses.
                    </p>
                    {balanceMessage.text && (
                        <p
                            role={balanceMessage.type === 'error' ? 'alert' : 'status'}
                            className={
                                'w-full text-sm ' +
                                (balanceMessage.type === 'error' ? 'text-red-600' : 'text-emerald-700')
                            }
                        >
                            {balanceMessage.text}
                        </p>
                    )}
                </form>

                <section aria-label="Totals" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <article className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-500">Income</h2>
                        <p className="mt-1 text-xl font-bold text-emerald-700">
                            +{formatAmount(totalIncome)}
                        </p>
                    </article>
                    <article className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-500">Expenditure</h2>
                        <p className="mt-1 text-xl font-bold text-rose-700">
                            -{formatAmount(totalExpenses)}
                        </p>
                    </article>
                    <article className="rounded-lg bg-white p-4 shadow-sm">
                        <h2 className="text-sm font-medium text-gray-500">Balance now</h2>
                        <p className="mt-1 text-xl font-bold text-gray-900">
                            {formatAmount(openingBalance + totalIncome - totalExpenses)}
                        </p>
                    </article>
                </section>

                <section className="rounded-lg bg-white p-4 shadow-sm">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <span className="h-1 w-5 rounded bg-emerald-500" /> Income
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-1 w-5 rounded bg-rose-500" /> Expense
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-1 w-5 rounded bg-gray-500" /> Current balance
                            </span>
                        </div>
                        <div
                            role="group"
                            aria-label="Report"
                            className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1"
                        >
                            {reports.map(({ value, label }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => changeReport(value)}
                                    aria-pressed={report === value}
                                    className={
                                        'rounded-md px-3 py-1.5 text-sm font-medium transition ' +
                                        (report === value
                                            ? 'bg-indigo-600 text-white shadow'
                                            : 'text-gray-600 hover:bg-white hover:text-gray-900')
                                    }
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {isLoading ? (
                        <p className="py-10 text-center text-sm text-gray-500">Loading chart...</p>
                    ) : errorMessage ? (
                        <p role="alert" className="py-10 text-center text-sm text-red-600">
                            {errorMessage}
                        </p>
                    ) : points.length === 0 ? (
                        <p className="py-10 text-center text-sm text-gray-500">
                            No income or expenses yet. Add some to see the chart.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="relative" style={{ width }}>
                                <svg
                                    width={width}
                                    height={chartHeight}
                                    role="img"
                                    aria-label={`Line chart of income, expenses and balance, ${reportInfo.label.toLowerCase()} report`}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    {ticks(yMin, yMax).map((tick) => (
                                        <g key={tick}>
                                            <line
                                                x1={padding.left}
                                                x2={width - padding.right}
                                                y1={y(tick)}
                                                y2={y(tick)}
                                                stroke="#d1d5db"
                                            />
                                            <text
                                                x={padding.left - 8}
                                                y={y(tick)}
                                                textAnchor="end"
                                                dominantBaseline="middle"
                                                className="fill-gray-500 text-[11px]"
                                            >
                                                {formatAmount(tick)}
                                            </text>
                                        </g>
                                    ))}

                                    {points.map(
                                        (point, index) =>
                                            index % labelEvery === 0 && (
                                                <line
                                                    key={point.key}
                                                    x1={x(index)}
                                                    x2={x(index)}
                                                    y1={padding.top}
                                                    y2={plotBottom}
                                                    stroke="#d1d5db"
                                                />
                                            ),
                                    )}

                                    <line
                                        x1={padding.left}
                                        x2={padding.left}
                                        y1={padding.top}
                                        y2={plotBottom}
                                        stroke="#374151"
                                    />
                                    <line
                                        x1={padding.left}
                                        x2={width - padding.right}
                                        y1={y(0)}
                                        y2={y(0)}
                                        stroke="#374151"
                                    />

                                    {active && (
                                        <line
                                            x1={x(activeIndex)}
                                            x2={x(activeIndex)}
                                            y1={padding.top}
                                            y2={padding.top + plotHeight}
                                            stroke="#9ca3af"
                                            strokeDasharray="3 3"
                                        />
                                    )}

                                    {['balance', 'income', 'expense'].map((field) => (
                                        <path
                                            key={field}
                                            d={linePath(field)}
                                            fill="none"
                                            stroke={lineColors[field]}
                                            strokeWidth={3.5}
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                        />
                                    ))}

                                    {points.map((point, index) => (
                                        <g key={point.key}>
                                            {['balance', 'income', 'expense'].map((field) => (
                                                <circle
                                                    key={field}
                                                    cx={x(index)}
                                                    cy={y(point[field])}
                                                    r={activeIndex === index ? 6 : 4}
                                                    fill={lineColors[field]}
                                                    stroke={dotOutlines[field]}
                                                    strokeWidth={1.5}
                                                />
                                            ))}
                                            <rect
                                                x={x(index) - slot / 2}
                                                y={padding.top}
                                                width={slot}
                                                height={plotHeight}
                                                fill="transparent"
                                                tabIndex={0}
                                                onMouseEnter={() => setActiveIndex(index)}
                                                onFocus={() => setActiveIndex(index)}
                                                onBlur={() => setActiveIndex(null)}
                                                aria-label={`${point.label}: income ${formatAmount(point.income)}, expenses ${formatAmount(point.expense)}, balance ${formatAmount(point.balance)}`}
                                                className="cursor-pointer outline-none"
                                            />
                                            {index % labelEvery === 0 && (
                                                <text
                                                    x={x(index)}
                                                    y={chartHeight - padding.bottom + 18}
                                                    textAnchor="middle"
                                                    className="fill-gray-500 text-[11px]"
                                                >
                                                    {point.label}
                                                </text>
                                            )}
                                        </g>
                                    ))}
                                </svg>

                                {active && (
                                    <div
                                        role="tooltip"
                                        className="pointer-events-none absolute z-10 rounded-lg bg-gray-900 p-3 text-xs text-white shadow-lg"
                                        style={{
                                            width: tooltipWidth,
                                            left:
                                                x(activeIndex) + 12 + tooltipWidth > width
                                                    ? x(activeIndex) - 12 - tooltipWidth
                                                    : x(activeIndex) + 12,
                                            top: padding.top,
                                        }}
                                    >
                                        <p className="mb-1.5 text-sm font-semibold">{active.label}</p>
                                        <p className="flex justify-between font-semibold text-emerald-400">
                                            <span>{report === 'all' ? 'Total income' : 'Income'}</span>
                                            <span>+{formatAmount(active.income)}</span>
                                        </p>
                                        <ItemList items={active.incomeItems} color="text-emerald-400" />
                                        <p className="mt-1.5 flex justify-between font-semibold text-rose-400">
                                            <span>{report === 'all' ? 'Total expenses' : 'Expenses'}</span>
                                            <span>-{formatAmount(active.expense)}</span>
                                        </p>
                                        <ItemList items={active.expenseItems} color="text-rose-400" />
                                        <p className="mt-1.5 flex justify-between border-t border-gray-700 pt-1.5 font-semibold text-gray-200">
                                            <span>Current balance</span>
                                            <span>{formatAmount(active.balance)}</span>
                                        </p>
                                        {report === 'all' && (
                                            <p className="mt-1 text-gray-300">
                                                This day: +{formatAmount(active.periodIncome)} / -
                                                {formatAmount(active.periodExpense)}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
