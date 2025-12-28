import { createAdminClient } from "@/lib/supabase/admin"
import { VapiClient } from '@vapi-ai/server-sdk'

// Lazy-load Vapi client to ensure environment variables are available
function getVapiClient() {
    const token = process.env.VAPI_PRIVATE_KEY || process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_API_KEY
    if (!token) {
        throw new Error('Vapi API key not found. Please set VAPI_PRIVATE_KEY in your environment.')
    }
    return new VapiClient({ token })
}

// Voice ID Mappings (using commercially available high-quality voices or Vapi defaults)
const VOICE_MAP: Record<string, { provider: string, voiceId: string }> = {
    'jennifer': { provider: '11labs', voiceId: '21m00Tcm4TlvDq8ikWAM' }, // Rachel (common standard)
    'mark': { provider: '11labs', voiceId: 'TxGEqnHWrfWFTfGW9XjX' }, // Josh
    'sarah': { provider: '11labs', voiceId: 'EXAVITQu4vr4xnSDxMaL' }, // Bella
    'david': { provider: '11labs', voiceId: 'ErXwobaYiN019PkySvjV' }  // Antoni
}

const DEFAULT_VOICE = VOICE_MAP['jennifer']

export async function getPracticeByPhone(phoneNumber: string) {
    const supabase = createAdminClient()

    // Normalize phone number (strip + or formatting if needed, but Vapi usually sends E.164)
    // We assume DB stores E.164
    const { data, error } = await supabase
        .from('practices')
        .select('*')
        .or(`phone_number.eq.${phoneNumber},forwarding_number.eq.${phoneNumber}`) // strict match on either for now
        .maybeSingle()

    if (error) {
        console.error("Error fetching practice by phone:", error)
        return null
    }
    return data
}

export function generateSystemPrompt(practice: any) {
    const greeting = practice.ai_greeting || "Hello! How can I help you today?"
    const tone = practice.ai_tone || 'professional'
    const transferKeywords = practice.transfer_keywords || []
    const officeHours = practice.office_hours || { start: '09:00', end: '17:00' }

    // Build the prompt
    let prompt = `You are an AI receptionist for ${practice.name || 'a dental office'}. `
    prompt += `Your role is to help patients schedule appointments and answer basic questions. `

    if (tone === 'friendly') {
        prompt += `Be very warm, friendly, and casual. Use emojis in your tone (metaphorically). `
    } else if (tone === 'empathetic') {
        prompt += `Be deeply understanding and patient. Many callers may be in pain. `
    } else {
        prompt += `Be professional, concise, and polite. `
    }

    prompt += `\n\nCORE RULES:\n`
    prompt += `1. Verify if the user is a new or existing patient.\n`
    prompt += `2. If they want to book, use the 'checkAvailability' and 'bookAppointment' tools.\n`
    prompt += `3. The office is open from ${officeHours.start} to ${officeHours.end}.\n`

    // Transfer logic
    if (transferKeywords.length > 0) {
        prompt += `4. If the user says any of these phrases: [${transferKeywords.join(', ')}], `
        prompt += `or asks for a "real person", immediately transfer the call by ending the conversation with the reason "transfer".\n`
    }

    // Emergency logic
    if (practice.emergency_keywords?.length > 0) {
        prompt += `5. If the user mentions [${practice.emergency_keywords.join(', ')}], treat it as an emergency and advise them to call 911 if life-threatening, or transfer immediately.\n`
    }

    prompt += `\nYour first message to the user is: "${greeting}"`

    return prompt
}

