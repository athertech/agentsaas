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

const DEFAULT_VOICE_ID = 'Tara' // Default Vapi voice for initialization
const DEFAULT_PROVIDER = 'vapi'

export async function getPracticeByPhone(phoneNumber: string) {
    const supabase = createAdminClient()

    // Normalize phone number (strip + or formatting if needed, but Vapi usually sends E.164)
    // We assume DB stores E.164
    const { data, error } = await supabase
        .from('practices')
        .select(`
            *,
            knowledge_base(*)
        `)
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

    // Knowledge Base Injection
    if (practice.knowledge_base && practice.knowledge_base.length > 0) {
        prompt += `\nINSTRUCTIONS & PRACTICE KNOWLEDGE:\n`
        practice.knowledge_base.forEach((kb: any) => {
            if (kb.question) {
                prompt += `Q: ${kb.question}\nA: ${kb.content}\n\n`
            } else {
                prompt += `- ${kb.content}\n`
            }
        })
    }

    prompt += `\nYour first message to the user is: "${greeting}"`

    return prompt
}

function getAppUrl() {
    // API_URL should be the full URL in production, but we add fallbacks and protocol checks
    let url = process.env.API_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Ensure protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        // Default to https for non-localhost, http for localhost
        const protocol = url.includes('localhost') ? 'http://' : 'https://'
        url = `${protocol}${url}`
    }

    // Remove trailing slash
    return url.replace(/\/$/, '')
}

export function constructVapiConfig(practice: any) {
    const voiceId = practice.ai_voice || DEFAULT_VOICE_ID
    const provider = practice.ai_voice_provider || DEFAULT_PROVIDER
    const systemPrompt = generateSystemPrompt(practice)
    const appUrl = getAppUrl()

    return {
        // assistant object expected by Vapi
        name: practice.name,
        voice: {
            provider: provider,
            voiceId: voiceId
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
        serverUrl: `${appUrl}/api/webhooks/vapi`,
        serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET || 'fallback_secret'
    }
}

// --- PHONE NUMBER AND CALL MANAGEMENT ---

export async function listNumbers() {
    try {
        const vapi = getVapiClient()
        // Vapi doesn't have a direct "search" in the SDK for available numbers to buy like Twilio does.
        // Usually you just request one via .create().
        // However, we can list EXISTING numbers to see what's available if we already own some,
        // or we can just provide a "buy" button for the area code.
        const numbers = await vapi.phoneNumbers.list()
        return numbers
    } catch (error) {
        console.error("Error listing numbers:", error)
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

/**
 * Provision a phone number directly from Vapi or link an existing unassigned one.
 */
export async function provisionPhoneNumber(areaCode: string, practiceId: string, vapiPhoneNumberId?: string | null) {
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

        // 3. Buy phone number from Vapi (utilizing free tier if available) or use existing
        let vapiNumber: any

        if (vapiPhoneNumberId) {
            console.log(`[Provisioning] Step 3: Linking existing Vapi number ${vapiPhoneNumberId}...`)
            vapiNumber = await (vapi.phoneNumbers as any).update(vapiPhoneNumberId, {
                assistantId: assistantId,
                name: `${practice.name} Main Line`
            })
        } else {
            console.log(`[Provisioning] Step 3: Provisioning NEW phone number...`)
            vapiNumber = await (vapi.phoneNumbers as any).create({
                provider: 'vapi',
                name: `${practice.name} Main Line`,
                assistantId: assistantId
            })
        }

        const phoneNumberId = (vapiNumber as any).id
        const phoneNumber = (vapiNumber as any).number

        console.log(`[Provisioning] Step 3: Number provisioned: ${phoneNumber || 'unknown'}`)

        // 4. Save to database
        console.log('[Provisioning] Step 4: Saving to database...')
        const { data: dbNumber, error } = await supabase.from('phone_numbers').insert({
            practice_id: practiceId,
            phone_number: phoneNumber || `+1${areaCode}PENDING`,
            vapi_phone_number_id: phoneNumberId,
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
