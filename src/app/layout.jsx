import './globals.css';
import BalanceSetupGate from './BalanceSetupGate';
import AuthGate from './AuthGate';

export const metadata = {
    title: 'marker',
    description: 'marker app',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="font-sans antialiased">
                <AuthGate>
                    <BalanceSetupGate>{children}</BalanceSetupGate>
                </AuthGate>
            </body>
        </html>
    );
}
