import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
const envPath = path.resolve(process.cwd(), '.env.local')
console.log('Loading env from:', envPath)
dotenv.config({ path: envPath })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('Supabase Key Type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Service Role' : 'Anon')

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
})

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

async function seedMockData() {
    try {
        console.log('Seeding started...')

        // 1. Get an existing user to assign the practice to
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers()

        if (usersError || !users.users || users.users.length === 0) {
            console.log('No users found, creating one...')
            const { data: newUser, error: signupError } = await supabase.auth.admin.createUser({
                email: 'test@example.com',
                password: 'password123',
                email_confirm: true
            })
            if (signupError) throw signupError
            var userId = newUser.user?.id
        } else {
            var userId = users.users[0].id
        }

        if (!userId) throw new Error('Failed to get user ID')
        console.log('Using User ID:', userId)

        if (!userId) throw new Error('Failed to get user ID')
        console.log('Using User ID:', userId)

        // 3. Get or Create practice
        console.log('Checking for existing practice...')
        let practiceId: string

        const { data: existingPractices } = await supabase
            .from('practices')
            .select('id')
            .limit(1)

        if (existingPractices && existingPractices.length > 0) {
            practiceId = existingPractices[0].id
            console.log('Using existing practice:', practiceId)
        } else {
            console.log('Creating new practice...')
            const { data: practice, error: insError } = await supabase.from('practices').insert({
                owner_id: userId,
                name: "Bright Smile Dental",
                address: "123 Smile Way, Dental City, DC 12345"
            }).select().single()

            if (insError) throw insError
            practiceId = practice.id
            console.log('Practice created:', practiceId)
        }

        // 4. Create a mock patient
        console.log('Creating patient...')
        const { data: patient, error: patError } = await supabase.from('patients').insert({
            practice_id: practiceId,
            first_name: 'Alex',
            last_name: 'Johnson',
            phone: '+15550123456',
            email: 'alex.j@example.com',
            patient_type: 'new'
        }).select().single()

        if (patError) throw patError
        console.log('Created patient:', patient.id)

        // 4. Create mock calls with all new columns
        const calls = [
            {
                practice_id: practiceId,
                patient_id: patient.id,
                caller_number: '+15550123456',
                status: 'completed',
                outcome: 'booked',
                direction: 'inbound',
                duration_seconds: 145,
                talk_time_seconds: 132,
                transcript: JSON.stringify(MOCK_TRANSCRIPT),
                summary: "Alex Johnson (new patient) called to book a cleaning. Appointment scheduled for next Tuesday at 10:00 AM.",
                started_at: new Date(Date.now() - 3600000).toISOString()
            },
            {
                practice_id: practiceId,
                caller_number: '+15559876543',
                status: 'completed',
                outcome: 'transferred',
                direction: 'inbound',
                duration_seconds: 85,
                talk_time_seconds: 78,
                transcript: JSON.stringify([
                    { role: 'assistant', content: "Hello, Bright Smile Dental. How can I help you?" },
                    { role: 'user', content: "I have a question about my bill from last week." },
                    { role: 'assistant', content: "I understand. For billing questions, I should connect you with our office manager. Please hold a moment." }
                ]),
                summary: "Caller had a billing question. Call transferred to human staff for assistance.",
                started_at: new Date(Date.now() - 7200000).toISOString()
            }
        ]

        console.log('Inserting calls...')
        const { data: insertedCalls, error: callError } = await supabase.from('calls').insert(calls).select()
        if (callError) throw callError
        console.log('Calls inserted successfully')

        // 5. Create linked booking for booked calls
        const bookedCall = insertedCalls.find(c => c.outcome === 'booked')
        if (bookedCall) {
            console.log('Creating linked booking for call:', bookedCall.id)
            const { error: bookingError } = await supabase.from('bookings').insert({
                call_id: bookedCall.id,
                practice_id: practiceId,
                patient_id: patient.id,
                start_time: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
                end_time: new Date(Date.now() + 86400000 * 2 + 3600000).toISOString(),
                appointment_type: 'Cleaning and Exam',
                status: 'scheduled'
            })
            if (bookingError) throw bookingError
            console.log('Booking created successfully')
        }

        // 6. Create leads for unbooked calls (follow-up opportunity)
        const unbookedCalls = insertedCalls.filter(c => c.outcome !== 'booked' && c.status === 'completed')
        if (unbookedCalls.length > 0) {
            console.log('Creating leads for unbooked calls...')
            const leads = unbookedCalls.map(call => ({
                practice_id: practiceId,
                first_name: call.outcome === 'transferred' ? 'Unknown' : 'Lead',
                last_name: 'Caller',
                phone: call.caller_number,
                status: 'new',
                priority: call.outcome === 'transferred' ? 'high' : 'medium',
                expected_value: 0,
                last_call_id: call.id,
                notes: `Auto-generated lead from call result: ${call.outcome}. Summary: ${call.summary || 'No summary available.'}`
            }))

            const { error: leadError } = await supabase.from('leads').insert(leads)
            if (leadError) throw leadError
            console.log('Leads created successfully')
        }

        console.log('Successfully seeded mock call, booking, and lead data!')
    } catch (err) {
        console.error('Error seeding data:', err)
    }
}

seedMockData()
