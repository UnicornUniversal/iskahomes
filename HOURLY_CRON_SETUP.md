# Hourly Analytics Cron Setup Guide

## Overview
This guide shows you how to set up hourly analytics processing for your Iska Homes application. The cron will process all listings, users, and developments analytics from Redis and insert them into the database.

## Setup Options

### Option 1: Vercel Cron Jobs (Recommended for Vercel deployments)

1. **Add to your `vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/trigger",
      "schedule": "0 * * * *"
    }
  ]
}
```

2. **Set environment variable:**
```bash
CRON_SECRET=your-secure-secret-key-here
```

3. **Deploy to Vercel** - cron will automatically start running hourly.

### Option 2: External Cron Service

1. **Use a service like cron-job.org:**
   - URL: `https://your-domain.com/api/cron/trigger`
   - Method: GET
   - Headers: `Authorization: Bearer your-secure-secret-key`
   - Schedule: Every hour

2. **Or use GitHub Actions:**
```yaml
name: Analytics Cron
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
jobs:
  analytics:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Analytics
        run: |
          curl -X GET "https://your-domain.com/api/cron/trigger" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

### Option 3: Your Own Server Cron

1. **Add to your server's crontab:**
```bash
# Edit crontab
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * curl -X GET "https://your-domain.com/api/cron/trigger" -H "Authorization: Bearer your-secure-secret-key"
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Cron authentication
CRON_SECRET=your-secure-secret-key-here

# Your app URL (for self-referencing)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Manual Testing

You can manually trigger the cron for testing:

```bash
# Using curl
curl -X GET "https://iskahomes.vercel.app//api/cron/trigger" \
  -H "Authorization: Bearer your-secure-secret-key"

# Or using the API directly
curl -X POST "https://iskahomes.vercel.app//api/cron/analytics" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-secret-key" \
  -d '{
    "date": "2025-01-27",
    "listing_ids": ["listing-id-1", "listing-id-2"],
    "user_ids": ["user-id-1", "user-id-2"],
    "development_ids": ["dev-id-1", "dev-id-2"]
  }'
```

## What the Cron Does

1. **Fetches all active entities** from the database:
   - Active listings
   - All users (developers, agents, property seekers)
   - Active developments

2. **Reads Redis counters** for each entity:
   - Views, impressions, leads, sales
   - Unique counts using HyperLogLog
   - Breakdown by source/traffic

3. **Computes derived metrics**:
   - Conversion rates
   - Lead-to-sale rates
   - Average sale prices
   - Engagement rates

4. **Inserts into analytics tables**:
   - `listing_analytics`
   - `user_analytics`
   - `development_analytics`

## Monitoring

The cron returns detailed results:

```json
{
  "success": true,
  "message": "Analytics processing completed",
  "timestamp": "2025-01-27T10:00:00.000Z",
  "result": {
    "success": true,
    "date": "2025-01-27",
    "processed": {
      "listings": 150,
      "users": 45,
      "developments": 12
    },
    "inserted": {
      "listings": { "inserted": 150, "errors": [] },
      "users": { "inserted": 45, "errors": [] },
      "developments": { "inserted": 12, "errors": [] }
    }
  }
}
```

## Troubleshooting

1. **Check Redis connection** - ensure Redis is running and accessible
2. **Verify database tables** - ensure analytics tables exist
3. **Check environment variables** - CRON_SECRET must be set
4. **Monitor logs** - check server logs for errors
5. **Test manually** - use the manual trigger to debug

## Performance Notes

- The cron processes all entities in batches
- Uses `upsert` to handle duplicate entries
- Redis operations are optimized with HyperLogLog for unique counts
- Database inserts are batched for efficiency
- Typical processing time: 1-5 seconds for 1000+ entities
