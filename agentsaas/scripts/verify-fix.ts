
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function verify() {
    console.log("Verifying test data...")

    // Check for the most recent booking with vapi_call_id
    const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .not('vapi_call_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)

    if (bookings && bookings.length > 0) {
        console.log("✅ Found booking with vapi_call_id:", bookings[0].vapi_call_id)
        console.log("   Booking ID:", bookings[0].id)
    } else {
        console.log("❌ No booking with vapi_call_id found.")
    }

    // Check for recent leads
    const { data: leads } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_source', 'phone_call')
        .order('created_at', { ascending: false })
        .limit(1)

    if (leads && leads.length > 0) {
        console.log("✅ Found recent lead:", leads[0].id)
        console.log("   Notes:", leads[0].notes)
    } else {
        console.log("❌ No recent leads found.")
    }
}

verify()
