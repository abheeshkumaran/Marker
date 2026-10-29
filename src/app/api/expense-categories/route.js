export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import ExpenseCategory from '@/models/ExpenseCategory';
import { createListHandlers } from '@/lib/namedOptions';

export const { GET, POST } = createListHandlers(ExpenseCategory, 'expense category');