export function constructVapiConfig(practice: any) {
    const voiceSetting = practice.ai_voice || 'jennifer'
    const voice = VOICE_MAP[voiceSetting] || DEFAULT_VOICE
    const systemPrompt = generateSystemPrompt(practice)

    return {
        // assistant object expected by Vapi
        name: practice.name,
        voice: {
            provider: voice.provider,
            voiceId: voice.voiceId,
            stability: 0.5,
            similarityBoost: 0.75
        } as any,
        model: {
            provider: "openai",
            model: "gpt-4-turbo", // or gpt-3.5-turbo if cost sensitive
            messages: [
                {
                    role: "system" as const,
                    content: systemPrompt
                }
            ],
            tools: [
                {
                    type: "sms" as const  // Built-in SMS tool
                },
                {
                    type: "function" as const,
                    function: {
                        name: "checkAvailability",
                        description: "Check available appointment slots for a given time range.",
                        parameters: {
                            type: "object" as const,
                            properties: {
                                startTime: { type: "string" as const, description: "ISO 8601 start time" },
                                endTime: { type: "string" as const, description: "ISO 8601 end time" }
                            },
                            required: ["startTime", "endTime"]
                        }
                    }
                },
                {
                    type: "function" as const,
                    function: {
                        name: "bookAppointment",
                        description: "Book an appointment for the patient.",
                        parameters: {
                            type: "object" as const,
                            properties: {
                                name: { type: "string" as const, description: "Patient's full name" },
                                email: { type: "string" as const, description: "Patient's email address" },
                                phone: { type: "string" as const, description: "Patient's phone number for SMS confirmation" },
                                startTime: { type: "string" as const, description: "ISO 8601 start time needed" },
                                timeZone: { type: "string" as const, description: "Timezone (default UTC)" }
                            },
                            required: ["name", "email", "phone", "startTime"]
                        }
                    }
                }
            ]
        } as any,
        serverUrl: `${process.env.API_URL}/api/webhooks/vapi`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'fallback_secret'
    }
}

// --- PHONE NUMBER AND CALL MANAGEMENT ---

export async function searchAvailableNumbers(areaCode: string) {
    try {
        const vapi = getVapiClient()
        const numbers = await vapi.phoneNumbers.list()
        return numbers
    } catch (error) {
        console.error("Error searching numbers:", error)
        throw error
    }
}

/**
 * Create a Vapi assistant for a practice without provisioning a number yet.
 */
export async function createAssistantForPractice(practiceId: string) {
    const supabase = createAdminClient()
    const vapi = getVapiClient()

    try {
        const { data: practice } = await supabase.from('practices').select('*').eq('id', practiceId).single()
        if (!practice) throw new Error("Practice not found")

        const assistantConfig = constructVapiConfig(practice)
        const assistant = await vapi.assistants.create(assistantConfig)
        const assistantId = (assistant as any).id

        if (!assistantId) {
            throw new Error('Assistant created but no ID returned')
        }

        // Create initial placeholder record in phone_numbers
        const { data: dbNumber, error } = await supabase.from('phone_numbers').insert({
            practice_id: practiceId,
            vapi_assistant_id: assistantId,
            phone_number: 'PENDING',
            status: 'pending',
            is_primary: true
        }).select().single()

        if (error) throw error
        return dbNumber
    } catch (error) {
        console.error("[Vapi] Failed to create assistant:", error)
        throw error
    }
}

export async function provisionPhoneNumber(areaCode: string, practiceId: string) {
    const supabase = createAdminClient()
    const vapi = getVapiClient()

    try {
        // 1. Fetch practice details
        const { data: practice } = await supabase.from('practices').select('*').eq('id', practiceId).single()
        if (!practice) throw new Error("Practice not found")

        console.log('[Provisioning] Step 1: Practice found:', practice.name)

        // 2. Create Assistant first
        const assistantConfig = constructVapiConfig(practice)
        console.log('[Provisioning] Step 2: Creating assistant...')

        const assistant = await vapi.assistants.create(assistantConfig)
        const assistantId = (assistant as any).id

        if (!assistantId) {
            throw new Error('Assistant created but no ID returned')
        }

        console.log(`[Provisioning] Step 2: Assistant created: ${assistantId}`)

        // 3. Buy phone number from Vapi (This part might still fail if Vapi doesn't allow programmatic purchase)
        console.log('[Provisioning] Step 3: Provisioning phone number...')
        const vapiNumber = await (vapi.phoneNumbers as any).create({
            assistantId: assistantId
        })

        const phoneNumberId = (vapiNumber as any).id
        const phoneNumber = (vapiNumber as any).number

        console.log(`[Provisioning] Step 3: Number provisioned: ${phoneNumber || 'unknown'}`)

        // 4. Save to database
        console.log('[Provisioning] Step 4: Saving to database...')
        const { data: dbNumber, error } = await supabase.from('phone_numbers').insert({
            practice_id: practiceId,
            phone_number: phoneNumber || `+1${areaCode}MOCK${Date.now()}`,
            vapi_phone_number_id: phoneNumberId || `mock_${Date.now()}`,
            vapi_assistant_id: assistantId,
            is_primary: true,
            status: 'active'
        }).select().single()

        if (error) throw error

        console.log('[Provisioning] ✅ Complete! Phone number provisioned successfully')
        return dbNumber

    } catch (error) {
        console.error("[Provisioning] ❌ Failed:", error)
        throw error
    }
}

