import Link from 'next/link';

export default function AdminHome() {
    return (
        <div className="rounded-lg bg-white p-6 shadow">
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
                Use the <strong>Users</strong> link in the navbar to manage QuickTalk
                accounts.
            </p>
            <Link
                href="/admin-pablo/users"
                className="mt-4 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
                Go to Users
            </Link>
        </div>
    );
}
