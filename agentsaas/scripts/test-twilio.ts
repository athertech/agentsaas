import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { searchAvailableNumbers } from '../src/lib/services/twilio-service'

async function testTwilio() {
    console.log('Testing Twilio Connectivity...\n')

    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN

    console.log('TWILIO_ACCOUNT_SID present:', !!accountSid)
    console.log('TWILIO_AUTH_TOKEN present:', !!authToken)
    console.log()

    if (!accountSid || !authToken) {
        console.error('❌ Missing Twilio credentials in .env.local')
        return
    }

    try {
        console.log('Searching for available numbers in area code 512...')
        const numbers = await searchAvailableNumbers('512')

        if (numbers.length > 0) {
            console.log('✅ Successfully reached Twilio!')
            console.log(`Found ${numbers.length} numbers. Example: ${numbers[0].phoneNumber}`)
        } else {
            console.log('⚠️  Connected to Twilio, but no numbers found for area code 512.')
        }
    } catch (error: any) {
        console.error('❌ Twilio Connection Failed:')
        console.error(error.message)
    }
}

testTwilio()
