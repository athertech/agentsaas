
import { createAdminClient } from '@/lib/supabase/admin'
import { logCall } from '@/lib/services/call-log-service'
import { createBooking } from '@/lib/services/booking-service'
import dotenv from 'dotenv'

// Load env vars from .env.local
dotenv.config({ path: '.env.local' })

// Improve console logging
const log = (msg: string) => console.log(`\n\x1b[36m[TEST] ${msg}\x1b[0m`)
const success = (msg: string) => console.log(`\x1b[32m✔ ${msg}\x1b[0m`)
const error = (msg: string) => console.log(`\x1b[31m✖ ${msg}\x1b[0m`)

async function runTest() {
    log('Starting Call-to-Lead Logic Test')
    const supabase = createAdminClient()

    // 1. SCENARIO A: Call results in a BOOKING (Should NOT create a lead)
    log('Scenario A: Successful Booking')
    const callIdA = `test-call-booked-${Date.now()}`

    // Create the booking first (simulating the tool call happening during conversation)
    log('Simulating booking creation...')
    // We mock the DB insert part of createBooking roughly by calling it, 
    // BUT createBooking makes a real fetch to Cal.com which will fail without API keys.
    // So for this test, we will manually insert the booking to simulate the "service doing its job"
    // to verify the LOGIC in logCall.

    await supabase.from('bookings').insert({
        patient_name: 'Test Patient A',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 1800000).toISOString(),
        status: 'confirmed',
        call_id: callIdA
    })
    success('Mock booking created linked to callId: ' + callIdA)

    // Now simulate end of call
    log('Simulating End-of-Call Report...')
    await logCall({
        message: {
            type: 'end-of-call-report',
            call: {
                id: callIdA,
                status: 'completed',
                durationSeconds: 120,
                customer: { number: '+15550000001' },
                analysis: { summary: 'Patient booked an appointment successfully.' },
                startedAt: new Date().toISOString()
            }
        }
    }, supabase)

    // Verify: Should have call, should NOT have lead
    const { data: leadsA } = await supabase.from('leads').select('*').eq('call_id', callIdA)
    if (leadsA && leadsA.length === 0) {
        success('Pass: No lead created for booked call.')
    } else {
        error(`Fail: Lead created unexpectedly for booked call: ${JSON.stringify(leadsA)}`)
    }


    // 2. SCENARIO B: Call ends WITHOUT booking (Should CREATE a lead)
    log('Scenario B: Missed Opportunity (No Booking)')
    const callIdB = `test-call-lead-${Date.now()}`

    await logCall({
        message: {
            type: 'end-of-call-report',
            call: {
                id: callIdB,
                status: 'completed',
                durationSeconds: 45, // > 10s threshold
                customer: { number: '+15550000002' },
                analysis: { summary: 'Patient asked about pricing but did not book.' },
                startedAt: new Date().toISOString()
            }
        }
    }, supabase)

    // Verify
    const { data: leadsB } = await supabase.from('leads').select('*').eq('notes', `Auto-generated from call analysis: Patient asked about pricing but did not book.`)

    if (leadsB && leadsB.length > 0) {
        success('Pass: Lead created automatically for unbooked call.')
        // Clean up
        await supabase.from('leads').delete().eq('id', leadsB[0].id)
    } else {
        error('Fail: No lead created for unbooked call.')
    }

    // Cleanup other data
    await supabase.from('bookings').delete().eq('call_id', callIdA)
    // Note: We leave calls in DB as logs, or clean them up if desired

    log('Test Complete')
}

runTest().catch(console.error)
