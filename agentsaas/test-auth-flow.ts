import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testFullFlow() {
    // Create a fresh user with timestamp
    const timestamp = Date.now()
    const testEmail = `testuser${timestamp}@gmail.com`
    const testPassword = 'TestPassword123!'

    console.log('=== TESTING FULL AUTH FLOW ===\n')
    console.log(`Creating new user: ${testEmail}`)

    // Step 1: Sign up
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
    })

    if (signupError) {
        console.error('❌ Signup failed:', signupError.message)
        return
    }

    console.log('✓ Signup successful!')
    console.log('  User ID:', signupData.user?.id)
    console.log('  Email confirmed:', signupData.user?.email_confirmed_at ? 'Yes' : 'No')

    // Step 2: Try to sign in immediately
    console.log(`\nAttempting to sign in with: ${testEmail}`)

    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    })

    if (signinError) {
        console.error('\n❌ Sign in failed:')
        console.error('  Message:', signinError.message)
        console.error('  Code:', signinError.code)
        console.error('  Status:', signinError.status)
    } else {
        console.log('\n✓ Sign in successful!')
        console.log('  User ID:', signinData.user?.id)
        console.log('  Email:', signinData.user?.email)
        console.log('  Session token:', signinData.session?.access_token ? 'Present' : 'Missing')
    }
}

testFullFlow()
