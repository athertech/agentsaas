
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

async function listData() {
    const tableName = process.argv[2] || 'practices'
    console.log(`--- All Records for ${tableName} ---`)
    const { data, error } = await supabase.from(tableName).select('*').limit(5)
    if (error) {
        console.error(error)
    } else {
        console.log(data)
    }

    console.log('--- All Users (ID only) ---')
    const { data: { users }, error: uError } = await supabase.auth.admin.listUsers()
    if (uError) console.error(uError)
    console.log(users.map(u => ({ id: u.id, email: u.email })))
}

listData()
