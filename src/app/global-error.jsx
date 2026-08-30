'use client';

export default function GlobalError({ error, reset }) {
    return (
        <html lang="en">
            <body
                style={{
                    fontFamily: 'system-ui, sans-serif',
                    display: 'flex',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    background: '#f3f4f6',
                    textAlign: 'center',
                }}
            >
                <h1 style={{ fontSize: 24, fontWeight: 700 }}>Something went wrong</h1>
                <p style={{ color: '#4b5563', maxWidth: 400 }}>
                    {error?.message || 'Unexpected error.'}
                </p>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '8px 16px',
                        borderRadius: 6,
                        background: '#4f46e5',
                        color: '#fff',
                        fontWeight: 600,
                        border: 0,
                    }}
                >
                    Try again
                </button>
            </body>
        </html>
    );
}
