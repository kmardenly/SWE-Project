import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL; // Access using your framework's method
const supabaseKey = process.env.SUPABASE_ANON_KEY; // Access using your framework's method

export const supabase = createClient(supabaseUrl, supabaseKey);