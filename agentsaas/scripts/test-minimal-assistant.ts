import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { VapiClient } from '@vapi-ai/server-sdk'

async function testMinimalAssistant() {
    console.log('Testing Minimal Assistant Creation...\n')

    const apiKey = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_API_KEY
    const vapi = new VapiClient({ token: apiKey })

    try {
        console.log('Attempting to create minimal assistant...')

        // Absolute minimal assistant config
        const assistant = await vapi.assistants.create({
            name: "Test Assistant",
            model: {
                provider: "openai",
                model: "gpt-3.5-turbo"
            },
            voice: {
                provider: "11labs",
                voiceId: "21m00Tcm4TlvDq8ikWAM"
            }
        } as any)

        console.log('✅ Success!')
        console.log('Assistant ID:', (assistant as any).id)
        console.log('Assistant Name:', (assistant as any).name)

        // Clean up - delete the test assistant
        if ((assistant as any).id) {
            await vapi.assistants.delete((assistant as any).id)
            console.log('🗑️  Test assistant deleted')
        }

    } catch (error: any) {
        console.error('❌ Failed!')
        console.error('Error:', error.message)
        console.error('Status:', error.statusCode)
        if (error.body) {
            console.error('Body:', JSON.stringify(error.body, null, 2))
        }
    }
}

testMinimalAssistant()
