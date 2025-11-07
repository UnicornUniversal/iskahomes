-- Recalculate Admin Analytics from Actual Listings Data
-- This script recalculates admin_analytics for today based on all completed listings
-- Note: This is a full recalculation - it will overwrite existing data for today

-- First, let's create a temporary function to aggregate all completed listings
DO $$
DECLARE
    today_date DATE := CURRENT_DATE;
    week_str VARCHAR(10);
    month_str VARCHAR(7);
    quarter_str VARCHAR(7);
    year_int INTEGER;
    
    -- Aggregated data
    purpose_counts JSONB := '{}'::jsonb;
    type_counts JSONB := '{}'::jsonb;
    category_counts JSONB := '{}'::jsonb;
    subtype_counts JSONB := '{}'::jsonb;
    
    country_data JSONB := '[]'::jsonb;
    state_data JSONB := '[]'::jsonb;
    city_data JSONB := '[]'::jsonb;
    town_data JSONB := '[]'::jsonb;
    
    developers_total INTEGER := 0;
    developers_listings INTEGER := 0;
    developers_sales INTEGER := 0;
    
    agents_total INTEGER := 0;
    agents_listings INTEGER := 0;
    agents_sales INTEGER := 0;
    
    sales_total INTEGER := 0;
    sales_value NUMERIC := 0;
    sales_amount NUMERIC := 0;
    
    listing_record RECORD;
    purpose_item JSONB;
    type_item JSONB;
    category_item JSONB;
    subtype_item JSONB;
    purpose_id TEXT;
    type_id TEXT;
    category_id TEXT;
    subtype_id TEXT;
    
