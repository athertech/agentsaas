import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { VapiClient } from '@vapi-ai/server-sdk'

async function testVapiAuth() {
    console.log('Testing Vapi API Authentication...\n')

    const apiKey = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_API_KEY
    console.log('API Key present:', !!apiKey)
    console.log('API Key length:', apiKey?.length)
    console.log('API Key prefix:', apiKey?.substring(0, 15) + '...\n')

    if (!apiKey) {
        console.error('❌ No API key found!')
        return
    }

    // Try with the key
    const vapi = new VapiClient({
        token: apiKey
    })

    try {
        console.log('Attempting to list assistants...')
        const assistants = await vapi.assistants.list()
        console.log('✅ Authentication successful!')
        console.log('Number of assistants:', (assistants as any).length || 'unknown')
    } catch (error: any) {
        console.error('❌ Authentication failed!')
        console.error('Error:', error.message)
        if (error.statusCode) {
            console.error('Status Code:', error.statusCode)
        }
        if (error.body) {
            console.error('Response Body:', JSON.stringify(error.body, null, 2))
        }
    }
}

testVapiAuth()
