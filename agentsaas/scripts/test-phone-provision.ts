import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { provisionPhoneNumber } from '../src/lib/services/vapi-service'
import { createAdminClient } from '../src/lib/supabase/admin'

async function testProvisioning() {
    console.log('Testing Vapi Phone Provisioning...\n')

    // Check API key
    const apiKey = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_API_KEY
    console.log('API Key present:', !!apiKey)
    console.log('API Key prefix:', apiKey?.substring(0, 10) + '...\n')

    // Get a practice
    const supabase = createAdminClient()
    const { data: practices, error: practiceError } = await supabase
        .from('practices')
        .select('*')
        .limit(1)

    if (practiceError) {
        console.error('Error fetching practice:', practiceError)
        return
    }

    if (!practices || practices.length === 0) {
        console.error('No practices found in database')
        return
    }

    const practice = practices[0]
    console.log('Practice found:', practice.name)
    console.log('Practice ID:', practice.id)
    console.log()

    // Try to provision
    try {
        console.log('Attempting to provision phone number...')
        const result = await provisionPhoneNumber('512', practice.id)
        console.log('✅ Success!')
        console.log('Phone Number:', result.phone_number)
        console.log('Vapi Phone ID:', result.vapi_phone_number_id)
        console.log('Vapi Assistant ID:', result.vapi_assistant_id)
    } catch (error) {
        console.error('❌ Provisioning failed:')
        console.error(error)
    }
}

testProvisioning()
