
import { VapiClient } from '@vapi-ai/server-sdk'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const client = new VapiClient({
    token: process.env.VAPI_PRIVATE_KEY || process.env.VAPI_API_KEY || ''
})

async function testCreate() {
    console.log("Testing Assistant Creation...")
    try {
        const assistant = await client.assistants.create({
            name: "Test Assistant",
            voice: {
                provider: "vapi",
                voiceId: "Tara"
            },
            model: {
                provider: "openai",
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a test assistant."
                    }
                ]
            }
        })
        console.log("✅ SUCCESS! Assistant ID:", assistant.id)
    } catch (error: any) {
        console.error("❌ FAILED:")
        if (error.error && error.error.message) {
            console.log(JSON.stringify(error.error.message, null, 2))
        } else {
            console.log(error.message || error)
        }
    }
}

testCreate()
