
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { createBooking } from '../src/lib/services/booking-service'
import { logCall } from '../src/lib/services/call-log-service'

// Mock Vapi payloads
const mockCallId = `test-call-${Date.now()}`
const mockPhone = '+15550199999'

async function runTest() {
    console.log("🚀 Starting Vapi Webhook Flow Verification")

    // LOAD ENV
    dotenv.config({ path: '.env.local' })
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key for verify access
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Simulate Booking Tool Call
    console.log("\n1️⃣ Simulating 'bookAppointment' tool call...")
    try {
        // We call our service function directly to simulate what the webhook route does
        const startTime = new Date(Date.now() + 86400000).toISOString() // Tomorrow

        await createBooking(
            'Test Patient Vapi',
            'test.vapi@example.com',
            startTime,
            'UTC',
            mockCallId // Passing the string ID
        )
        console.log("✅ Booking created successfully via service.")

        // Verify in DB
        const { data: booking, error } = await supabase
            .from('bookings')
            .select('id, vapi_call_id, patient_id')
            .eq('vapi_call_id', mockCallId)
            .single()

        if (booking) {
            console.log(`✅ Booking verified in DB! ID: ${booking.id}`)
            console.log(`   Linked Vapi Call ID: ${booking.vapi_call_id}`)
            console.log(`   Patient ID: ${booking.patient_id}`)
        } else {
            console.error("❌ Booking NOT found in DB.", error)
            return
        }

    } catch (err) {
        console.error("❌ Booking simulation failed:", err)
        return
    }

    // 2. Simulate End-of-Call Report (Success Case)
    console.log("\n2️⃣ Simulating 'end-of-call-report' (Success)...")

    const endCallPayload = {
        message: {
            type: "end-of-call-report",
            call: {
                id: mockCallId, // Matching ID
                status: "completed",
                durationSeconds: 120,
                recordingUrl: "https://example.com/rec.mp3",
                transcript: "User booked appointment.",
                analysis: {
                    summary: "User successfully booked appointment."
                },
                customer: {
                    number: mockPhone
                },
                startedAt: new Date().toISOString()
            }
        }
    }

    await logCall(endCallPayload, supabase)
    console.log("✅ Call logged.")

    // Verify Call Log
    const { data: callLog } = await supabase
        .from('calls')
        .select('id, call_sid') // call_sid stores the vapi id in calls table
        .eq('call_sid', mockCallId)
        .single()

    if (callLog) {
        console.log(`✅ Call log verified in DB. ID: ${callLog.id}`)
    } else {
        console.error("❌ Call log NOT found.")
    }

    // Verify NO Lead created (because booking exists)
    // We need to wait a moment as logCall might be async in side effects if not awaited properly? 
    // actually we awaited logCall, so it should be done.

    const { data: lead } = await supabase
        .from('leads')
        .select('id')
        .eq('call_id', callLog?.id) // Leads link to the UUID call id
        .maybeSingle()

    if (!lead) {
        console.log("✅ Correctly skipped Lead creation (Booking found).")
    } else {
        console.error("❌ FAILURE: Created a Lead but shouldn't have!", lead)
    }


    // 3. Simulate Missed Booking (Lead Generation)
    console.log("\n3️⃣ Simulating 'end-of-call-report' (Missed/Lead)...")
    const missedCallId = `missed-call-${Date.now()}`

    const missedPayload = {
        message: {
            type: "end-of-call-report",
            call: {
                id: missedCallId,
                status: "completed",
                durationSeconds: 45,
                recordingUrl: "https://example.com/rec2.mp3",
                transcript: "User asked about prices but did not book.",
                analysis: {
                    summary: "Inquiry about pricing. No booking made."
                },
                customer: {
                    number: "+15550299999"
                },
                startedAt: new Date().toISOString()
            }
        }
    }

    await logCall(missedPayload, supabase)

    // Find the call log UUID first
    const { data: missedCallLog } = await supabase.from('calls').select('id').eq('call_sid', missedCallId).single()

    if (missedCallLog) {
        const { data: generatedLead } = await supabase
            .from('leads')
            .select('id, status')
            .eq('call_id', missedCallLog.id)
            .single()

        if (generatedLead) {
            console.log(`✅ Lead generation verified! Lead ID: ${generatedLead.id}`)
        } else {
            console.error("❌ FAILURE: Lead was NOT created for unbooked call.")
        }
    }

    console.log("\n✅ Verification Complete.")
}

runTest()
