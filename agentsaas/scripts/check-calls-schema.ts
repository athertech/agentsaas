import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '../src/lib/supabase/admin'

async function checkCalls() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('calls').select('*').limit(1)
    if (error) {
        console.error('Error fetching calls:', error)
    } else {
        console.log('CALLS_SCHEMA:' + JSON.stringify(Object.keys(data[0] || {})))
    }
}

checkCalls()
