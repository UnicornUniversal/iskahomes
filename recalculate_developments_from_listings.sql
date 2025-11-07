-- Recalculate Developments Table from Actual Listings Data
-- This script updates developments.total_units, stats arrays, and total_estimated_revenue

-- Function to calculate stats array from listings
CREATE OR REPLACE FUNCTION calculate_stats_array(
    listings_array jsonb,
    field_name text
) RETURNS jsonb AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    item jsonb;
    category_id text;
    counts jsonb := '{}'::jsonb;
    total_count integer;
    stat_item jsonb;
BEGIN
    -- Count occurrences of each category_id
    FOR item IN SELECT * FROM jsonb_array_elements(listings_array)
    LOOP
        -- Extract category_id (handle both object and string formats)
        IF jsonb_typeof(item) = 'object' THEN
            category_id := item->>'id';
        ELSE
            category_id := item::text;
        END IF;
        
        IF category_id IS NOT NULL THEN
            counts := jsonb_set(
                counts,
                ARRAY[category_id],
                to_jsonb(COALESCE((counts->>category_id)::integer, 0) + 1)
            );
        END IF;
    END LOOP;
    
    -- Get total count
    total_count := (SELECT COUNT(*) FROM jsonb_array_elements(listings_array));
    
    -- Build result array
    FOR category_id, item IN SELECT * FROM jsonb_each(counts)
    LOOP
        stat_item := jsonb_build_object(
            'category_id', category_id,
            'total_amount', (item)::integer,
            'percentage', CASE 
                WHEN total_count > 0 THEN 
                    ROUND(((item)::integer::numeric / total_count::numeric * 100)::numeric, 2)
                ELSE 0 
            END
        );
        result := result || jsonb_build_array(stat_item);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate subtypes from listing_types.database
CREATE OR REPLACE FUNCTION calculate_subtypes_array(
    listings_data jsonb
) RETURNS jsonb AS $$
DECLARE
    result jsonb := '[]'::jsonb;
    listing_item jsonb;
    listing_types jsonb;
    database_array jsonb;
    subtype_item jsonb;
    subtype_id text;
    counts jsonb := '{}'::jsonb;
    total_count integer := 0;
    stat_item jsonb;
