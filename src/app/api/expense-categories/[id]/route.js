export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import ExpenseCategory from '@/models/ExpenseCategory';
import { createDeleteHandler } from '@/lib/namedOptions';

export const DELETE = createDeleteHandler(ExpenseCategory, 'Expense category');
