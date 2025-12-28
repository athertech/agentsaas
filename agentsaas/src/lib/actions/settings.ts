'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateSettings(formData: FormData) {
    const { revalidatePath } = await import('next/cache')
    const supabase = await createClient()

    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const website = formData.get('website') as string
    const forwardingNumber = formData.get('forwarding_number') as string
    const officeHoursStart = formData.get('office_hours_start') as string
    const officeHoursEnd = formData.get('office_hours_end') as string

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        throw new Error('Not authenticated')
    }

    // Check if practice exists for user
    const { data: practice } = await supabase
        .from('practices')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    const payload = {
        owner_id: user.id,
        name,
        address,
        website,
        forwarding_number: forwardingNumber,
        office_hours: {
            ...practice?.office_hours,
            start: officeHoursStart,
            end: officeHoursEnd
        }
    }

    if (practice) {
        await supabase.from('practices').update(payload).eq('id', practice.id)
    } else {
        await supabase.from('practices').insert(payload)
    }

    revalidatePath('/dashboard/settings')
}