BEGIN
    -- Count occurrences of each subtype
    FOR listing_item IN SELECT * FROM jsonb_array_elements(listings_data)
    LOOP
        listing_types := listing_item->'listing_types';
        IF listing_types IS NOT NULL THEN
            database_array := listing_types->'database';
            IF database_array IS NOT NULL AND jsonb_typeof(database_array) = 'array' THEN
                FOR subtype_item IN SELECT * FROM jsonb_array_elements(database_array)
                LOOP
                    IF jsonb_typeof(subtype_item) = 'object' THEN
                        subtype_id := subtype_item->>'id';
                    ELSE
                        subtype_id := subtype_item::text;
                    END IF;
                    
                    IF subtype_id IS NOT NULL THEN
                        counts := jsonb_set(
                            counts,
                            ARRAY[subtype_id],
                            to_jsonb(COALESCE((counts->>subtype_id)::integer, 0) + 1)
                        );
                        total_count := total_count + 1;
                    END IF;
                END LOOP;
            END IF;
        END IF;
    END LOOP;
    
    -- Build result array
    FOR subtype_id, subtype_item IN SELECT * FROM jsonb_each(counts)
    LOOP
        stat_item := jsonb_build_object(
            'category_id', subtype_id,
            'total_amount', (subtype_item)::integer,
            'percentage', CASE 
                WHEN total_count > 0 THEN 
                    ROUND(((subtype_item)::integer::numeric / total_count::numeric * 100)::numeric, 2)
                ELSE 0 
            END
        );
        result := result || jsonb_build_array(stat_item);
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Main update query for developments
WITH development_listings AS (
    SELECT 
        d.id as development_id,
        jsonb_agg(
            jsonb_build_object(
                'purposes', COALESCE(l.purposes, '[]'::jsonb),
                'types', COALESCE(l.types, '[]'::jsonb),
                'categories', COALESCE(l.categories, '[]'::jsonb),
                'listing_types', COALESCE(l.listing_types, '{"database": []}'::jsonb),
                'estimated_revenue', COALESCE(l.estimated_revenue, '{}'::jsonb)
            )
        ) as listings_data,
        COUNT(*) as total_units,
        SUM(
            CASE 
                WHEN l.estimated_revenue IS NOT NULL 
                    AND jsonb_typeof(l.estimated_revenue) = 'object'
                THEN COALESCE(
                    (l.estimated_revenue->>'estimated_revenue')::numeric,
                    (l.estimated_revenue->>'price')::numeric,
                    0
                )
                ELSE 0
            END
        ) as total_estimated_revenue
    FROM developments d
    LEFT JOIN listings l ON l.development_id = d.id
        AND (
            (l.listing_condition = 'completed' AND l.upload_status = 'completed')
            OR l.listing_status IN ('active', 'sold', 'rented')
        )
    GROUP BY d.id
)
UPDATE developments d
SET 
    total_units = COALESCE(dl.total_units, 0),
    property_purposes_stats = COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'category_id', purpose_id,
                'total_amount', count,
                'percentage', CASE 
                    WHEN dl.total_units > 0 THEN 
                        ROUND((count::numeric / dl.total_units::numeric * 100)::numeric, 2)
                    ELSE 0 
                END
            )
        )
        FROM (
            SELECT 
                CASE 
                    WHEN jsonb_typeof(purpose) = 'object' THEN purpose->>'id'
                    ELSE purpose::text
                END as purpose_id,
                COUNT(*) as count
            FROM development_listings dl2,
            jsonb_array_elements(dl2.listings_data) listing,
            jsonb_array_elements(listing->'purposes') purpose
            WHERE dl2.development_id = d.id
            GROUP BY purpose_id
        ) purpose_counts),
        '[]'::jsonb
    ),
    property_types_stats = COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'category_id', type_id,
                'total_amount', count,
                'percentage', CASE 
                    WHEN dl.total_units > 0 THEN 
                        ROUND((count::numeric / dl.total_units::numeric * 100)::numeric, 2)
                    ELSE 0 
                END
            )
        )
        FROM (
            SELECT 
                CASE 
                    WHEN jsonb_typeof(type) = 'object' THEN type->>'id'
                    ELSE type::text
                END as type_id,
                COUNT(*) as count
            FROM development_listings dl2,
            jsonb_array_elements(dl2.listings_data) listing,
            jsonb_array_elements(listing->'types') type
            WHERE dl2.development_id = d.id
            GROUP BY type_id
        ) type_counts),
        '[]'::jsonb
    ),
    property_categories_stats = COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'category_id', category_id,
                'total_amount', count,
                'percentage', CASE 
                    WHEN dl.total_units > 0 THEN 
                        ROUND((count::numeric / dl.total_units::numeric * 100)::numeric, 2)
                    ELSE 0 
                END
            )
        )
        FROM (
            SELECT 
                CASE 
                    WHEN jsonb_typeof(category) = 'object' THEN category->>'id'
                    ELSE category::text
                END as category_id,
                COUNT(*) as count
            FROM development_listings dl2,
            jsonb_array_elements(dl2.listings_data) listing,
            jsonb_array_elements(listing->'categories') category
            WHERE dl2.development_id = d.id
            GROUP BY category_id
        ) category_counts),
        '[]'::jsonb
    ),
    property_subtypes_stats = COALESCE(
        (SELECT jsonb_agg(
            jsonb_build_object(
                'category_id', subtype_id,
                'total_amount', count,
                'percentage', CASE 
                    WHEN total_subtypes > 0 THEN 
                        ROUND((count::numeric / total_subtypes::numeric * 100)::numeric, 2)
                    ELSE 0 
                END
            )
        )
        FROM (
            SELECT 
                CASE 
                    WHEN jsonb_typeof(subtype) = 'object' THEN subtype->>'id'
                    ELSE subtype::text
                END as subtype_id,
                COUNT(*) as count,
                SUM(COUNT(*)) OVER () as total_subtypes
            FROM development_listings dl2,
            jsonb_array_elements(dl2.listings_data) listing,
            jsonb_array_elements(listing->'listing_types'->'database') subtype
            WHERE dl2.development_id = d.id
            GROUP BY subtype_id
        ) subtype_counts),
        '[]'::jsonb
    ),
    total_estimated_revenue = COALESCE(dl.total_estimated_revenue, 0)
FROM development_listings dl
WHERE d.id = dl.development_id;

-- Verification query
SELECT 
    d.id,
    d.title,
    d.slug,
    d.total_units as calculated_total_units,
    d.total_estimated_revenue as calculated_revenue,
    (SELECT COUNT(*) FROM listings WHERE development_id = d.id 
     AND (
         (listing_condition = 'completed' AND upload_status = 'completed')
         OR listing_status IN ('active', 'sold', 'rented')
     )) as actual_listings_count,
    jsonb_array_length(COALESCE(d.property_purposes_stats, '[]'::jsonb)) as purposes_stats_count,
    jsonb_array_length(COALESCE(d.property_types_stats, '[]'::jsonb)) as types_stats_count,
    jsonb_array_length(COALESCE(d.property_categories_stats, '[]'::jsonb)) as categories_stats_count,
    jsonb_array_length(COALESCE(d.property_subtypes_stats, '[]'::jsonb)) as subtypes_stats_count
FROM developments d
ORDER BY d.total_units DESC
LIMIT 20;

