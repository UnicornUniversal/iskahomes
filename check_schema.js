const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking property_purposes...');
  const { data: purposes, error: error1 } = await supabase.from('property_purposes').select('*').limit(1);
  if (purposes && purposes.length > 0) {
    console.log('property_purposes columns:', Object.keys(purposes[0]));
  } else {
    console.log('property_purposes: No data or error', error1);
  }

  console.log('Checking property_types...');
  const { data: types, error: error2 } = await supabase.from('property_types').select('*').limit(1);
  if (types && types.length > 0) {
    console.log('property_types columns:', Object.keys(types[0]));
  } else {
    console.log('property_types: No data or error', error2);
  }

  console.log('Checking property_subtypes...');
  const { data: subtypes, error: error3 } = await supabase.from('property_subtypes').select('*').limit(1);
  if (subtypes && subtypes.length > 0) {
    console.log('property_subtypes columns:', Object.keys(subtypes[0]));
  } else {
    console.log('property_subtypes: No data or error', error3);
  }
}

checkSchema();
