import AdminNav from './AdminNav';

export const metadata = { title: 'Admin Pablo' };

export default function AdminLayout({ children }) {
    return (
        <div className="min-h-screen bg-gray-100">
            <AdminNav />
            <div className="mx-auto max-w-5xl p-4">{children}</div>
        </div>
    );
}
