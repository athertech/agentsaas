import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key to verify schema without RLS issues

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    console.log("Checking columns...")

    // Check bookings
    const { error: bookingError } = await supabase
        .from('bookings')
        .select('vapi_call_id')
        .limit(1)

    if (bookingError) {
        console.log("❌ Error checking 'bookings':", bookingError.message)
    } else {
        console.log("✅ Table 'bookings' has 'vapi_call_id' column.")
    }

    // Check practices
    // We check individual columns to be sure
    const { error: practiceError } = await supabase
        .from('practices')
        .select('forwarding_number, ai_voice, ai_tone, transfer_keywords')
        .limit(1)

    if (practiceError) {
        console.log("❌ Error checking 'practices':", practiceError.message)
    } else {
        console.log("✅ Table 'practices' has all AI columns.")
    }

    // Check phone_numbers
    const { error: phoneError } = await supabase.from('phone_numbers').select('id').limit(1)
    if (phoneError) console.log("❌ Error checking 'phone_numbers':", phoneError.message)
    else console.log("✅ Table 'phone_numbers' exists.")

    // Check messages
    const { error: msgError } = await supabase.from('messages').select('id').limit(1)
    if (msgError) console.log("❌ Error checking 'messages':", msgError.message)
    else console.log("✅ Table 'messages' exists.")
}

checkColumns()
