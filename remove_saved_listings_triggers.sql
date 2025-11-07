-- Remove triggers from saved_listings table
DROP TRIGGER IF EXISTS trigger_increment_total_favorites ON saved_listings;
DROP TRIGGER IF EXISTS trigger_decrement_total_favorites ON saved_listings;

-- Also drop the trigger functions if they're not used elsewhere
DROP FUNCTION IF EXISTS increment_total_favorites();
DROP FUNCTION IF EXISTS decrement_total_favorites();
