'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateIntegrationSettings(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const calcom_api_key = formData.get('calcom_api_key') as string
    const calcom_event_type_id = formData.get('calcom_event_type_id') as string

    const { error } = await supabase
        .from('practices')
        .update({
            calcom_api_key,
            calcom_event_type_id
        })
        .eq('owner_id', user.id)

    if (error) {
        console.error('Error updating integration settings:', error)
        throw new Error('Failed to update settings')
    }

    revalidatePath('/dashboard/settings/integrations')
}
