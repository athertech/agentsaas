import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
dotenv.config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function seedLeads() {
    console.log('Seeding leads...')

    // 1. Get the first practice
    const { data: practices } = await supabase.from('practices').select('id').limit(1)
    if (!practices || practices.length === 0) {
        console.log('No practice found. Run seed-mock-calls.ts first.')
        return
    }
    const practiceId = practices[0].id

    // 2. Create mock leads
    const mockLeads = [
        {
            practice_id: practiceId,
            first_name: 'John',
            last_name: 'Smith',
            phone: '+15551112222',
            email: 'john.smith@example.com',
            status: 'new',
            priority: 'high',
            expected_value: 1200,
            notes: 'Left a voicemail about a full set of veneers.'
        },
        {
            practice_id: practiceId,
            first_name: 'Sarah',
            last_name: 'Miller',
            phone: '+15553334444',
            status: 'contacted',
            priority: 'medium',
            expected_value: 350,
            notes: 'Interested in a teeth whitening session. Needs to check schedule.'
        },
        {
            practice_id: practiceId,
            first_name: 'Mike',
            last_name: 'Jones',
            phone: '+15555556666',
            status: 'interested',
            priority: 'low',
            expected_value: 150,
            notes: 'Asked about insurance coverage for routine cleaning.'
        },
        {
            practice_id: practiceId,
            first_name: 'Emily',
            last_name: 'Wilson',
            phone: '+15557778888',
            status: 'scheduled',
            priority: 'high',
            expected_value: 2500,
            notes: 'Root canal scheduled for next week.'
        }
    ]

    const { error } = await supabase.from('leads').insert(mockLeads)
    if (error) {
        console.error('Error seeding leads:', error)
    } else {
        console.log('Successfully seeded mock lead data!')
    }
}

seedLeads()
