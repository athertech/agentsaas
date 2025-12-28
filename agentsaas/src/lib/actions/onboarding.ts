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
        ai_greeting: onboardingData.greeting,
        ai_tone: onboardingData.tone,
        calcom_api_key: onboardingData.calcomApiKey,
        calcom_event_type_id: onboardingData.calcomEventTypeId,
    }

    // Check if practice already exists (shouldn't usually happen in onboarding but good to be safe)
    const { data: existingPractice } = await supabase
        .from('practices')
        .select('id')
        .eq('owner_id', user.id)
        .single()

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
