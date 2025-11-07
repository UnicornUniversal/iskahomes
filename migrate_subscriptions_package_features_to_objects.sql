-- Migration: Update features column structure
-- Change features from array of text to array of objects with feature_name and feature_value
-- The column is already JSONB, so we just need to update existing data and constraints

-- Step 1: Update existing features if they are simple text strings
-- Convert old format: ["Feature 1", "Feature 2"] 
-- To new format: [{"feature_name": "Feature 1", "feature_value": ""}, {"feature_name": "Feature 2", "feature_value": ""}]
DO $$
DECLARE
    pkg_record RECORD;
    old_features JSONB;
    new_features JSONB := '[]'::jsonb;
    feature_item JSONB;
    feature_text TEXT;
BEGIN
    FOR pkg_record IN SELECT id, features FROM subscriptions_package
    LOOP
        old_features := pkg_record.features;
        
        -- Check if features is an array
        IF old_features IS NOT NULL AND jsonb_typeof(old_features) = 'array' THEN
            new_features := '[]'::jsonb;
            
            -- Process each feature
            FOR feature_item IN SELECT * FROM jsonb_array_elements(old_features)
            LOOP
                -- Check if it's already an object (new format)
                IF jsonb_typeof(feature_item) = 'object' THEN
                    -- Keep it as is if it has feature_name and feature_value
                    IF feature_item ? 'feature_name' THEN
                        new_features := new_features || jsonb_build_array(feature_item);
                    ELSE
                        -- Convert to new format if it's an object but doesn't have the right structure
                        new_features := new_features || jsonb_build_array(
                            jsonb_build_object(
                                'feature_name', COALESCE(feature_item->>'name', feature_item->>'feature_name', 'Unknown'),
                                'feature_value', COALESCE(feature_item->>'value', feature_item->>'feature_value', '')
                            )
                        );
                    END IF;
                ELSE
                    -- It's a text string (old format), convert to object
                    feature_text := feature_item::text;
                    -- Remove quotes if present
                    feature_text := TRIM(BOTH '"' FROM feature_text);
                    
                    new_features := new_features || jsonb_build_array(
                        jsonb_build_object(
                            'feature_name', feature_text,
                            'feature_value', ''
                        )
                    );
                END IF;
            END LOOP;
            
            -- Update the record
            UPDATE subscriptions_package
            SET features = new_features
            WHERE id = pkg_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrated features from text array to object array';
END $$;

-- Step 2: Add comment to clarify the new structure
COMMENT ON COLUMN subscriptions_package.features IS 'JSONB array of feature objects. Each object has feature_name (string) and feature_value (string). Example: [{"feature_name": "Rank", "feature_value": "2"}, {"feature_name": "Max Listings", "feature_value": "50"}]';

-- Step 3: Verify the migration
DO $$
DECLARE
    sample_pkg RECORD;
    feature_item JSONB;
BEGIN
    -- Get a sample package to verify
    SELECT id, name, features INTO sample_pkg
    FROM subscriptions_package
    LIMIT 1;
    
    IF sample_pkg.id IS NOT NULL THEN
        RAISE NOTICE 'Sample package after migration:';
        RAISE NOTICE '  Package ID: %', sample_pkg.id;
        RAISE NOTICE '  Package Name: %', sample_pkg.name;
        RAISE NOTICE '  Features count: %', jsonb_array_length(COALESCE(sample_pkg.features, '[]'::jsonb));
        
        -- Show first feature structure
        IF jsonb_array_length(COALESCE(sample_pkg.features, '[]'::jsonb)) > 0 THEN
            feature_item := sample_pkg.features->0;
            RAISE NOTICE '  First feature: %', feature_item;
        END IF;
    END IF;
END $$;

