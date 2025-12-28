import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function countCalls() {
    console.log('Counting calls...')

    const { count, error } = await supabase.from('calls').select('*', { count: 'exact', head: true })

    if (error) {
        console.log(`❌ Failed to count calls:`, error.message)
    } else {
        console.log(`✅ There are ${count} calls in the database.`)
    }
}

countCalls()
