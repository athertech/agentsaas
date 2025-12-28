import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAvailableSlots, createBooking } from '@/lib/services/booking-service'

export async function POST(req: NextRequest) {
    const supabase = createAdminClient()

    try {
        const body = await req.json()
        const { message } = body

        // Vapi sends a 'message' object with tool calls or events
        if (!message) {
            // Some events might be top-level, let's check body.type too
            const type = body.type || body.message?.type

            if (type === 'call.ended') {
                await handleCallEnded(body.call || body.message?.call, supabase)
                return Response.json({ success: true })
            }

            return Response.json({ error: 'Invalid payload' }, { status: 400 })
        }

        const { type } = message
        const call = message.call || body.call || body.message?.call
        let practiceId: string | undefined = undefined

        if (call?.assistantId) {
            const { data: phone } = await supabase
                .from('phone_numbers')
                .select('practice_id')
                .eq('vapi_assistant_id', call.assistantId)
                .limit(1)
                .maybeSingle()

            if (phone) practiceId = phone.practice_id
        }

        console.log(`[Vapi Webhook] Received event type: ${type} for practice: ${practiceId}`)

        switch (type) {
            case 'tool-calls':
                const results = await handleToolCalls(message.toolCallList, call, practiceId)
                return Response.json({ results })

            case 'call.ended':
                await handleCallEnded(call, supabase, practiceId)
                break;

            default:
                console.log(`[Vapi Webhook] Unhandled event type: ${type}`)
        }

        return Response.json({ success: true })

    } catch (error: any) {
        console.error('[Vapi Webhook] Error:', error)
        return Response.json({ success: false, error: error.message }, { status: 500 })
    }
}

async function handleToolCalls(toolCalls: any[], call: any, practiceId?: string) {
    const results = []

    for (const toolCall of toolCalls) {
        const { id, function: fn } = toolCall
        const { name, arguments: args } = fn

        console.log(`[Vapi Webhook] Executing tool: ${name}`, args)

        let result = null

        try {
            if (name === 'checkAvailability') {
                const slots = await getAvailableSlots(args.startTime, args.endTime, practiceId)
                result = { slots }
            } else if (name === 'bookAppointment') {
                const booking = await createBooking(
                    args.name,
                    args.email,
                    args.phone,
                    args.startTime,
                    args.timeZone || 'UTC',
                    call.id,
                    practiceId
                )
                result = { success: true, bookingId: booking.id }
            } else {
                result = { error: `Unknown tool: ${name}` }
            }
        } catch (err: any) {
            console.error(`[Vapi Webhook] Tool ${name} failed:`, err)
            result = { error: err.message }
        }

        results.push({
            toolCallId: id,
            result
        })
    }

    return results
}

async function handleCallEnded(call: any, supabase: any, practiceId?: string) {
    if (!call) return

    console.log(`[Vapi Webhook] Processing end of call: ${call.id}`)

    // Update or Insert call record
    const callData: any = {
        vapi_call_id: call.id,
        practice_id: practiceId || call.assistantId,
        status: call.status,
        started_at: call.startedAt,
        ended_at: call.endedAt,
        duration_seconds: Math.floor(call.duration || 0),
        transcript: call.transcript,
        summary: call.summary,
        recording_url: call.recordingUrl,
        direction: call.type === 'outboundPhoneCall' ? 'outbound' : 'inbound',
        outcome: call.endedReason
    }

    const { error } = await supabase
        .from('calls')
        .upsert(callData, { onConflict: 'vapi_call_id' })

    if (error) {
        console.error('[Vapi Webhook] Failed to save call record:', error)
    }
}
