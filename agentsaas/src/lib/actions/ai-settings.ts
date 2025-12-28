'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function updateAISettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const voice = formData.get('voice') as string
    const greeting = formData.get('greeting') as string
    const tone = formData.get('tone') as string
    const transferKeywords = (formData.get('transfer_keywords') as string)
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    const emergencyKeywords = (formData.get('emergency_keywords') as string)
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
    const forwardingNumber = formData.get('forwarding_number') as string

    // Update practice with AI settings
    const { error } = await supabase
        .from('practices')
        .update({
            ai_voice: voice,
            ai_greeting: greeting,
            ai_tone: tone,
            transfer_keywords: transferKeywords,
            emergency_keywords: emergencyKeywords,
            forwarding_number: forwardingNumber,
        })
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error updating AI settings:', error)
        redirect('/dashboard/settings/ai?error=Could not update settings')
    }

    revalidatePath('/dashboard/settings/ai')
    redirect('/dashboard/settings/ai?success=Settings updated successfully')
}
