import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('URL:', supabaseUrl)
console.log('Key starts with:', supabaseKey.substring(0, 10))

const supabase = createClient(supabaseUrl, supabaseKey)

async function testAuth() {
    // Use a real email domain (Supabase blocks test/example domains)
    const testEmail = 'testuser12345@gmail.com'
    const testPassword = 'password123456'

    console.log(`\nAttempting signup with: ${testEmail}`)

    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
    })

    if (error) {
        console.error('\nSignup error details:')
        console.error('Message:', error.message)
        console.error('Status:', error.status)
        console.error('Code:', error.code)
        console.error('Full error:', JSON.stringify(error, null, 2))
    } else {
        console.log('\n✓ Signup successful!')
        console.log('User ID:', data.user?.id)
        console.log('Email:', data.user?.email)
    }
}

testAuth()
