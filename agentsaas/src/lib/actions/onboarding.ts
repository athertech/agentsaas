'use server'
import { createClient } from '@/lib/supabase/server'
import { OnboardingData } from '@/lib/types/onboarding'
import { performProvisioning } from './phone-numbers'

export async function completeOnboarding(onboardingData: OnboardingData) {
    const { revalidatePath } = await import('next/cache')
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    // Prepare payload for practices table
    const payload = {
        owner_id: user.id,
        name: onboardingData.practiceName,
        address: onboardingData.address,
        website: onboardingData.website,
        practice_type: onboardingData.practiceType,
        insurance: onboardingData.insurance,
        phone_number: onboardingData.phoneNumber,
        office_hours: onboardingData.officeHours,
        ai_voice: onboardingData.voiceId,
        ai_voice_provider: onboardingData.voiceProvider,
        ai_greeting: onboardingData.greeting,
        ai_tone: onboardingData.tone,
        calcom_api_key: onboardingData.calcomApiKey,
        calcom_event_type_id: onboardingData.calcomEventTypeId,
        appointment_types: onboardingData.appointmentTypes,
        has_completed_onboarding: true,
    }

    // Check if practice already exists
    const { data: existingPractice } = await supabase
        .from('practices')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

    let practiceId = existingPractice?.id

    if (existingPractice) {
        const { error } = await supabase
            .from('practices')
            .update(payload)
            .eq('id', existingPractice.id)
        if (error) throw error
    } else {
        const { data, error } = await supabase
            .from('practices')
            .insert(payload)
            .select('id')
            .single()
        if (error) throw error
        practiceId = data.id
    }

    // Handle Knowledge Base entries
    if (onboardingData.knowledgeBase && onboardingData.knowledgeBase.length > 0 && practiceId) {
        const kbEntries = onboardingData.knowledgeBase.map(entry => ({
            practice_id: practiceId,
            category: entry.category,
            question: entry.question,
            content: entry.content
        }))

        const { error: kbError } = await supabase
            .from('knowledge_base')
            .insert(kbEntries)

        if (kbError) {
            console.error('[Onboarding] KB save failed:', kbError)
        }
    }

    // 3. Provision Phone Number if selected
    if (onboardingData.phoneNumber && practiceId) {
        try {
            console.log(`[Onboarding] Provisioning phone number ${onboardingData.phoneNumber} for practice ${practiceId}`)
            await performProvisioning(practiceId, onboardingData.phoneNumber, onboardingData.practiceName)
        } catch (error) {
            console.error('[Onboarding] Phone provisioning failed:', error)
            // We don't throw here to avoid failing the whole onboarding, 
            // the user can retry provisioning in settings.
        }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/settings')
}

export async function savePracticeDraft(onboardingData: Partial<OnboardingData>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const payload: any = {
        owner_id: user.id,
    }

    if (onboardingData.practiceName) payload.name = onboardingData.practiceName
    if (onboardingData.address) payload.address = onboardingData.address
    if (onboardingData.website) payload.website = onboardingData.website
    if (onboardingData.practiceType) payload.practice_type = onboardingData.practiceType
    if (onboardingData.phoneNumber) payload.phone_number = onboardingData.phoneNumber
    if (onboardingData.officeHours) payload.office_hours = onboardingData.officeHours
    if (onboardingData.voiceId) payload.ai_voice = onboardingData.voiceId
    if (onboardingData.voiceProvider) payload.ai_voice_provider = onboardingData.voiceProvider
    if (onboardingData.greeting) payload.ai_greeting = onboardingData.greeting
    if (onboardingData.tone) payload.ai_tone = onboardingData.tone

    // Check if practice already exists
    console.log(`[savePracticeDraft] Checking for existing practice for user: ${user.id}`)
    const { data: existingPractice, error: selectError } = await supabase
        .from('practices')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

    if (selectError) {
        console.error(`[savePracticeDraft] SELECT error:`, selectError)
        // If it's a permission error, we might still want to try inserting 
        // if we are sure the user should have one.
        // But for now, let's throw to be safe and visible.
        throw selectError
    }

    if (existingPractice) {
        console.log(`[savePracticeDraft] Found existing practice: ${existingPractice.id}. Updating...`)
        const { error } = await supabase
            .from('practices')
            .update(payload)
            .eq('id', existingPractice.id)
        if (error) {
            console.error(`[savePracticeDraft] UPDATE error:`, error)
            throw error
        }
        return existingPractice.id
    } else {
        console.log(`[savePracticeDraft] No existing practice found. Inserting new record...`)
        const { data, error } = await supabase
            .from('practices')
            .insert(payload)
            .select('id')
            .single()

        if (error) {
            console.error(`[savePracticeDraft] INSERT error:`, error)
            throw error
        }
        console.log(`[savePracticeDraft] Successfully created practice: ${data.id}`)
        return data.id
    }
}
