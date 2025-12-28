import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createAdminClient } from '../src/lib/supabase/admin'

async function clearPhoneNumbers() {
    const supabase = createAdminClient()

    console.log('Clearing phone_numbers table...')
    const { error } = await supabase.from('phone_numbers').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
        console.error('Error clearing phone_numbers:', error)
    } else {
        console.log('Successfully cleared phone_numbers table.')
    }
}

clearPhoneNumbers()
