import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function testVoices() {
    const token = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_API_KEY
    console.log("Using token starting with:", token?.substring(0, 5))

    try {
        const response = await fetch('https://api.vapi.ai/voice', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })

        console.log("Status:", response.status)
        console.log("Status Text:", response.statusText)

        if (!response.ok) {
            const text = await response.text()
            console.error("Error body:", text)
            return
        }

        const data = await response.json()
        console.log("Data type:", typeof data)
        console.log("Data is array:", Array.isArray(data))
        if (typeof data === 'object' && data !== null) {
            console.log("Data keys:", Object.keys(data))
            if ((data as any).voices) {
                console.log("Voices count:", (data as any).voices.length)
            }
        }
    } catch (err) {
        console.error("Fetch failed:", err)
    }
}

testVoices()
