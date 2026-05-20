import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qatfboxsvbyzflxtflmf.supabase.co';
const supabaseKey = 'sb_publishable_-U1Sd50G9Rckd1zAjanwEQ_Mry04LUq';

export const supabase = createClient(supabaseUrl, supabaseKey);
