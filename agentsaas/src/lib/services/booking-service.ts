import { createAdminClient } from '@/lib/supabase/admin'

// In a real app, you might fetch this from the 'practices' table

export async function getAvailableSlots(startTime: string, endTime: string, practiceId?: string) {
    let CAL_API_KEY = process.env.CAL_API_KEY
    let EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID

    // If practiceId is provided, try to fetch their specific credentials
    if (practiceId) {
        const adminSupabase = createAdminClient()
        const { data: practice } = await adminSupabase
            .from('practices')
            .select('calcom_api_key, calcom_event_type_id')
            .eq('id', practiceId)
            .single()

        if (practice?.calcom_api_key) CAL_API_KEY = practice.calcom_api_key
        if (practice?.calcom_event_type_id) EVENT_TYPE_ID = practice.calcom_event_type_id
    }

    if (!CAL_API_KEY || !EVENT_TYPE_ID) {
        console.warn('Cal.com integration not configured')
        return []
    }

    try {
        const params = new URLSearchParams({
            apiKey: CAL_API_KEY,
            startTime,
            endTime,
            eventTypeId: EVENT_TYPE_ID
        })

        const response = await fetch(`https://api.cal.com/v1/slots?${params}`)
        if (!response.ok) {
            throw new Error(`Cal.com API error: ${response.statusText}`)
        }

        const data = await response.json()
        return data.slots || []
    } catch (error) {
        console.error('Error fetching slots:', error)
        return []
    }
}

import { sendSMS } from './sms-service'

export async function createBooking(
    name: string,
    email: string,
    phone: string,
    startTime: string,
    timeZone: string = 'UTC',
    callId?: string,
    practiceId?: string
) {
    let CAL_API_KEY = process.env.CAL_API_KEY
    let EVENT_TYPE_ID = process.env.CAL_EVENT_TYPE_ID

    const adminSupabase = createAdminClient()

    // If practiceId is provided, try to fetch their specific credentials
    if (practiceId) {
        const { data: practice } = await adminSupabase
            .from('practices')
            .select('calcom_api_key, calcom_event_type_id')
            .eq('id', practiceId)
            .single()

        if (practice?.calcom_api_key) CAL_API_KEY = practice.calcom_api_key
        if (practice?.calcom_event_type_id) EVENT_TYPE_ID = practice.calcom_event_type_id
    }

    if (!CAL_API_KEY || !EVENT_TYPE_ID) {
        throw new Error('Cal.com integration not configured')
    }

    try {
        // 1. Create booking in Cal.com first
        const response = await fetch('https://api.cal.com/v1/bookings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apiKey: CAL_API_KEY,
                eventTypeId: parseInt(EVENT_TYPE_ID),
                start: startTime,
                responses: {
                    name,
                    email,
                    location: {
                        optionValue: phone || '',
                        value: 'phone'
                    }
                },
                timeZone,
                language: 'en'
            })
        })

        if (!response.ok) {
            const err = await response.text()
            throw new Error(`Cal.com Booking Failed: ${err}`)
        }

        const bookingData = await response.json()

        // 2. Persist to our DB
        const adminSupabase = createAdminClient()

        let patientId = null

        // Try to find by email
        const { data: existingPatient } = await adminSupabase
            .from('patients')
            .select('id')
            .eq('email', email)
            .maybeSingle()

        let practiceId = null

        if (existingPatient) {
            patientId = existingPatient.id
            const { data: p } = await adminSupabase.from('patients').select('practice_id').eq('id', patientId).single()
            if (!practiceId) practiceId = p?.practice_id
        } else {
            // Determine practice if not provided
            if (!practiceId) {
                const { data: practice } = await adminSupabase
                    .from('practices')
                    .select('id')
                    .limit(1)
                    .single()

                practiceId = practice?.id
            }

            if (practiceId) {
                // Split name
                const nameParts = name.trim().split(' ')
                const firstName = nameParts[0]
                const lastName = nameParts.slice(1).join(' ') || 'Unknown'

                const { data: newPatient, error: patError } = await adminSupabase
                    .from('patients')
                    .insert({
                        practice_id: practiceId,
                        first_name: firstName,
                        last_name: lastName,
                        email: email,
                        phone: phone || '0000000000',
                        patient_type: 'new',
                        source: 'ai_booking'
                    })
                    .select('id')
                    .single()

                if (!patError && newPatient) {
                    patientId = newPatient.id
                } else {
                    console.error("Failed to create patient for booking:", patError)
                }
            }
        }

        // Calculate end time (default to 30 mins if not specified aka standard consult)
        const startDate = new Date(startTime)
        const endDate = new Date(startDate.getTime() + 30 * 60000)

        const bookingPayload: any = {
            patient_id: patientId ? patientId : undefined,
            practice_id: practiceId,
            start_time: startDate.toISOString(),
            end_time: endDate.toISOString(),
            status: 'confirmed',
            appointment_type: 'consultation', // Default for AI bookings
            calendar_event_id: bookingData.id?.toString(),
            vapi_call_id: callId || null
        }

        const { error: dbError } = await adminSupabase.from('bookings').insert(bookingPayload)

        if (dbError) {
            console.error('Failed to persist booking to DB:', dbError)
        }

        // 3. Send SMS Confirmation (Vapi-Only)
        if (phone && practiceId) {
            const timeString = startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone })
            const dateString = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone })

            const message = `Hi ${name.split(' ')[0]}, your appointment is confirmed for ${dateString} at ${timeString}. Reply C to cancel.`

            // Get practice phone number
            const { data: practicePhone } = await adminSupabase
                .from('phone_numbers')
                .select('phone_number')
                .eq('practice_id', practiceId)
                .eq('is_primary', true)
                .single()

            // Fire and forget SMS if we have a number
            if (practicePhone?.phone_number) {
                sendSMS({
                    from: practicePhone.phone_number,
                    to: phone,
                    body: message,
                    practiceId: practiceId
                }).catch((err: any) => console.error("Background SMS failed:", err))
            }
        }

        return bookingData
    } catch (error) {
        console.error('Error creating booking:', error)
        throw error
    }
}
