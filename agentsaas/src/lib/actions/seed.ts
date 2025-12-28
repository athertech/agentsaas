'use server'

import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

const MOCK_TRANSCRIPT = [
    { role: 'assistant', content: "Thank you for calling Bright Smile Dental, this is Emma. How can I help you today?" },
    { role: 'user', content: "Hi Emma, I'd like to book a cleaning for next week if possible." },
    { role: 'assistant', content: "I'd be happy to help with that. Are you a new or existing patient?" },
    { role: 'user', content: "I'm a new patient. My name is Alex Johnson." },
    { role: 'assistant', content: "Welcome Alex! Let me check our availability for cleanings next week. One moment please." },
    { role: 'assistant', content: "I have a slot on Tuesday at 10:00 AM or Wednesday at 2:00 PM. Do either of those work for you?" },
    { role: 'user', content: "Tuesday at 10:00 AM works perfectly." },
    { role: 'assistant', content: "Great! I've penciled you in for Tuesday at 10:00 AM. I'll just need a few more details to confirm..." }
]

export async function seedMockCalls() {
    console.log("Seeding started...")
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error("Auth error:", authError)
        return { success: false, error: authError?.message || "Not authenticated" }
    }
    console.log("User authenticated:", user.id)

    try {
        // 1. Get or create practice using adminSupabase to bypass RLS
        console.log("Searching for practice...")
        const { data: existingPractice, error: searchError } = await adminSupabase
            .from('practices')
            .select('id')
            .eq('owner_id', user.id)
            .maybeSingle()

        if (searchError) {
            console.error("Search practice error:", searchError)
            return { success: false, error: `Search practice error: ${searchError.message}` }
        }

        let practiceId = existingPractice?.id

        if (!practiceId) {
            console.log("No practice found for user, creating one...")
            const { data: newPractice, error: insertError } = await adminSupabase.from('practices').insert({
                owner_id: user.id,
                name: "Test Dental Practice",
                address: "123 Smile Way, Dental City, DC 12345",
                website: "https://brightsmile.example.com",
                practice_type: ["General Dentistry"],
                insurance: ["Delta Dental", "MetLife"]
            }).select().single()

            if (insertError) {
                console.error("Failed to create practice:", insertError)
                return { success: false, error: `Failed to create practice: ${insertError.message}` }
            }
            practiceId = newPractice.id
            console.log("Practice created:", practiceId)
        } else {
            console.log("Existing practice found:", practiceId)
        }

        // 2. Create mock patient
        console.log("Creating mock patient...")
        const { data: patient, error: patError } = await adminSupabase.from('patients').insert({
            practice_id: practiceId,
            first_name: 'Alex',
            last_name: 'Johnson',
            phone: '+15550123456',
            email: 'alex.j@example.com',
            patient_type: 'new'
        }).select().single()

        if (patError || !patient) {
            console.error("Patient creation error:", patError)
            return { success: false, error: `Failed to create mock patient: ${patError?.message}` }
        }
        console.log("Patient created:", patient.id)

        // 3. Create mock calls
        console.log("Inserting calls...")
        const calls = [
            {
                practice_id: practiceId,
                patient_id: patient.id,
                caller_number: '+15550123456',
                status: 'completed',
                duration_seconds: 145,
                transcript: JSON.stringify(MOCK_TRANSCRIPT),
                summary: "Alex Johnson (new patient) called to book a cleaning. Appointment scheduled for next Tuesday at 10:00 AM.",
                started_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
            },
            {
                practice_id: practiceId,
                caller_number: '+15559876543',
                status: 'completed',
                duration_seconds: 85,
                transcript: JSON.stringify([
                    { role: 'assistant', content: "Hello, Bright Smile Dental. How can I help you?" },
                    { role: 'user', content: "I have a question about my bill from last week." },
                    { role: 'assistant', content: "I understand. For billing questions, I should connect you with our office manager. Please hold a moment." }
                ]),
                summary: "Caller had a billing question. Call transferred to human staff for assistance.",
                started_at: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
            }
        ]

        const { error: callsError } = await adminSupabase.from('calls').insert(calls)
        if (callsError) {
            console.error("Insert calls error:", callsError)
            return { success: false, error: callsError.message }
        }
        console.log("Calls inserted successfully")

        revalidatePath('/dashboard/calls')
        return { success: true }
    } catch (err: any) {
        console.error("Execution error:", err)
        return { success: false, error: err.message || "Unknown error" }
    }
}
