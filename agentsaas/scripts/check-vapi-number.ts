import { VapiClient } from '@vapi-ai/server-sdk'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const vapi = new VapiClient({
    token: process.env.VAPI_API_KEY!
})

async function checkNumber() {
    console.log("Fetching phone numbers from Vapi...")
    try {
        const numbers = await vapi.phoneNumbers.list()
        console.log(`Found ${numbers.length} numbers in Vapi.`)

        numbers.forEach((n: any) => {
            console.log(`- ID: ${n.id}, Number: ${n.number}, Provider: ${n.provider}, AssistantID: ${n.assistantId || 'NONE'}`)
        })

        const target = "+15125550200"
        const found = numbers.find((n: any) => n.number === target || n.number.replace(/\s+/g, '') === target)

        if (found) {
            console.log(`\nSUCCESS: Found ${target} in Vapi!`)
            console.log(`Status Details:`, JSON.stringify(found, null, 2))
        } else {
            console.log(`\nWARNING: ${target} NOT found in Vapi account.`)
        }

    } catch (err) {
        console.error("Error fetching numbers:", err)
    }
}

checkNumber()
