-- Alter developers table to support decimal values for change fields
-- This allows storing percentage changes like 5.25, -3.14, etc.

-- Change views_change from bigint to numeric(10,2)
-- numeric(10,2) allows values from -99999999.99 to 99999999.99
ALTER TABLE developers 
ALTER COLUMN views_change TYPE numeric(10,2) USING views_change::numeric(10,2);

-- Change impressions_change from integer to numeric(10,2)
ALTER TABLE developers 
ALTER COLUMN impressions_change TYPE numeric(10,2) USING impressions_change::numeric(10,2);

-- Change leads_change from integer to numeric(10,2)
ALTER TABLE developers 
ALTER COLUMN leads_change TYPE numeric(10,2) USING leads_change::numeric(10,2);

-- Optional: Also update conversion_rate to numeric if you want more precision
-- Currently it's integer, but you might want decimal precision (e.g., 5.25% instead of 5%)
-- Uncomment if needed:
-- ALTER TABLE developers 
-- ALTER COLUMN conversion_rate TYPE numeric(5,2) USING conversion_rate::numeric(5,2);

