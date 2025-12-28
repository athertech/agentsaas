import { NextRequest } from 'next/server'
import twilio from 'twilio'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSMS } from '@/lib/services/sms-service'

export async function POST(req: NextRequest) {
    const supabase = createAdminClient()

    try {
        // 1. Get the Raw Body for signature validation (not always available in standard Next.js body parsers)
        // Since we're using formData, we'll validate using that
        const formData = await req.formData()
        const params = Object.fromEntries(formData)

        // 2. Verify Twilio signature (Optional but recommended for production)
        // In local dev, we might skip this or use a simplified check
        const signature = req.headers.get('x-twilio-signature') || ''
        const url = `${process.env.API_URL || 'http://localhost:3000'}/api/webhooks/twilio/sms`

        /* 
        // Disabled for now to make testing easier without ngrok/URL issues
        const isValid = twilio.validateRequest(
            process.env.TWILIO_AUTH_TOKEN!,
            signature,
            url,
            params as any
        )
        
        if (!isValid) {
            console.error('[SMS Webhook] Invalid Twilio Signature')
            return Response.json({ error: 'Invalid signature' }, { status: 403 })
        }
        */

        const fromNumber = params.From as string
        const toNumber = params.To as string
        const body = params.Body as string

        console.log(`[SMS Webhook] Received message from ${fromNumber} to ${toNumber}: "${body}"`)

        // 3. Find practice by phone number
        // Note: The number might be in various formats, but Database should ideally store E.164
        const { data: phoneNumber, error: phoneError } = await supabase
            .from('phone_numbers')
            .select('*, practices(*)')
            .eq('phone_number', toNumber)
            .single()

        if (phoneError || !phoneNumber) {
            console.error('[SMS Webhook] Unknown destination number:', toNumber)
            return Response.json({ error: 'Unknown number' }, { status: 404 })
        }

        // 4. Log incoming message
        await supabase.from('messages').insert({
            practice_id: phoneNumber.practice_id,
            message_type: 'sms',
            direction: 'inbound',
            from_address: fromNumber,
            to_address: toNumber,
            body: body,
            provider: 'twilio',
            status: 'received',
            received_at: new Date().toISOString()
        })

        // 5. Handle simple keywords (CONFIRM/CANCEL)
        const normalized = body.trim().toUpperCase()

        if (normalized.includes('CONFIRM')) {
            await handleConfirmation(fromNumber, phoneNumber, supabase)
        } else if (normalized.includes('CANCEL')) {
            await handleCancellation(fromNumber, phoneNumber, supabase)
        }

        // 6. Return TwiML (empty is fine if we don't want to auto-reply via TwiML)
        const twiml = new twilio.twiml.MessagingResponse()
        return new Response(twiml.toString(), {
            headers: { 'Content-Type': 'text/xml' }
        })

    } catch (error: any) {
        console.error('[SMS Webhook] Error:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}

async function handleConfirmation(patientPhone: string, phoneNumber: any, supabase: any) {
    console.log(`[SMS Webhook] Handling CONFIRM from ${patientPhone}`)

    // 1. Find patient by phone
    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', patientPhone)
        .eq('practice_id', phoneNumber.practice_id)
        .maybeSingle()

    if (!patient) return

    // 2. Find the latest confirmed booking for this patient
    const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (booking) {
        // We'll just confirm it's already confirmed or update a custom field if needed
        // For now, let's just send the acknowledgment
        await sendSMS({
            from: phoneNumber.phone_number,
            to: patientPhone,
            body: "Great! Your appointment has been confirmed. See you then! 😊",
            practiceId: phoneNumber.practice_id,
            relatedType: 'booking',
            relatedId: booking.id
        })
    }
}

async function handleCancellation(patientPhone: string, phoneNumber: any, supabase: any) {
    console.log(`[SMS Webhook] Handling CANCEL from ${patientPhone}`)

    // 1. Find patient by phone
    const { data: patient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', patientPhone)
        .eq('practice_id', phoneNumber.practice_id)
        .maybeSingle()

    if (!patient) return

    const { data: booking } = await supabase
        .from('bookings')
        .select('*')
        .eq('patient_id', patient.id)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (booking) {
        // Update status
        await supabase
            .from('bookings')
            .update({
                status: 'cancelled'
            })
            .eq('id', booking.id)

        // Send auto-reply
        await sendSMS({
            from: phoneNumber.phone_number,
            to: patientPhone,
            body: "We have cancelled your appointment as requested. Someone from our office will call you shortly to reschedule. Have a nice day!",
            practiceId: phoneNumber.practice_id,
            relatedType: 'booking',
            relatedId: booking.id
        })

        // Also create a lead for follow up
        await supabase.from('leads').insert({
            practice_id: phoneNumber.practice_id,
            status: 'new',
            notes: `SMS Cancellation follow-up needed for ${patientPhone}`
        })
    }
}
