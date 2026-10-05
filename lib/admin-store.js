import { REBECCA_DATA } from '../data/rebecca-data.js';

export const ADMIN_STORE_MODE = 'canonical-read-only';

/**
 * RC-01 storage adapter.
 *
 * The control UI must talk to this adapter rather than importing the public
 * data object directly. RC-02 can replace the implementation with Rebecca's
 * isolated persistent datastore without changing the admin authentication or
 * dashboard contract.
 */
export function getAdminDashboardSnapshot() {
  return {
    dataVersion: REBECCA_DATA.meta?.dataVersion || '—',
    lastVerified: REBECCA_DATA.meta?.lastVerified || '—',
    base: REBECCA_DATA.profile?.base || '—',
    singaporeRateCount: Array.isArray(REBECCA_DATA.singapore?.rates)
      ? REBECCA_DATA.singapore.rates.length
      : 0,
    travelWindowCount: Array.isArray(REBECCA_DATA.travel?.calendar)
      ? REBECCA_DATA.travel.calendar.length
      : 0
  };
}
