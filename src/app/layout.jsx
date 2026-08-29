import './globals.css';

export const metadata = {
    title: 'marker',
    description: 'marker app',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="font-sans antialiased">{children}</body>
        </html>
    );
}
