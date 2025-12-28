import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '../src/lib/supabase/admin'

async function checkPractices() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('practices').select('*').limit(1)
    if (error) {
        console.error('Error fetching practices:', error)
    } else {
        const cols = Object.keys(data[0] || {})
        console.log('PRACTICES_COLUMNS_START')
        cols.forEach(c => console.log(c))
        console.log('PRACTICES_COLUMNS_END')
    }
}

checkPractices()
