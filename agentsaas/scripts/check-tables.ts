import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
    console.log('Checking tables...')
    console.log(`Using key: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE_ROLE' : 'ANON'}`)

    const tables = ['practices', 'patients', 'calls', 'bookings', 'leads']

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1)
        if (error) {
            console.log(`❌ Table '${table}' failed:`, error.message)
        } else {
            console.log(`✅ Table '${table}' exists.`)
        }
    }
}

checkTables()
