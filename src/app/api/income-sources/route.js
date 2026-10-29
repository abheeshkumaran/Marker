export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import IncomeSource from '@/models/IncomeSource';
import { createListHandlers } from '@/lib/namedOptions';

export const { GET, POST } = createListHandlers(IncomeSource, 'source');
