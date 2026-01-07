
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkData() {
    console.log('--- Practice with Cal.com credentials ---')
    const { data: practices, error: pError } = await supabase.from('practices')
        .select('id, name, calcom_api_key, calcom_event_type_id')
        .not('calcom_api_key', 'is', null)

    if (pError) console.error(pError)
    console.log(practices)

    console.log('--- Provisioned Phone Numbers ---')
    const { data: phones, error: phError } = await supabase.from('phone_numbers')
        .select('practice_id, phone_number, vapi_phone_number_id, vapi_assistant_id')
        .eq('is_primary', true)

    if (phError) console.error(phError)
    console.log(phones)
}

checkData()
