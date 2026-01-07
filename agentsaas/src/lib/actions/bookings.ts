'use server'

import { createClient } from '@/lib/supabase/server'
import { createBooking as createBookingService } from '@/lib/services/booking-service'
import { revalidatePath } from 'next/cache'

export async function createManualBooking(formData: {
    name: string
    email: string
    phone: string
    startTime: string
    timeZone: string
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Unauthorized')

    // Get practice ID
    const { data: practice } = await supabase
        .from('practices')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!practice) throw new Error('Practice not found')

    try {
        await createBookingService(
            formData.name,
            formData.email,
            formData.phone,
            formData.startTime,
            formData.timeZone,
            undefined, // no call id
            practice.id
        )

        revalidatePath('/dashboard/appointments')
        return { success: true }
    } catch (error: any) {
        console.error('Manual booking failed:', error)
        return { success: false, error: error.message }
    }
}