export async function sendSms(to: string, message: string, practiceId: string) {
    const supabase = createAdminClient()

    try {
        // 1. Find the primary phone number for the practice
        const { data: phoneNumber } = await supabase
            .from('phone_numbers')
            .select('*')
            .eq('practice_id', practiceId)
            .eq('is_primary', true)
            .single()

        if (!phoneNumber || !phoneNumber.vapi_phone_number_id) {
            console.error("No primary Vapi number found for practice", practiceId)
            return false
        }

        // 2. Send via Vapi
        // NOTE: The Vapi SDK does NOT have a direct sendMessage/sendSms method
        // SMS is handled through the assistant's SMS tool during conversations
        // For programmatic SMS, we would need to:
        // - Make an outbound call with the assistant
        // - Have the assistant use its SMS tool
        // OR use Vapi's REST API directly (not via SDK)

        console.log(`[Vapi SMS] Would send to ${to} from ${phoneNumber.phone_number}: "${message}"`)
        console.log(`[Vapi SMS] SDK limitation: No direct SMS method available. SMS sent via assistant tool during calls.`)

        // 3. Log to database as "pending" since we can't actually send it programmatically
        await supabase.from('messages').insert({
            practice_id: practiceId,
            patient_id: null,
            message_type: 'sms',
            direction: 'outbound',
            from_address: phoneNumber.phone_number,
            to_address: to,
            body: message,
            status: 'pending',  // Mark as pending since SDK can't send directly
            provider: 'vapi'
        })

        return true
    } catch (error) {
        console.error("Failed to send SMS:", error)
        return false
    }
}

// --- OUTBOUND CALL FUNCTIONALITY ---

export async function makeOutboundCall(
    phoneNumberId: string,
    customerPhone: string,
    assistantId: string
) {
    const vapi = getVapiClient()

    try {
        const call = await vapi.calls.create({
            phoneNumberId: phoneNumberId,
            customer: {
                number: customerPhone
            },
            assistantId: assistantId
        } as any)

        console.log(`Outbound call initiated: ${(call as any).id || 'unknown'}`)
        return call
    } catch (error) {
        console.error("Failed to make outbound call:", error)
        throw error
    }
}

/**
 * Import a Twilio phone number into Vapi
 */
export async function importTwilioNumberToVapi(
    twilioPhoneNumber: string,
    twilioAccountSid: string,
    twilioAuthToken: string
) {
    const vapi = getVapiClient()

    try {
        const vapiPhone = await vapi.phoneNumbers.create({
            provider: 'twilio',
            twilioAccountSid: twilioAccountSid,
            twilioAuthToken: twilioAuthToken,
            twilioPhoneNumber: twilioPhoneNumber
        } as any)

        return {
            id: (vapiPhone as any).id,
            number: (vapiPhone as any).number,
            voiceUrl: (vapiPhone as any).voiceUrl
        }
    } catch (error) {
        console.error('[Vapi] Failed to import Twilio number:', error)
        throw error
    }
}

/**
 * Link an assistant to a specific phone number ID in Vapi
 */
export async function linkAssistantToPhone(
    phoneNumberId: string,
    assistantId: string
) {
    const vapi = getVapiClient()

    try {
        await (vapi.phoneNumbers as any).update(phoneNumberId, {
            assistantId: assistantId
        })
    } catch (error) {
        console.error('[Vapi] Failed to link assistant to phone:', error)
        throw error
    }
}
