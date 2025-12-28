import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { createAdminClient } from '../src/lib/supabase/admin'

async function listColumns(table: string) {
    const supabase = createAdminClient()

    // Query pg_attribute or just do a limit 0 select
    const { data, error } = await supabase.from(table).select('*').limit(1)

    if (error) {
        console.error(`Error fetching table ${table}:`, error)
        return
    }

    if (data && data.length >= 0) {
        console.log(`COLUMNS_${table}:` + JSON.stringify(Object.keys(data[0] || {})))
    }
}

async function run() {
    await listColumns('bookings')
    await listColumns('patients')
    await listColumns('phone_numbers')
    await listColumns('calls')
    await listColumns('practices')
}

run()
