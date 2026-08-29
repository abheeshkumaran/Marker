function IncomeIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M12 19V5" />
            <path d="m5 12 7-7 7 7" />
        </svg>
    );
}

function ExpenseIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M12 5v14" />
            <path d="m19 12-7 7-7-7" />
        </svg>
    );
}

function QuickTalkIcon(props) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            {...props}
        >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M13 7 8 12l5 5" />
        </svg>
    );
}

const buttons = [
    { label: 'Income', Icon: IncomeIcon, className: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Expense', Icon: ExpenseIcon, className: 'bg-rose-600 hover:bg-rose-700' },
    { label: 'QuickTalk', Icon: QuickTalkIcon, className: 'bg-indigo-600 hover:bg-indigo-700' },
];

export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-100 p-6">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">marker app</h1>

            {buttons.map(({ label, Icon, className }) => (
                <button
                    key={label}
                    type="button"
                    className={`flex w-64 items-center gap-3 rounded-lg px-5 py-3 text-base font-semibold text-white shadow transition ${className}`}
                >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{label}</span>
                </button>
            ))}
        </main>
    );
}
