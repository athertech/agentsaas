
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
    console.log('Testing connection to:', supabaseUrl)

    // Test 1: Simple select (if table exists)
    const { data, error: tableError } = await supabase.from('practices').select('*').limit(1)
    if (tableError) {
        console.error('Table access failed:', tableError.message)
        // This is expected if RLS blocks read, or table doesn't exist
    } else {
        console.log('Table access success')
    }

    // Test 2: Auth Signup
    const testEmail = 'antigravity_test_user@gmail.com'
    console.log(`Attempting signup with ${testEmail}...`)

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123',
    })

    if (authError) {
        console.error('Signup FAILED:', JSON.stringify(authError, null, 2))
    } else {
        console.log('Signup success:', authData.user?.id)
    }
}

testConnection()
