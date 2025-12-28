
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function diagnose() {
    console.log("🔍 Diagnosing Core Data...")

    // Check Practices
    const { data: practices, error: pracError } = await supabase.from('practices').select('*')
    if (pracError) console.error("❌ Error fetching practices:", pracError)
    else console.log(`✅ Practices found: ${practices.length}`)

    if (practices && practices.length > 0) {
        console.log("   First Practice ID:", practices[0].id)
    } else {
        console.log("⚠️ No practices found! Booking creation will fail.")

        // Attempt to create a mock practice
        console.log("🛠 Attempting to create a mock practice...")
        const { data: newPrac, error: newPracError } = await supabase.from('practices').insert({
            name: 'Test Practice',
            slug: 'test-practice',
            // Add other required fields if any based on schema (usually just uuid, name etc)
        }).select().single()

        if (newPracError) {
            console.error("❌ Failed to create mock practice:", newPracError)
        } else {
            console.log("✅ Created mock practice:", newPrac.id)
        }
    }

    // Check Patients
    const { count: patCount } = await supabase.from('patients').select('*', { count: 'exact', head: true })
    console.log(`✅ Total Patients: ${patCount}`)

    // Check Bookings recent errors?
    // We can't see logs easily, but we can check if any booking exists
    const { count: bookCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true })
    console.log(`✅ Total Bookings: ${bookCount}`)
}

diagnose()
