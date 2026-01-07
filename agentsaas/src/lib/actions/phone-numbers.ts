'use server'

import { provisionPhoneNumber, listNumbers } from '@/lib/services/vapi-service'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Search for available phone numbers (Now via Vapi)
 * Returns both existing unassigned numbers and a placeholder for new ones.
 */
export async function searchNumbers(areaCode: string) {
    try {
        // 1. Get existing numbers from Vapi
        const vapiNumbers = await listNumbers()

        // 2. Filter for numbers that don't have an assistant assigned (available to use)
        // Note: SDK types might be loose, we'll use 'any' where needed but try to be safe
        const availableExisting = vapiNumbers.filter((n: any) => !n.assistantId && !n.assistant)

        const results = availableExisting.map((n: any) => ({
            phoneNumber: n.number || n.id, // Use ID as fallback key
            friendlyName: n.number || n.name || 'Unassigned Number',
            locality: 'In Account',
            region: 'Vapi',
            vapi_phone_number_id: n.id,
            isExisting: true
        }))

        // 3. Add a placeholder for provisioning a NEW number
        results.push({
            phoneNumber: `NEW_${areaCode}_${Date.now()}`,
            friendlyName: `New Number (${areaCode})`,
            locality: 'Provision New',
            region: 'Vapi',
            vapi_phone_number_id: null,
            isExisting: false
        } as any)

        return {
            success: true,
            numbers: results
        }
    } catch (error: any) {
        console.error('[Actions] Error searching numbers:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Core provisioning logic (Refactored to Vapi-only)
 */
export async function performProvisioning(
    practiceId: string,
    areaCode: string,
    practiceName: string,
    vapiPhoneNumberId?: string | null
) {
    const adminSupabase = createAdminClient()

    // 1. Check if already has primary number
    const { data: existing } = await adminSupabase
        .from('phone_numbers')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('is_primary', true)
        .maybeSingle()

    if (existing && existing.status === 'active') {
        throw new Error('Already has an active primary number')
    }

    console.log(`[Provisioning] Starting Vapi direct provisioning for ${practiceName} (Area: ${areaCode})`)

    // 2. Provision directly from Vapi
    // This helper now creates assistant AND buys/links the number
    const dbRecord = await provisionPhoneNumber(areaCode, practiceId, vapiPhoneNumberId)

    console.log('[Provisioning] ✅ Complete!')
    return { success: true, phoneNumber: dbRecord.phone_number }
}

/**
 * Complete provisioning flow (Redirect wrapper)
 */
export async function provisionPhoneNumberComplete(
    selectedNumber: string, // This might be "AUTO_XXX" or actual number/ID
    areaCode: string,
    vapiPhoneNumberId?: string | null
) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: practice } = await adminSupabase
        .from('practices')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    if (!practice) redirect('/dashboard/settings?error=practice_not_found')

    try {
        await performProvisioning(practice.id, areaCode, practice.name, vapiPhoneNumberId)
        revalidatePath('/dashboard/settings/phone')
    } catch (error: any) {
        console.error('[Provisioning] ❌ Failed:', error)
        return redirect('/dashboard/settings/phone?error=provisioning_failed')
    }

    redirect('/dashboard/settings/phone?success=number_provisioned')
}

/**
 * Fetch phone numbers for the current practice
 */
export async function getPracticePhoneNumbers() {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: practice } = await adminSupabase
        .from('practices')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!practice) return []

    const { data: numbers } = await supabase
        .from('phone_numbers')
        .select('*')
        .eq('practice_id', practice.id)
        .order('created_at', { ascending: false })

    return numbers || []
}
