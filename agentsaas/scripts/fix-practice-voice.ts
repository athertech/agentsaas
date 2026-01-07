
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function fixPracticeVoice() {
    console.log("Fixing practice voice to 'Tara'...")
    const { data, error } = await supabase
        .from('practices')
        .update({
            ai_voice: 'Tara',
            ai_voice_provider: 'vapi'
        })
        .neq('id', '00000000-0000-0000-0000-000000000000') // Update all (safe for single user dev)

    if (error) {
        console.error("Error updating:", error)
    } else {
        console.log("✅ Success! Practice voice reset to Tara/vapi.")
    }
}

fixPracticeVoice()
