import { VapiClient } from '@vapi-ai/server-sdk'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const apiKey = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_API_KEY

console.log("--- VAPI CONNECTION TEST ---")
if (!apiKey) {
    console.error("❌ ERROR: No Vapi Key found in process.env (checked VAPI_PRIVATE_KEY, VAPI_API_KEY)")
} else {
    console.log(`✅ Key found (Length: ${apiKey.length})`)
    console.log(`Prefix: ${apiKey.substring(0, 5)}...`)
}

const vapi = new VapiClient({
    token: apiKey || 'missing'
})

async function testConnection() {
    try {
        console.log("Attempting to list assistants...")
        const assistants = await vapi.assistants.list()
        console.log(`✅ SUCCESS: Connected! Found ${assistants.length} assistants.`)
    } catch (error: any) {
        console.error("❌ CONNECTION FAILED:")
        console.error(error)
    }
}

testConnection()
