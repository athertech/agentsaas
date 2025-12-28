'use server'

import { searchAvailableNumbers, purchasePhoneNumber, updatePhoneNumberWebhooks } from '@/lib/services/twilio-service'
import { importTwilioNumberToVapi, provisionPhoneNumber, linkAssistantToPhone, createAssistantForPractice } from '@/lib/services/vapi-service'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

/**
 * Search for available phone numbers via Twilio
 */
export async function searchNumbers(areaCode: string) {
    try {
        const numbers = await searchAvailableNumbers(areaCode)
        return { success: true, numbers }
    } catch (error: any) {
        console.error('[Actions] Error searching numbers:', error)
        return { success: false, error: error.message }
    }
}

/**
 * Core provisioning logic (reusable)
 */
export async function performProvisioning(
    practiceId: string,
    selectedNumber: string,
    practiceName: string
) {
    const adminSupabase = createAdminClient()

    // 1. Check if already has primary number
    const { data: existing } = await adminSupabase
        .from('phone_numbers')
        .select('*')
        .eq('practice_id', practiceId)
        .eq('is_primary', true)
        .maybeSingle()

    if (existing) {
        throw new Error('Already has a primary number')
    }

    console.log(`[Provisioning] Starting for ${practiceName} (Number: ${selectedNumber})`)

    // 2. Purchase from Twilio
    console.log('[Provisioning] Step 1: Purchasing from Twilio...')
    const twilioNumber = await purchasePhoneNumber(selectedNumber)

    // 3. Import to Vapi
    console.log('[Provisioning] Step 2: Importing to Vapi...')
    const vapiPhone = await importTwilioNumberToVapi(
        twilioNumber.phoneNumber,
        process.env.TWILIO_ACCOUNT_SID!,
        process.env.TWILIO_AUTH_TOKEN!
    )

    // 4. Create Vapi assistant 
    console.log('[Provisioning] Step 3: Creating Vapi assistant...')
    const dbRecord = await createAssistantForPractice(practiceId)
    const assistantId = dbRecord.vapi_assistant_id

    // 5. Link assistant to phone in Vapi
    console.log('[Provisioning] Step 4: Linking assistant to number...')
    await linkAssistantToPhone(vapiPhone.id, assistantId)

    // 6. Update Twilio with Vapi voice URL
    console.log('[Provisioning] Step 5: Updating Twilio webhooks...')
    await updatePhoneNumberWebhooks(twilioNumber.sid, vapiPhone.voiceUrl)

    // 7. Update database record with Twilio info and link everything
    console.log('[Provisioning] Step 6: Updating database record...')

    const { error: updateError } = await adminSupabase
        .from('phone_numbers')
        .update({
            phone_number: twilioNumber.phoneNumber,
            vapi_phone_number_id: vapiPhone.id,
            vapi_assistant_id: assistantId,
            twilio_sid: twilioNumber.sid,
            twilio_account_sid: process.env.TWILIO_ACCOUNT_SID,
            status: 'active',
            is_primary: true
        })
        .eq('id', dbRecord.id)

    if (updateError) throw updateError

    console.log('[Provisioning] ✅ Complete!')
    return { success: true, phoneNumber: twilioNumber.phoneNumber }
}

/**
 * Complete provisioning flow (Redirect wrapper)
 */
export async function provisionPhoneNumberComplete(
    selectedNumber: string,
    areaCode: string
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
        await performProvisioning(practice.id, selectedNumber, practice.name)
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
export async function getPhoneNumbers() {
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
