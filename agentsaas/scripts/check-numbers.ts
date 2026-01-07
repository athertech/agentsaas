
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserNumbers() {
    // 1. Get the first practice (assuming single user/practice for now)
    const { data: practices, error: practiceError } = await supabase
        .from('practices')
        .select('id, name, owner_id')

    if (practiceError) {
        console.error("Error fetching practices:", practiceError)
        return
    }

    if (!practices || practices.length === 0) {
        console.log("No practices found.")
        return
    }

    const practice = practices[0]
    console.log(`Checking practice: ${practice.name} (ID: ${practice.id})`)

    // 2. Get numbers for this practice
    const { data: numbers, error: numbersError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('practice_id', practice.id)

    if (numbersError) {
        console.error("Error fetching numbers:", numbersError)
        return
    }

    if (!numbers || numbers.length === 0) {
        console.log("❌ No phone numbers found for this practice.")
    } else {
        console.log(`✅ Found ${numbers.length} number(s):`)
        numbers.forEach(n => {
            console.log(` - Limit: ${n.phone_number} (Status: ${n.status})`)
        })
    }
}

checkUserNumbers()
