
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

async function cleanUpPendingNumbers() {
    console.log("Searching for PENDING numbers...")

    // 1. Find the bad record
    const { data: badRecords, error: findError } = await supabase
        .from('phone_numbers')
        .select('*')
        .ilike('phone_number', '%PENDING%')

    if (findError) {
        console.error("Error finding records:", findError)
        return
    }

    if (!badRecords || badRecords.length === 0) {
        console.log("No 'PENDING' numbers found. The record might have been manually deleted or is different.")
        return
    }

    console.log(`Found ${badRecords.length} bad record(s):`)
    badRecords.forEach(r => console.log(` - ID: ${r.id}, Number: ${r.phone_number}, Status: ${r.status}`))

    // 2. Delete them
    const { error: deleteError } = await supabase
        .from('phone_numbers')
        .delete()
        .in('id', badRecords.map(r => r.id))

    if (deleteError) {
        console.error("Error deleting records:", deleteError)
    } else {
        console.log("✅ Successfully deleted bad records.")
        console.log("The user should now see the provision UI again.")
    }
}

cleanUpPendingNumbers()
