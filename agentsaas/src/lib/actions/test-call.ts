'use server'

import { makeOutboundCall } from '@/lib/services/vapi-service'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function makeTestCall(phoneNumber: string) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    try {
        // Get current user's practice
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            throw new Error("Not authenticated")
        }

        const { data: practice } = await adminSupabase
            .from('practices')
            .select('id')
            .eq('owner_id', user.id)
            .single()

        if (!practice) {
            throw new Error("Practice not found")
        }

        // Get practice's Vapi phone number
        const { data: vapiNumber } = await adminSupabase
            .from('phone_numbers')
            .select('*')
            .eq('practice_id', practice.id)
            .eq('is_primary', true)
            .single()

        if (!vapiNumber) {
            throw new Error("No phone number provisioned. Please get a phone number first.")
        }

        // Validate phone number format (basic E.164 check)
        if (!phoneNumber.match(/^\+?[1-9]\d{1,14}$/)) {
            throw new Error("Invalid phone number format. Use E.164 format (e.g., +15125551234)")
        }

        // Make test call
        const call = await makeOutboundCall(
            vapiNumber.vapi_phone_number_id,
            phoneNumber,
            vapiNumber.vapi_assistant_id
        )

        return {
            success: true,
            callId: (call as any).id || 'unknown',
            message: `Test call initiated to ${phoneNumber}`
        }

    } catch (error) {
        console.error('Error making test call:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to make test call'
        }
    }
}
