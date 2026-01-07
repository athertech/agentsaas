
import { provisionPhoneNumber } from '@/lib/services/vapi-service'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

async function debugProvisioning() {
    console.log("--- DEBUG PROVISIONING ---")

    // 1. Get Practice ID
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: practices } = await supabase.from('practices').select('id, name').limit(1)
    if (!practices || practices.length === 0) {
        console.error("No practice found")
        return
    }

    const practice = practices[0]
    console.log(`Target Practice: ${practice.name} (${practice.id})`)

    try {
        // 2. Attempt Provisioning (Area Code 512)
        console.log("Calling provisionPhoneNumber...")
        const result = await provisionPhoneNumber('512', practice.id)
        console.log("✅ SUCCESS:", result)
    } catch (error: any) {
        console.error("❌ FAILURE:")
        if (error.error && error.error.message) {
            console.error("Validation Error:", JSON.stringify(error.error.message, null, 2))
        } else if (error.message) {
            console.error("Message:", error.message)
        }

        // Also try reading body if it's a response object
        if (error.response && typeof error.response.json === 'function') {
            try {
                const body = await error.response.json()
                console.error("Body:", JSON.stringify(body, null, 2))
            } catch (e) { /* ignore */ }
        }
    }
}

debugProvisioning()
