-- Recalculate Developer Stats from Actual Listings Data
-- This script updates all property and location stats fields in the developers table
-- 
-- Updates:
-- - property_purposes_stats: JSONB array of purpose statistics
-- - property_categories_stats: JSONB array of category statistics
-- - property_types_stats: JSONB array of type statistics
-- - property_subtypes_stats: JSONB array of subtype statistics
-- - country_stats: JSONB array of country statistics (total_units, unit_sales, sales_amount, percentage)
-- - state_stats: JSONB array of state statistics
-- - city_stats: JSONB array of city statistics
-- - town_stats: JSONB array of town statistics

-- Use DO block to iterate through developers and calculate stats
DO $$
DECLARE
    dev_record RECORD;
    purpose_counts jsonb;
    type_counts jsonb;
    category_counts jsonb;
    subtype_counts jsonb;
    listing_record RECORD;
    category_id text;
    total_listings integer;
    location_record RECORD;
    country_stats jsonb := '[]'::jsonb;
    state_stats jsonb := '[]'::jsonb;
    city_stats jsonb := '[]'::jsonb;
    town_stats jsonb := '[]'::jsonb;
    location_data jsonb;
BEGIN
    -- Loop through each developer
    FOR dev_record IN 
        SELECT id, developer_id 
        FROM developers 
        WHERE developer_id IS NOT NULL
    LOOP
        -- Initialize counts
        purpose_counts := '{}'::jsonb;
        type_counts := '{}'::jsonb;
        category_counts := '{}'::jsonb;
        subtype_counts := '{}'::jsonb;
        total_listings := 0;
        country_stats := '[]'::jsonb;
        state_stats := '[]'::jsonb;
        city_stats := '[]'::jsonb;
        town_stats := '[]'::jsonb;
        
        -- Process each listing
        FOR listing_record IN
            SELECT 
                purposes, types, categories, listing_types,
                country, state, city, town, listing_status, estimated_revenue
            FROM listings
            WHERE user_id = dev_record.developer_id
                AND account_type = 'developer'
                AND listing_status IN ('active', 'sold', 'rented')
        LOOP
            total_listings := total_listings + 1;
            
            -- Count purposes
            IF listing_record.purposes IS NOT NULL AND jsonb_array_length(listing_record.purposes) > 0 THEN
                FOR category_id IN 
                    SELECT 
                        CASE 
                            WHEN jsonb_typeof(value) = 'object' THEN value->>'id'
                            ELSE value #>> '{}'
                        END
                    FROM jsonb_array_elements(listing_record.purposes)
                LOOP
                    IF category_id IS NOT NULL THEN
                        purpose_counts := jsonb_set(
                            purpose_counts,
                            ARRAY[category_id],
                            to_jsonb(COALESCE((purpose_counts->>category_id)::integer, 0) + 1)
                        );
                    END IF;
                END LOOP;
            END IF;
            
            -- Count types
            IF listing_record.types IS NOT NULL AND jsonb_array_length(listing_record.types) > 0 THEN
                FOR category_id IN 
                    SELECT 
                        CASE 
                            WHEN jsonb_typeof(value) = 'object' THEN value->>'id'
                            ELSE value #>> '{}'
                        END
                    FROM jsonb_array_elements(listing_record.types)
                LOOP
                    IF category_id IS NOT NULL THEN
                        type_counts := jsonb_set(
                            type_counts,
                            ARRAY[category_id],
                            to_jsonb(COALESCE((type_counts->>category_id)::integer, 0) + 1)
                        );
                    END IF;
                END LOOP;
            END IF;
            
            -- Count categories
            IF listing_record.categories IS NOT NULL AND jsonb_array_length(listing_record.categories) > 0 THEN
                FOR category_id IN 
                    SELECT 
                        CASE 
                            WHEN jsonb_typeof(value) = 'object' THEN value->>'id'
                            ELSE value #>> '{}'
                        END
                    FROM jsonb_array_elements(listing_record.categories)
                LOOP
                    IF category_id IS NOT NULL THEN
                        category_counts := jsonb_set(
                            category_counts,
                            ARRAY[category_id],
                            to_jsonb(COALESCE((category_counts->>category_id)::integer, 0) + 1)
                        );
                    END IF;
                END LOOP;
            END IF;
            
            -- Count subtypes (from listing_types->database)
            IF listing_record.listing_types IS NOT NULL 
                AND listing_record.listing_types->'database' IS NOT NULL
                AND jsonb_array_length(listing_record.listing_types->'database') > 0 THEN
                FOR category_id IN 
                    SELECT 
                        CASE 
                            WHEN jsonb_typeof(value) = 'object' THEN value->>'id'
                            ELSE value #>> '{}'
                        END
                    FROM jsonb_array_elements(listing_record.listing_types->'database')
                LOOP
                    IF category_id IS NOT NULL THEN
                        subtype_counts := jsonb_set(
                            subtype_counts,
                            ARRAY[category_id],
                            to_jsonb(COALESCE((subtype_counts->>category_id)::integer, 0) + 1)
                        );
                    END IF;
                END LOOP;
            END IF;
        END LOOP;
        
        -- Build property stats arrays
        UPDATE developers
        SET 
            property_purposes_stats = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'category_id', key,
                        'total_amount', value::integer,
                        'percentage', CASE 
                            WHEN total_listings > 0 THEN 
                                ROUND(((value::integer::numeric / total_listings::numeric * 100)::numeric), 2)
                            ELSE 0 
                        END
                    )
                )
                FROM jsonb_each(purpose_counts)
            ),
            property_categories_stats = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'category_id', key,
                        'total_amount', value::integer,
                        'percentage', CASE 
                            WHEN total_listings > 0 THEN 
                                ROUND(((value::integer::numeric / total_listings::numeric * 100)::numeric), 2)
                            ELSE 0 
                        END
                    )
                )
                FROM jsonb_each(category_counts)
            ),
            property_types_stats = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'category_id', key,
                        'total_amount', value::integer,
                        'percentage', CASE 
                            WHEN total_listings > 0 THEN 
                                ROUND(((value::integer::numeric / total_listings::numeric * 100)::numeric), 2)
                            ELSE 0 
                        END
                    )
                )
                FROM jsonb_each(type_counts)
            ),
            property_subtypes_stats = (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'category_id', key,
                        'total_amount', value::integer,
                        'percentage', CASE 
                            WHEN total_listings > 0 THEN 
                                ROUND(((value::integer::numeric / total_listings::numeric * 100)::numeric), 2)
                            ELSE 0 
                        END
                    )
                )
                FROM jsonb_each(subtype_counts)
            )
        WHERE id = dev_record.id;
        
        -- Calculate location stats
        -- Country stats
        UPDATE developers
        SET country_stats = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'location', location,
                    'total_units', total_units,
                    'unit_sales', unit_sales,
                    'sales_amount', ROUND(sales_amount),
                    'percentage', CASE 
                        WHEN total_listings > 0 THEN 
                            ROUND((total_units::numeric / total_listings::numeric * 100)::numeric, 2)
                        ELSE 0 
                    END
                )
            )
            FROM (
                SELECT 
                    country as location,
                    COUNT(*) as total_units,
                    COUNT(*) FILTER (WHERE listing_status IN ('sold', 'rented')) as unit_sales,
                    COALESCE(SUM(
                        CASE 
                            WHEN listing_status IN ('sold', 'rented')
                                AND estimated_revenue IS NOT NULL 
                                AND jsonb_typeof(estimated_revenue) = 'object'
                            THEN COALESCE(
                                (estimated_revenue->>'estimated_revenue')::numeric,
                                (estimated_revenue->>'price')::numeric,
                                0
                            )
                            ELSE 0
                        END
                    ), 0) as sales_amount
                FROM listings
                WHERE user_id = dev_record.developer_id
                    AND account_type = 'developer'
                    AND listing_status IN ('active', 'sold', 'rented')
                    AND country IS NOT NULL
                GROUP BY country
            ) country_data
        )
        WHERE id = dev_record.id;
        
        -- State stats
        UPDATE developers
        SET state_stats = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'location', location,
                    'total_units', total_units,
                    'unit_sales', unit_sales,
                    'sales_amount', ROUND(sales_amount),
                    'percentage', CASE 
                        WHEN total_listings > 0 THEN 
                            ROUND((total_units::numeric / total_listings::numeric * 100)::numeric, 2)
                        ELSE 0 
                    END
                )
            )
            FROM (
                SELECT 
                    state as location,
                    COUNT(*) as total_units,
                    COUNT(*) FILTER (WHERE listing_status IN ('sold', 'rented')) as unit_sales,
                    COALESCE(SUM(
                        CASE 
                            WHEN listing_status IN ('sold', 'rented')
                                AND estimated_revenue IS NOT NULL 
                                AND jsonb_typeof(estimated_revenue) = 'object'
                            THEN COALESCE(
                                (estimated_revenue->>'estimated_revenue')::numeric,
                                (estimated_revenue->>'price')::numeric,
                                0
                            )
                            ELSE 0
                        END
                    ), 0) as sales_amount
                FROM listings
                WHERE user_id = dev_record.developer_id
                    AND account_type = 'developer'
                    AND listing_status IN ('active', 'sold', 'rented')
                    AND state IS NOT NULL
                GROUP BY state
            ) state_data
        )
        WHERE id = dev_record.id;
        
        -- City stats
        UPDATE developers
        SET city_stats = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'location', location,
                    'total_units', total_units,
                    'unit_sales', unit_sales,
                    'sales_amount', ROUND(sales_amount),
                    'percentage', CASE 
                        WHEN total_listings > 0 THEN 
                            ROUND((total_units::numeric / total_listings::numeric * 100)::numeric, 2)
                        ELSE 0 
                    END
                )
            )
            FROM (
                SELECT 
                    city as location,
                    COUNT(*) as total_units,
                    COUNT(*) FILTER (WHERE listing_status IN ('sold', 'rented')) as unit_sales,
                    COALESCE(SUM(
                        CASE 
                            WHEN listing_status IN ('sold', 'rented')
                                AND estimated_revenue IS NOT NULL 
                                AND jsonb_typeof(estimated_revenue) = 'object'
                            THEN COALESCE(
                                (estimated_revenue->>'estimated_revenue')::numeric,
                                (estimated_revenue->>'price')::numeric,
                                0
                            )
                            ELSE 0
                        END
                    ), 0) as sales_amount
                FROM listings
                WHERE user_id = dev_record.developer_id
                    AND account_type = 'developer'
                    AND listing_status IN ('active', 'sold', 'rented')
                    AND city IS NOT NULL
                GROUP BY city
            ) city_data
        )
        WHERE id = dev_record.id;
        
        -- Town stats
        UPDATE developers
        SET town_stats = (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'location', location,
                    'total_units', total_units,
                    'unit_sales', unit_sales,
                    'sales_amount', ROUND(sales_amount),
                    'percentage', CASE 
                        WHEN total_listings > 0 THEN 
                            ROUND((total_units::numeric / total_listings::numeric * 100)::numeric, 2)
                        ELSE 0 
                    END
                )
            )
            FROM (
                SELECT 
                    town as location,
                    COUNT(*) as total_units,
                    COUNT(*) FILTER (WHERE listing_status IN ('sold', 'rented')) as unit_sales,
                    COALESCE(SUM(
                        CASE 
                            WHEN listing_status IN ('sold', 'rented')
                                AND estimated_revenue IS NOT NULL 
                                AND jsonb_typeof(estimated_revenue) = 'object'
                            THEN COALESCE(
                                (estimated_revenue->>'estimated_revenue')::numeric,
                                (estimated_revenue->>'price')::numeric,
                                0
                            )
                            ELSE 0
                        END
                    ), 0) as sales_amount
                FROM listings
                WHERE user_id = dev_record.developer_id
                    AND account_type = 'developer'
                    AND listing_status IN ('active', 'sold', 'rented')
                    AND town IS NOT NULL
                GROUP BY town
            ) town_data
        )
        WHERE id = dev_record.id;
    END LOOP;
END $$;

-- Verification query
SELECT 
    d.id,
    d.name,
    d.slug,
    jsonb_array_length(COALESCE(d.property_purposes_stats, '[]'::jsonb)) as purposes_count,
    jsonb_array_length(COALESCE(d.property_categories_stats, '[]'::jsonb)) as categories_count,
    jsonb_array_length(COALESCE(d.property_types_stats, '[]'::jsonb)) as types_count,
    jsonb_array_length(COALESCE(d.property_subtypes_stats, '[]'::jsonb)) as subtypes_count,
    jsonb_array_length(COALESCE(d.country_stats, '[]'::jsonb)) as countries_count,
    jsonb_array_length(COALESCE(d.state_stats, '[]'::jsonb)) as states_count,
    jsonb_array_length(COALESCE(d.city_stats, '[]'::jsonb)) as cities_count,
    jsonb_array_length(COALESCE(d.town_stats, '[]'::jsonb)) as towns_count,
    (SELECT COUNT(*) FROM listings WHERE user_id = d.developer_id AND account_type = 'developer' 
     AND listing_status IN ('active', 'sold', 'rented')) as actual_listings_count
FROM developers d
WHERE d.developer_id IS NOT NULL
ORDER BY d.total_units DESC
LIMIT 20;

