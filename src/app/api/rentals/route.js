export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import RentalSource from '@/models/RentalSource';
import { createListHandlers } from '@/lib/namedOptions';

export const { GET, POST } = createListHandlers(RentalSource, 'rental');