BEGIN
    -- Calculate date strings
    week_str := TO_CHAR(today_date, 'IYYY-"W"IW');
    month_str := TO_CHAR(today_date, 'YYYY-MM');
    quarter_str := TO_CHAR(today_date, 'YYYY-"Q"Q');
    year_int := EXTRACT(YEAR FROM today_date);
    
    -- Process each completed listing
    FOR listing_record IN 
        SELECT 
            l.*,
            CASE 
                WHEN l.listing_status = 'sold' THEN 1 
                ELSE 0 
            END as is_sold,
            CASE 
                WHEN l.listing_status IN ('sold', 'rented') THEN 1 
                ELSE 0 
            END as is_sold_or_rented,
            CASE 
                WHEN l.global_price IS NOT NULL AND jsonb_typeof(l.global_price) = 'object'
                THEN COALESCE(
                    (l.global_price->>'estimated_revenue')::numeric,
                    (l.global_price->>'price')::numeric,
                    0
                )
                ELSE 0
            END as sales_amount_usd,
            COALESCE(l.price, 0) as listing_price
        FROM listings l
        WHERE (
            (l.listing_condition = 'completed' AND l.upload_status = 'completed')
            OR l.listing_status IN ('active', 'sold', 'rented')
        )
    LOOP
        -- Count purposes
        IF listing_record.purposes IS NOT NULL AND jsonb_typeof(listing_record.purposes) = 'array' THEN
            FOR purpose_item IN SELECT * FROM jsonb_array_elements(listing_record.purposes)
            LOOP
                purpose_id := CASE 
                    WHEN jsonb_typeof(purpose_item) = 'object' THEN purpose_item->>'id'
                    ELSE purpose_item::text
                END;
                
                IF purpose_id IS NOT NULL THEN
                    purpose_counts := jsonb_set(
                        purpose_counts,
                        ARRAY[purpose_id],
                        to_jsonb(
                            COALESCE((purpose_counts->>purpose_id)::integer, 0) + 1
                        )
                    );
                END IF;
            END LOOP;
        END IF;
        
        -- Count types
        IF listing_record.types IS NOT NULL AND jsonb_typeof(listing_record.types) = 'array' THEN
            FOR type_item IN SELECT * FROM jsonb_array_elements(listing_record.types)
            LOOP
                type_id := CASE 
                    WHEN jsonb_typeof(type_item) = 'object' THEN type_item->>'id'
                    ELSE type_item::text
                END;
                
                IF type_id IS NOT NULL THEN
                    type_counts := jsonb_set(
                        type_counts,
                        ARRAY[type_id],
                        to_jsonb(
                            COALESCE((type_counts->>type_id)::integer, 0) + 1
                        )
                    );
                END IF;
            END LOOP;
        END IF;
        
        -- Count categories
        IF listing_record.categories IS NOT NULL AND jsonb_typeof(listing_record.categories) = 'array' THEN
            FOR category_item IN SELECT * FROM jsonb_array_elements(listing_record.categories)
            LOOP
                category_id := CASE 
                    WHEN jsonb_typeof(category_item) = 'object' THEN category_item->>'id'
                    ELSE category_item::text
                END;
                
                IF category_id IS NOT NULL THEN
                    category_counts := jsonb_set(
                        category_counts,
                        ARRAY[category_id],
                        to_jsonb(
                            COALESCE((category_counts->>category_id)::integer, 0) + 1
                        )
                    );
                END IF;
            END LOOP;
        END IF;
        
        -- Count subtypes from listing_types.database
        IF listing_record.listing_types IS NOT NULL 
           AND jsonb_typeof(listing_record.listing_types) = 'object'
           AND listing_record.listing_types->'database' IS NOT NULL
           AND jsonb_typeof(listing_record.listing_types->'database') = 'array' THEN
            FOR subtype_item IN SELECT * FROM jsonb_array_elements(listing_record.listing_types->'database')
            LOOP
                subtype_id := CASE 
                    WHEN jsonb_typeof(subtype_item) = 'object' THEN subtype_item->>'id'
                    ELSE subtype_item::text
                END;
                
                IF subtype_id IS NOT NULL THEN
                    subtype_counts := jsonb_set(
                        subtype_counts,
                        ARRAY[subtype_id],
                        to_jsonb(
                            COALESCE((subtype_counts->>subtype_id)::integer, 0) + 1
                        )
                    );
                END IF;
            END LOOP;
        END IF;
        
        -- Count user metrics
        IF listing_record.account_type = 'developer' THEN
            developers_listings := developers_listings + 1;
            IF listing_record.is_sold = 1 THEN
                developers_sales := developers_sales + 1;
            END IF;
        ELSIF listing_record.account_type = 'agent' THEN
            agents_listings := agents_listings + 1;
            IF listing_record.is_sold = 1 THEN
                agents_sales := agents_sales + 1;
            END IF;
        END IF;
        
        -- Count sales
        IF listing_record.is_sold = 1 THEN
            sales_total := sales_total + 1;
            sales_value := sales_value + listing_record.listing_price;
            sales_amount := sales_amount + listing_record.sales_amount_usd;
        END IF;
    END LOOP;
    
    -- Get unique developer and agent counts
    SELECT COUNT(DISTINCT user_id) INTO developers_total
    FROM listings
    WHERE account_type = 'developer'
      AND (
          (listing_condition = 'completed' AND upload_status = 'completed')
          OR listing_status IN ('active', 'sold', 'rented')
      );
      
    SELECT COUNT(DISTINCT user_id) INTO agents_total
    FROM listings
    WHERE account_type = 'agent'
      AND (
          (listing_condition = 'completed' AND upload_status = 'completed')
          OR listing_status IN ('active', 'sold', 'rented')
      );
    
    -- Build location arrays (simplified - you may want to enhance this)
    -- This is a basic implementation - you can expand it to calculate percentages, etc.
    
    -- Upsert the admin_analytics record
    INSERT INTO admin_analytics (
        date,
        week,
        month,
        quarter,
        year,
        listings_by_property_purpose,
        listings_by_property_type,
        listings_by_sub_type,
        listings_by_category,
        developers_metrics,
        agents_metrics,
        sales_metrics,
        country,
        state,
        city,
        town
    ) VALUES (
        today_date,
        week_str,
        month_str,
        quarter_str,
        year_int,
        purpose_counts,
        type_counts,
        subtype_counts,
        category_counts,
        jsonb_build_object(
            'total', developers_total,
            'total_listings', developers_listings,
            'total_sales', developers_sales
        ),
        jsonb_build_object(
            'total', agents_total,
            'total_listings', agents_listings,
            'total_sales', agents_sales
        ),
        jsonb_build_object(
            'total', sales_total,
            'sales_value', sales_value,
            'sales_amount', sales_amount
        ),
        '[]'::jsonb,  -- Location arrays - you can enhance this
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb
    )
    ON CONFLICT (date) DO UPDATE SET
        week = EXCLUDED.week,
        month = EXCLUDED.month,
        quarter = EXCLUDED.quarter,
        year = EXCLUDED.year,
        listings_by_property_purpose = EXCLUDED.listings_by_property_purpose,
        listings_by_property_type = EXCLUDED.listings_by_property_type,
        listings_by_sub_type = EXCLUDED.listings_by_sub_type,
        listings_by_category = EXCLUDED.listings_by_category,
        developers_metrics = EXCLUDED.developers_metrics,
        agents_metrics = EXCLUDED.agents_metrics,
        sales_metrics = EXCLUDED.sales_metrics,
        updated_at = NOW();
    
    RAISE NOTICE 'Admin analytics recalculated for date: %', today_date;
    RAISE NOTICE 'Developers: % listings, % sales', developers_listings, developers_sales;
    RAISE NOTICE 'Agents: % listings, % sales', agents_listings, agents_sales;
    RAISE NOTICE 'Total sales: %, Value: %, Amount (USD): %', sales_total, sales_value, sales_amount;
END $$;

-- Verification query
SELECT 
    date,
    week,
    month,
    quarter,
    year,
    jsonb_object_keys(listings_by_property_purpose) as purpose_count,
    jsonb_object_keys(listings_by_property_type) as type_count,
    jsonb_object_keys(listings_by_category) as category_count,
    developers_metrics->>'total_listings' as developers_listings,
    agents_metrics->>'total_listings' as agents_listings,
    sales_metrics->>'total' as total_sales,
    sales_metrics->>'sales_value' as sales_value,
    updated_at
FROM admin_analytics
WHERE date = CURRENT_DATE;

