-- PostHog SQL Query: Get All Leads for a Specific Seeker and Listing
-- Listing ID: fe0669e1-3f27-4350-8cfb-25aefea9adfe
-- Seeker ID: 3e7f302d-7864-48bd-b40e-cbd4f98ca093

-- Query 1: Get all lead events with details
SELECT 
  event,
  distinct_id,
  timestamp,
  properties.lister_id as lister_id,
  properties.lister_type as lister_type,
  properties.listing_id as listing_id,
  properties.seeker_id as seeker_id,
  properties.lead_type as lead_type,
  properties.context_type as context_type,
  properties.phone_number as phone_number,
  properties.message_type as message_type,
  properties.appointment_type as appointment_type,
  CASE 
    WHEN event = 'lead_phone' THEN 'phone'
    WHEN event = 'lead_message' THEN 'message'
    WHEN event = 'lead_appointment' THEN 'appointment'
    WHEN event = 'lead' THEN COALESCE(properties.lead_type, 'unknown')
    ELSE 'unknown'
  END as resolved_lead_type
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND properties.listing_id = 'fe0669e1-3f27-4350-8cfb-25aefea9adfe'
  AND properties.seeker_id = '3e7f302d-7864-48bd-b40e-cbd4f98ca093'
  AND properties.listing_id IS NOT NULL
  AND properties.seeker_id IS NOT NULL
ORDER BY timestamp DESC

-- Query 2: Get summary totals (uncomment to use)
/*
SELECT 
  COUNT(*) as total_leads,
  COUNT(CASE WHEN event = 'lead_phone' OR properties.lead_type = 'phone' THEN 1 END) as phone_leads,
  COUNT(CASE WHEN event = 'lead_message' OR properties.lead_type = 'message' THEN 1 END) as message_leads,
  COUNT(CASE WHEN event = 'lead_appointment' OR properties.lead_type = 'appointment' THEN 1 END) as appointment_leads,
  MIN(timestamp) as first_lead_date,
  MAX(timestamp) as last_lead_date
FROM events
WHERE 
  event IN ('lead', 'lead_phone', 'lead_message', 'lead_appointment')
  AND properties.listing_id = 'fe0669e1-3f27-4350-8cfb-25aefea9adfe'
  AND properties.seeker_id = '3e7f302d-7864-48bd-b40e-cbd4f98ca093'
  AND properties.listing_id IS NOT NULL
  AND properties.seeker_id IS NOT NULL
*/

