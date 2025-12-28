import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignIn() {
    const testEmail = 'freshuser999@gmail.com'
    const testPassword = 'TestPassword123!'

    console.log(`Attempting sign in with: ${testEmail}`)

    const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    })

    if (error) {
        console.error('❌ Sign in failed:', error.message)
        console.error('Code:', error.code)
    } else {
        console.log('✓ Sign in successful!')
        console.log('User exists and can authenticate')
    }
}

testSignIn()
