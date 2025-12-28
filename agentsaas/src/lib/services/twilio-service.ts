import twilio from 'twilio'

function getTwilioClient() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    if (!accountSid || !authToken) {
        throw new Error('Twilio credentials not configured. Please add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to your .env.local file.')
    }

    return twilio(accountSid, authToken)
}

/**
 * Search for available local phone numbers in a specific area code
 */
export async function searchAvailableNumbers(areaCode: string, country = 'US') {
    const client = getTwilioClient()

    try {
        const numbers = await client.availablePhoneNumbers(country)
            .local
            .list({
                areaCode: areaCode,
                smsEnabled: true,
                voiceEnabled: true,
                limit: 20
            })

        return numbers.map(num => ({
            phoneNumber: num.phoneNumber,
            friendlyName: num.friendlyName,
            locality: num.locality,
            region: num.region,
            capabilities: num.capabilities
        }))
    } catch (error) {
        console.error('[Twilio] Error searching available numbers:', error)
        throw error
    }
}

/**
 * Purchase a phone number from Twilio
 */
export async function purchasePhoneNumber(phoneNumber: string) {
    const client = getTwilioClient()

    try {
        const purchased = await client.incomingPhoneNumbers.create({
            phoneNumber: phoneNumber,
            // Initial webhooks (will be updated after Vapi import)
            smsUrl: `${process.env.API_URL}/api/webhooks/twilio/sms`,
            smsMethod: 'POST'
        })

        return {
            sid: purchased.sid,
            phoneNumber: purchased.phoneNumber,
            friendlyName: purchased.friendlyName
        }
    } catch (error) {
        console.error('[Twilio] Error purchasing number:', error)
        throw error
    }
}

/**
 * Update Twilio phone number webhooks (e.g., to point to Vapi's voice URL)
 */
export async function updatePhoneNumberWebhooks(
    twilioSid: string,
    vapiVoiceUrl: string
) {
    const client = getTwilioClient()

    try {
        await client.incomingPhoneNumbers(twilioSid).update({
            voiceUrl: vapiVoiceUrl,
            voiceMethod: 'POST'
        })
    } catch (error) {
        console.error('[Twilio] Error updating webhooks:', error)
        throw error
    }
}
