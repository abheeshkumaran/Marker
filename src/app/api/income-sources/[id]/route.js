export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import IncomeSource from '@/models/IncomeSource';
import { createDeleteHandler } from '@/lib/namedOptions';

export const DELETE = createDeleteHandler(IncomeSource, 'Source');
