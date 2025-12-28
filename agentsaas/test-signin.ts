import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

async function testSignIn() {
    const testEmail = 'testuser12345@gmail.com'
    const testPassword = 'password123456'

    console.log(`\nAttempting sign in with: ${testEmail}`)

    const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
    })

    if (error) {
        console.error('\n❌ Sign in failed:')
        console.error('Message:', error.message)
        console.error('Status:', error.status)
        console.error('Code:', error.code)
        console.error('\nFull error:', JSON.stringify(error, null, 2))

        if (error.message.includes('Email not confirmed')) {
            console.log('\n💡 Solution: Check your email inbox and click the confirmation link!')
        }
    } else {
        console.log('\n✓ Sign in successful!')
        console.log('User ID:', data.user?.id)
        console.log('Email:', data.user?.email)
        console.log('Email confirmed:', data.user?.email_confirmed_at ? 'Yes' : 'No')
    }
}

testSignIn()
