
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { constructVapiConfig, getPracticeByPhone } from '../src/lib/services/vapi-service'

dotenv.config({ path: '.env.local' })
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAssistantRequest() {
    console.log("🚀 Testing Dynamic AI Configuration...")

    // 1. Setup: Ensure a practice exists with known settings
    const testPhone = '+15559998888'

    // Check if test practice exists, if not create/update it
    let { data: practice } = await supabase
        .from('practices')
        .select('*')
        .eq('forwarding_number', testPhone)
        .maybeSingle()

    if (!practice) {
        console.log("Creating test practice...")
        const { data: newPrac, error } = await supabase.from('practices').insert({
            name: 'Dynamic AI Dental',
            forwarding_number: testPhone,
            ai_voice: 'mark', // Friendly male
            ai_tone: 'friendly',
            ai_greeting: "Hi there! Welcome to Dynamic Dental.",
            transfer_keywords: ['help me', 'agent'],
        }).select().single()

        if (error) {
            console.error("❌ Failed to create test practice:", error.message)
            if ('details' in error) console.error("Details:", (error as any).details)
            return
        }
        practice = newPrac
    } else {
        console.log("Updating existing test practice...")
        await supabase.from('practices').update({
            ai_voice: 'mark',
            ai_tone: 'friendly',
            ai_greeting: "Hi there! Welcome to Dynamic Dental.",
        }).eq('id', practice.id)

        // Refresh
        const { data: refreshed } = await supabase.from('practices').select('*').eq('id', practice.id).single()
        practice = refreshed
    }

    console.log(`✅ Test Practice Ready: ${practice.name} (${testPhone})`)
    console.log(`   Expected Voice: mark`)
    console.log(`   Expected Tone: friendly`)

    // 2. Simulate Service Call (as used in webhook)
    console.log("\n🔄 Simulating Webhook Logic...")

    const foundPractice = await getPracticeByPhone(testPhone)
    if (!foundPractice) {
        console.error("❌ Service failed to find practice by phone!")
        return
    }

    const config = constructVapiConfig(foundPractice)

    // 3. Verify Output
    console.log("\n📊 Verification Results:")

    // Verify Name
    if (config.name === 'Dynamic AI Dental') console.log("✅ Name matches")
    else console.error(`❌ Name mismatch: ${config.name}`)

    // Verify Voice (mark -> 11labs ID)
    // Mark ID: TxGEqnHWrfWFTfGW9XjX
    if (config.voice.voiceId === 'TxGEqnHWrfWFTfGW9XjX') console.log("✅ Voice ID matches 'Mark'")
    else console.error(`❌ Voice ID mismatch: ${config.voice.voiceId}`)

    // Verify System Prompt contains content
    const systemPrompt = config.model.messages[0].content

    if (systemPrompt.includes("Hi there! Welcome to Dynamic Dental.")) console.log("✅ Greeting included in prompt")
    else console.error("❌ Greeting missing from prompt")

    if (systemPrompt.includes("Be very warm, friendly")) console.log("✅ Friendly tone instruction found")
    else console.error("❌ Tone instruction missing")

    console.log("\n✅ Dynamic Configuration Test Complete.")
}

testAssistantRequest()
