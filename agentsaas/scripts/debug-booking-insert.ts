
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function debugInsert() {
    console.log("🐛 Debugging Booking Insert...")

    // 1. Get a patient and practice
    const { data: practice } = await supabase.from('practices').select('id').limit(1).single()
    const { data: patient } = await supabase.from('patients').select('id').limit(1).single()

    if (!practice || !patient) {
        console.error("❌ Missing practice or patient. Cannot test insert.")
        return
    }

    const testId = `debug-${Date.now()}`

    // 2. Direct Insert Attempt
    console.log(`Attempting insert with vapi_call_id: ${testId}`)
    const { data, error } = await supabase
        .from('bookings')
        .insert({
            practice_id: practice.id,
            patient_id: patient.id,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + 1800000).toISOString(),
            status: 'confirmed',
            appointment_type: 'test',
            vapi_call_id: testId
        })
        .select()
        .single()

    if (error) {
        console.error("❌ Insert FAILED:", error)
    } else {
        console.log("✅ Insert SUCCESS:", data)
        if (data.vapi_call_id === testId) {
            console.log("✅ vapi_call_id matches!")
        } else {
            console.log("❌ vapi_call_id mismatch! Got:", data.vapi_call_id)
        }
    }
}

debugInsert()
