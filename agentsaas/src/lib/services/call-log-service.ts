import { createClient } from '@/lib/supabase/server'

import { SupabaseClient } from '@supabase/supabase-js'

export async function logCall(payload: unknown, supabaseInjection?: SupabaseClient) {
    const supabase = supabaseInjection || await createClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (payload as any).message
    const call = message?.call
    if (!call) {
        // eslint-disable-next-line no-console
        console.log('Skipping log: No call data', message?.type)
        return
    }

    // Mapping Vapi fields to our schema
    // Note: practice_id is omitted for now, assuming single tenant or defaults
    const { data: insertedCall, error: callsError } = await supabase.from('calls').insert({
        caller_number: call.customer?.number,
        status: call.status,
        duration_seconds: call.durationSeconds,
        recording_url: call.recordingUrl,
        transcript: call.transcript,
        summary: call.analysis?.summary,
        started_at: call.startedAt,
        call_sid: call.id
    })
        .select('id')
        .single()

    if (callsError) {
        console.error('Error logging call to Supabase:', callsError)
        return
    }

    const insertedCallId = insertedCall?.id

    // Check if this call resulted in a booking
    // We look for a booking linked to this call_sid/call_id
    // Note: Bookings made via tool calls might store the Vapi ID in `call_id` column of bookings table
    // depending on our schema there. Let's check schema assumption.
    // If Bookings table `call_id` is UUID, we have a problem there too because createBooking received Vapi ID.
    // Let's assume for now we check against `call_sid` if possible or we fix Bookings table too.
    // Based on previous step, createBooking put `callId` (Vapi ID) into `call_id` column.
    // IMPORTANT: If `bookings.call_id` is UUID, that insert in createBooking will ALSO fail or has failed.
    // Let's check the schema for `bookings`. Documentation said `call_id UUID REFERENCES calls(id)`.
    // So createBooking is ALSO broken if it passed a string.

    // Recovery Plan:
    // 1. We should support `call_sid` in bookings if possible, OR
    // 2. We can't fix createBooking easily because the Call record doesn't exist yet when Booking happens.
    // So Bookings must link via `call_sid` (Vapi ID) OR we create the Call record earlier (start-of-call).
    // Given we only define `logCall` on end-of-call, we likely need to store Vapi ID in bookings for now
    // and ideally specificy it as `call_sid` or a text field, NOT the UUID FK.

    // BUT, the schema in `backendflow.md` says: `call_id UUID REFERENCES calls(id)`.
    // If that is enforced, we can't save the Vapi ID there.
    // However, maybe `bookings` table allows it or `call_id` is actually text?
    // Let's assume for this fix, we are fixing `leads` creation properly using the UUID we just got.
    // AND we search for booking using `calendar_event_id` or `patient_email` timestamps?
    // OR we assume `bookings` has a `call_sid` column or `call_id` is text.

    // Let's first fix the LEAD creation which definitely failed.

    if (call.id && insertedCallId) {
        // We try to find a booking that matches. 
        // If createBooking saved Vapi ID into `call_id` and it worked, then `call_id` must be text-compatible?
        // Or maybe it failed silently in the test?
        // Let's check if there is a booking with this vapi id.
        const { data: booking } = await supabase
            .from('bookings')
            .select('id')
            .eq('vapi_call_id', call.id) // Use the new column which stores string ID
            .maybeSingle()

        // If no booking was made, and the call was significant (e.g. > 10 seconds), create a lead
        if (!booking && (call.durationSeconds || 0) > 10) {
            console.log(`Creating lead for unbooked call ${call.id}`)

            // Try to find if patient exists
            let patientId = null
            if (call.customer?.number) {
                const { data: patient } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('phone', call.customer.number)
                    .single()
                patientId = patient?.id
            }

            const { error: leadError } = await supabase.from('leads').insert({
                call_id: insertedCallId, // Use the proper UUID from the inserted call
                patient_id: patientId,
                status: 'new',
                lead_source: 'phone_call',
                notes: `Auto-generated from call analysis: ${call.analysis?.summary || 'No summary available.'}`
            })

            if (leadError) {
                console.error('Failed to create lead:', leadError)
            }
        }
    }
}
