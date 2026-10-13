# marker

A minimal [Next.js](https://nextjs.org) (App Router) app. The home page renders
"this is marker app".

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Admin panel

Set a long random `SESSION_SECRET`, `SUPER_ADMIN_USERNAME`, and
`SUPER_ADMIN_PASSWORD` in `.env` before starting the app. The configured
super-admin account is created with a bcrypt-hashed password on first sign-in.
Regular accounts sign in separately; each account's income, expenses, payment
reminders, and opening balance are scoped to its user ID. The `/super-admin`
panel shows per-user financial summaries and is restricted to the super-admin.
The `/admin-panel` financial reset only removes the signed-in user's income,
expenses, and opening balance.

## Layout

```
src/app/
├── layout.jsx     Root layout
├── page.jsx       Home page — "this is marker app"
└── globals.css    Tailwind entry
```
