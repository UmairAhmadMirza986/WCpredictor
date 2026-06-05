import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dyyqgyucdicbgrrdskiy.supabase.co'
const supabaseKey = 'sb_publishable_e3_x4lq4vpKSTMsA6EGkaA_A_o5hvQV'

export const supabase = createClient(supabaseUrl, supabaseKey)
