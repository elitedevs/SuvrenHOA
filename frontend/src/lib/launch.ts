// Single source of truth for the SuvrenHOA launch date.
// TODO: add a test (vitest) that asserts LAUNCH_DATE.toISOString().startsWith('2026-10-19')
//       and LAUNCH_DATE_DISPLAY === 'October 19, 2026' once a test runner is configured.

export const LAUNCH_DATE = new Date('2026-10-19T12:00:00Z');
export const LAUNCH_DATE_DISPLAY = 'October 19, 2026';
