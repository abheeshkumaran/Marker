'use client';

import { useRouter } from 'next/navigation';

export default function AuthBar() {
    const router = useRouter();

    async function logout() {
        try {
            const response = await fetch('/api/talk/logout', { method: 'POST' });
            if (response.ok) router.replace('/login');
        } catch {
            return;
        }
    }

    return (
        <button
            type="button"
            onClick={logout}
            className="fixed right-4 top-4 z-40 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow hover:bg-gray-50"
        >
            Sign out
        </button>
    );
}
