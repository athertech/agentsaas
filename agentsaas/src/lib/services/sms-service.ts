import twilio from 'twilio'
import { createAdminClient } from '../supabase/admin'

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env.local file.')
    }

    return twilio(accountSid, authToken)
}

/**
 * Send an SMS message using Twilio and log it to the database
 */
export async function sendSMS({
    from,
    to,
    body,
    practiceId,
    relatedType,
    relatedId
}: {
    from: string
    to: string
    body: string
    practiceId?: string
    relatedType?: string
    relatedId?: string
}) {
    const client = getTwilioClient()
    const supabase = createAdminClient()

    try {
        const message = await client.messages.create({
            from,
            to,
            body
        })

        // Log to database
        if (practiceId) {
            await supabase.from('messages').insert({
                practice_id: practiceId,
                message_type: 'sms',
                direction: 'outbound',
                from_address: from,
                to_address: to,
                body: body,
                provider: 'twilio',
                provider_message_id: message.sid,
                status: 'sent',
                related_type: relatedType,
                related_id: relatedId,
                sent_at: new Date().toISOString()
            })
        }

        return { success: true, messageId: message.sid }
    } catch (error: any) {
        console.error('[SMS] Send failed:', error)

        // Log failure
        if (practiceId) {
            await supabase.from('messages').insert({
                practice_id: practiceId,
                message_type: 'sms',
                direction: 'outbound',
                from_address: from,
                to_address: to,
                body: body,
                provider: 'twilio',
                status: 'failed',
                error_message: error.message,
                related_type: relatedType,
                related_id: relatedId
            })
        }

        return { success: false, error: error.message }
    }
}

/**
 * Send an appointment confirmation SMS
 */
export async function sendAppointmentConfirmation(appointment: any, practice: any, patient: any, phoneNumber: string) {
    const message = `Hi ${patient.first_name}! Your appointment at ${practice.name} is confirmed for ${appointment.date} at ${appointment.time}. Reply CONFIRM to confirm or CANCEL to reschedule.`

    return sendSMS({
        from: phoneNumber,
        to: patient.phone,
        body: message,
        practiceId: practice.id,
        relatedType: 'appointment',
        relatedId: appointment.id
    })
}
