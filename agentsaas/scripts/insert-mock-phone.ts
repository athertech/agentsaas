import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createAdminClient } from '../src/lib/supabase/admin'

async function insertMockPhone() {
    const supabase = createAdminClient()

    // 1. Get a practice
    const { data: practice, error: pError } = await supabase.from('practices').select('id, name').limit(1).single()
    if (pError || !practice) {
        console.error('No practice found. Please create one first.', pError)
        return
    }

    console.log(`Using practice: ${practice.name} (${practice.id})`)

    // 2. Insert mock phone
    const mockData = {
        practice_id: practice.id,
        phone_number: '+1512' + Math.floor(1000000 + Math.random() * 9000000), // Random number to avoid unique constraint
        vapi_phone_number_id: 'mock_vapi_' + Date.now(),
        vapi_assistant_id: 'mock_assistant_' + Date.now(),
        twilio_sid: 'mock_twilio_' + Date.now(),
        twilio_account_sid: process.env.TWILIO_ACCOUNT_SID || 'mock_account_sid',
        status: 'active',
        is_primary: true
    }

    const { data, error } = await supabase
        .from('phone_numbers')
        .insert(mockData)
        .select()

    if (error) {
        console.error('Error inserting mock phone:', JSON.stringify(error, null, 2))
    } else {
        console.log('Successfully inserted mock phone:', JSON.stringify(data, null, 2))
    }
}

insertMockPhone().catch(console.error)
