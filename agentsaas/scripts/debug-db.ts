import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createAdminClient } from '../src/lib/supabase/admin'

async function checkDatabase() {
    const supabase = createAdminClient()

    console.log('--- Phone Numbers ---')
    const { data: numbers, error: nError } = await supabase.from('phone_numbers').select('*')
    if (nError) console.error(nError)
    else console.log('Phone Numbers:', JSON.stringify(numbers, null, 2))

    console.log('\n--- Practices ---')
    const { data: practices, error: pError } = await supabase.from('practices').select('id, name, owner_id')
    if (pError) console.error(pError)
    else console.log('Practices:', JSON.stringify(practices, null, 2))
}

checkDatabase()
