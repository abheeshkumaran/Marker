'use client';

import { useEffect, useMemo, useState } from 'react';

const chartHeight = 360;
const padding = { top: 20, right: 24, bottom: 40, left: 72 };
const pointStep = 56;
const minChartWidth = 720;
const tooltipWidth = 240;
const incomeColor = '#10b981';
const expenseColor = '#f43f5e';

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
// The opening balance is not income, so it stays out of the lines.
function buildPoints(transactions, report) {
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

function ticks(max, count = 5) {
    return Array.from({ length: count }, (_, index) => (max / (count - 1)) * index);
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

    useEffect(() => {
        async function loadTransactions() {
            try {
                const response = await fetch('/api/transactions', { cache: 'no-store' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error || 'Unable to load transactions.');
                setTransactions(result.transactions);
            } catch (error) {
                setErrorMessage(error.message || 'Unable to load transactions.');
            } finally {
                setIsLoading(false);
            }
        }

        loadTransactions();
    }, []);

    const points = useMemo(() => buildPoints(transactions, report), [transactions, report]);

    const openingBalance = transactions
        .filter((t) => t.description === 'Net Balance')
        .reduce((total, t) => total + t.amount, 0);
    const sumType = (type) =>
        transactions
            .filter((t) => t.type === type && t.description !== 'Net Balance')
            .reduce((total, t) => total + t.amount, 0);
    const totalIncome = sumType('income');
    const totalExpenses = sumType('expense');

    const width = Math.max(minChartWidth, points.length * pointStep + padding.left + padding.right);
    const plotWidth = width - padding.left - padding.right;
    const plotHeight = chartHeight - padding.top - padding.bottom;

    const yMax = Math.max(1, ...points.flatMap((point) => [point.income, point.expense])) * 1.1;
    const y = (value) => padding.top + plotHeight - (value / yMax) * plotHeight;
    const slot = points.length ? plotWidth / points.length : plotWidth;
    const x = (index) => padding.left + slot * index + slot / 2;
    const labelEvery = Math.max(1, Math.ceil(points.length / Math.floor(plotWidth / 80)));

    const linePath = (field) =>
        points.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point[field])}`).join(' ');
    const areaPath = (field) =>
        points.length
            ? `${linePath(field)} L${x(points.length - 1)},${y(0)} L${x(0)},${y(0)} Z`
            : '';

    const active = activeIndex !== null ? points[activeIndex] : null;
    const reportInfo = reports.find(({ value }) => value === report);

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
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1.5">
                                <span className="h-0.5 w-5 rounded bg-emerald-500" /> Income
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-0.5 w-5 rounded bg-rose-500" /> Expense
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
                                    aria-label={`Line chart of income and expenses, ${reportInfo.label.toLowerCase()} report`}
                                    onMouseLeave={() => setActiveIndex(null)}
                                >
                                    {ticks(yMax).map((tick) => (
                                        <g key={tick}>
                                            <line
                                                x1={padding.left}
                                                x2={width - padding.right}
                                                y1={y(tick)}
                                                y2={y(tick)}
                                                stroke="#e5e7eb"
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

                                    <path d={areaPath('income')} fill={incomeColor} fillOpacity={0.08} />
                                    <path d={areaPath('expense')} fill={expenseColor} fillOpacity={0.08} />
                                    <path
                                        d={linePath('income')}
                                        fill="none"
                                        stroke={incomeColor}
                                        strokeWidth={2.5}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />
                                    <path
                                        d={linePath('expense')}
                                        fill="none"
                                        stroke={expenseColor}
                                        strokeWidth={2.5}
                                        strokeLinejoin="round"
                                        strokeLinecap="round"
                                    />

                                    {points.map((point, index) => (
                                        <g key={point.key}>
                                            {['income', 'expense'].map((field) => (
                                                <circle
                                                    key={field}
                                                    cx={x(index)}
                                                    cy={y(point[field])}
                                                    r={activeIndex === index ? 5 : 3}
                                                    fill="#fff"
                                                    stroke={field === 'income' ? incomeColor : expenseColor}
                                                    strokeWidth={2}
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
                                                aria-label={`${point.label}: income ${formatAmount(point.income)}, expenses ${formatAmount(point.expense)}`}
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
                                        {report === 'all' && (
                                            <p className="mt-1.5 border-t border-gray-700 pt-1.5 text-gray-300">
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
