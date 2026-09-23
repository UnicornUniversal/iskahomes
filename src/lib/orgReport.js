import { dummyDateRange, getDummyReport } from '@/app/components/reports/dummyReportData'

/**
 * Period-sliced org report payload.
 * Dummy data for now — replace the body with sums from user_analytics,
 * listing_analytics, development_analytics, leads, sales_listings, and chargeable_entries.
 */
export function buildOrgReport({ accountType = 'developer', from, to } = {}) {
  const report = getDummyReport(accountType === 'agency' ? 'agency' : 'developer')

  return {
    ...report,
    dateRange: {
      startDate: from || dummyDateRange.startDate,
      endDate: to || dummyDateRange.endDate,
    },
    source: 'dummy',
  }
}
