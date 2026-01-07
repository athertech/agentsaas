import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectSchema() {
    console.log("--- SCHEMA INSPECTION START ---")

    try {
        const { data, error } = await supabase.from('practices').select('*').limit(1)
        if (error) {
            console.error("Select error:", error)
        } else if (data && data.length > 0) {
            const columns = Object.keys(data[0])
            console.log("TOTAL_COLUMNS_COUNT:", columns.length)
            console.log("COLUMNS_LIST:")
            columns.sort().forEach(c => console.log(`- ${c}`))

            const checks = [
                'ai_voice_provider',
                'has_completed_onboarding',
                'appointment_types',
                'ai_voice',
                'owner_id'
            ]
            console.log("CHECK_RESULTS:")
            checks.forEach(col => {
                console.log(`[CHECK] ${col}: ${columns.includes(col) ? 'EXISTS' : 'MISSING'}`)
            })
        } else {
            console.log("NO_ROWS_FOUND")
        }
    } catch (err) {
        console.error("FATAL_ERROR:", err)
    }
    console.log("--- SCHEMA INSPECTION END ---")
}

inspectSchema()
