import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Use admin client for direct DB access bypassing RLS for debugging
const supabase = createAdminClient()

async function debugUserData() {
    console.log("--- DEBUGGING USER DATA ---")

    // 1. Get the most recent practice
    const { data: practices, error: pError } = await supabase
        .from('practices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

    if (pError) {
        console.error("Error fetching practices:", pError)
        return
    }

    if (!practices || practices.length === 0) {
        console.log("No practices found in the database.")
        return
    }

    const practice = practices[0]
    console.log(`Found Practice: ${practice.name} (ID: ${practice.id})`)
    console.log(`Owner ID: ${practice.owner_id}`)
    console.log(`Data:`, JSON.stringify(practice, null, 2))

    // 2. Get phone numbers for this practice
    const { data: numbers, error: nError } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('practice_id', practice.id)

    if (nError) {
        console.error("Error fetching phone numbers:", nError)
        return
    }

    console.log(`\nPhone Numbers Found: ${numbers?.length || 0}`)
    if (numbers && numbers.length > 0) {
        numbers.forEach(n => {
            console.log(`- Number: ${n.number}, ID: ${n.id}, VapiID: ${n.vapi_phone_number_id}, Status: ${n.status}`)
        })
    } else {
        console.log("WARNING: Practice has NO phone numbers linked.")
    }

    console.log("--- DEBUG END ---")
}

debugUserData()
