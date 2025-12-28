
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createAdminClient } from '@/lib/supabase/admin';

async function testVapiSms() {
    const key = process.env.VAPI_PRIVATE_API_KEY || process.env.VAPI_API_KEY || process.env.VAPI_PRIVATE_KEY;
    console.log(`Key present: ${!!key}, Length: ${key?.length}`);
    if (key) console.log(`Key Start: ${key.substring(0, 5)}...`);

    // Dynamic import to ensure env vars are loaded first
    const { sendSms, provisionPhoneNumber } = await import('../src/lib/services/vapi-service');

    console.log("Testing Vapi SMS...");

    // 1. Setup a practice and phone number in DB if not exists
    const supabase = createAdminClient();
    const { data: practice } = await supabase.from('practices').select('id, name').limit(1).single();

    if (!practice) {
        console.error("No practice found to test with.");
        return;
    }

    console.log(`Using practice: ${practice.name} (${practice.id})`);

    // Ensure practice has a phone number
    const { data: phone } = await supabase.from('phone_numbers').select('*').eq('practice_id', practice.id).limit(1).single();

    if (!phone) {
        console.log("No phone number found, provisioning mock number...");
        // Provision mock
        try {
            await provisionPhoneNumber("+15550000000", practice.id);
            console.log("Provisioned mock number.");
        } catch (e) {
            console.error("Provisioning failed:", e);
            return;
        }
    } else {
        console.log(`Found existing number: ${phone.phone_number}`);
    }

    // 2. Send SMS
    const testNumber = "+19999999999"; // Mock recipient
    const result = await sendSms(testNumber, "Test message from Vapi script", practice.id);

    if (result) {
        console.log("✅ sendSms returned success.");
    } else {
        console.error("❌ sendSms returned failure.");
    }

    // 3. Verify DB log
    const { data: logs } = await supabase.from('messages').select('*').eq('to_address', testNumber).order('created_at', { ascending: false }).limit(1);
    if (logs && logs.length > 0) {
        console.log("✅ Message logged in DB:", logs[0]);
    } else {
        console.error("❌ Message NOT logged in DB.");
    }
}

testVapiSms().catch(console.error);
