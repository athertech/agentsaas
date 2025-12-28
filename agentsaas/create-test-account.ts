import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function createAndTestAccount() {
    const timestamp = Date.now()
    const email = `demo${timestamp}@gmail.com`
    const password = 'DemoPassword123!'

    console.log('=== CREATING FRESH TEST ACCOUNT ===\n')
    console.log(`Email: ${email}`)
    console.log(`Password: ${password}\n`)

    // Create account
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email,
        password,
    })

    if (signupError) {
        console.error('❌ Signup failed:', signupError.message)
        return
    }

    console.log('✓ Account created successfully!')
    console.log(`  User ID: ${signupData.user?.id}`)
    console.log(`  Email confirmed: ${signupData.user?.email_confirmed_at ? 'Yes' : 'No'}\n`)

    // Test login
    console.log('Testing login...')
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (loginError) {
        console.error('❌ Login failed:', loginError.message)
        console.error(`   Code: ${loginError.code}`)
    } else {
        console.log('✓ Login successful!')
        console.log(`  Session: ${loginData.session ? 'Active' : 'None'}`)

        console.log('\n=== USE THESE CREDENTIALS IN THE BROWSER ===')
        console.log(`Email: ${email}`)
        console.log(`Password: ${password}`)
    }
}

createAndTestAccount()
