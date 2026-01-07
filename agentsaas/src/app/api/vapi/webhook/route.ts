import { NextResponse } from 'next/server'
import { logCall } from '@/lib/services/call-log-service'
import { headers } from 'next/headers'

export async function POST(req: Request) {
    try {
        const headerPayload = await headers()
        const authHeader = headerPayload.get('x-vapi-secret')

        if (authHeader !== process.env.VAPI_WEBHOOK_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await req.json()
        // Log the incoming webhook for debugging
        console.log('Received Vapi Webhook:', JSON.stringify(body, null, 2))

        // Handle Assistant Request (Dynamic Configuration)
        if (body.message?.type === 'assistant-request') {
            const { getPracticeByPhone, constructVapiConfig } = await import('@/lib/services/vapi-service')

            const call = body.message.call
            const phoneNumber = call?.customer?.number

            if (phoneNumber) {
                const practice = await getPracticeByPhone(phoneNumber)
                if (practice) {
                    const config = constructVapiConfig(practice)
                    console.log(`Returning dynamic config for practice: ${practice.name}`)

                    return NextResponse.json({
                        assistant: config
                    }, { status: 201 })
                }
            }

            // Fallback if practice not found (or no phone number)
            console.warn(`No practice found for number ${phoneNumber}, using default behavior.`)
            // Return empty 201 to let Vapi use dashboard defaults, or provide a generic fallback here
            return NextResponse.json({
                // optional: some generic fallback assistant
            }, { status: 201 })
        }

        // Handle Tool Calls
        if (body.message?.type === 'tool-calls') {
            const toolCalls = body.message.toolCalls
            const call = body.message.call
            const phoneNumber = call?.customer?.number

            // Fetch practice once for all tool calls in this message
            let practiceId: string | undefined
            if (phoneNumber) {
                const { getPracticeByPhone } = await import('@/lib/services/vapi-service')
                const practice = await getPracticeByPhone(phoneNumber)
                practiceId = practice?.id
            }

            // Vapi can send multiple tool calls, we'll map them (though usually one at a time)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const results = await Promise.all(toolCalls.map(async (toolCall: any) => {
                const { name, parameters } = toolCall.function

                try {
                    if (name === 'checkAvailability') {
                        const { startTime, endTime } = parameters
                        // Dynamic import to avoid circular dep issues if any
                        const { getAvailableSlots } = await import('@/lib/services/booking-service')
                        const slots = await getAvailableSlots(startTime, endTime, practiceId)
                        return {
                            toolCallId: toolCall.id,
                            result: JSON.stringify({ slots })
                        }
                    }

                    if (name === 'bookAppointment') {
                        const { name: patientName, email, startTime, timeZone } = parameters
                        const { createBooking } = await import('@/lib/services/booking-service')

                        // Extract call ID if available
                        const callId = body.message?.call?.id

                        const booking = await createBooking(patientName, email, phoneNumber || '', startTime, timeZone, callId, practiceId)
                        return {
                            toolCallId: toolCall.id,
                            result: JSON.stringify({ success: true, bookingId: booking.id })
                        }
                    }
                } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                    console.error(`Error executing tool ${name}:`, error)
                    return {
                        toolCallId: toolCall.id,
                        error: error.message
                    }
                }

                return { toolCallId: toolCall.id, result: 'Function not found' }
            }))

            // Return results to Vapi
            return NextResponse.json({
                results,
                // Optional: you can return client_state to persist data
            }, { status: 200 })
        }

        // Handle end-of-call report
        if (body.message?.type === 'end-of-call-report') {
            await logCall(body)
        }

        return NextResponse.json({ received: true }, { status: 200 })
    } catch (error) {
        console.error('Webhook Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
