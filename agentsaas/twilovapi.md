# Vapi + Twilio Integration Guide for DentalAnswer AI

vapi apidocs: docs.vapi.ai/api-reference
twilo apidocs: https://www.twilio.com/docs
## 🎯 **The Reality: You Need BOTH Vapi + Twilio**

### **What Each Service Does:**

```
VAPI:
✅ Voice AI (conversation logic)
✅ Call handling and routing
✅ Speech-to-text
✅ Text-to-speech
✅ Assistant management
❌ Does NOT provision phone numbers directly
❌ Does NOT send SMS directly

TWILIO:
✅ Phone number provisioning
✅ SMS sending and receiving
✅ Call routing infrastructure
✅ Webhooks for SMS
❌ Does NOT have AI capabilities
```

**They work TOGETHER:**
```
Twilio = Infrastructure (phone numbers, SMS, telephony)
Vapi = Intelligence (AI brain on top of Twilio)
```

---

## 🔄 **Correct Architecture**

```
┌─────────────────────────────────────────────┐
│         YOUR APPLICATION (Next.js)          │
│                                             │
│  ┌────────────┐         ┌────────────┐    │
│  │  Frontend  │────────▶│  Backend   │    │
│  │ Dashboard  │         │  API       │    │
│  └────────────┘         └─────┬──────┘    │
│                               │            │
└───────────────────────────────┼────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
        │   TWILIO    │  │  VAPI.AI   │  │  CAL.COM │
        │             │  │            │  │          │
        │ • Phone #s  │  │ • AI Brain │  │ • Calendar│
        │ • SMS       │◄─┤ • Calls    │  │          │
        │ • Webhooks  │  │ • Voice    │  │          │
        └─────────────┘  └────────────┘  └──────────┘

FLOW:
1. Patient calls Twilio number
2. Twilio routes to Vapi assistant
3. Vapi AI handles conversation
4. Vapi calls YOUR API (book appointment)
5. YOUR API sends SMS via Twilio
6. Patient receives confirmation
```

---

## 🛠️ **Complete Setup Guide**

### **Step 1: Create Twilio Account**

1. Go to: https://www.twilio.com/try-twilio
2. Sign up (they give $15 free credit)
3. Verify your account
4. Go to Console: https://console.twilio.com

### **Step 2: Get Twilio Credentials**

```bash
# From Twilio Console Dashboard
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# You'll need these for API calls
```

### **Step 3: Buy a Twilio Phone Number**

```javascript
// lib/twilio.js

import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function searchAvailableNumbers(areaCode, country = 'US') {
  const numbers = await twilioClient.availablePhoneNumbers(country)
    .local
    .list({
      areaCode: areaCode,
      smsEnabled: true,
      voiceEnabled: true,
      limit: 10
    });
  
  return numbers.map(num => ({
    phoneNumber: num.phoneNumber,
    friendlyName: num.friendlyName,
    locality: num.locality,
    region: num.region
  }));
}

export async function purchasePhoneNumber(phoneNumber) {
  const purchasedNumber = await twilioClient.incomingPhoneNumbers
    .create({
      phoneNumber: phoneNumber,
      voiceUrl: '', // We'll set this after creating Vapi assistant
      smsUrl: `${process.env.API_URL}/api/webhooks/twilio/sms`,
      smsMethod: 'POST'
    });
  
  return {
    sid: purchasedNumber.sid,
    phoneNumber: purchasedNumber.phoneNumber,
    friendlyName: purchasedNumber.friendlyName
  };
}
```

### **Step 4: Connect Twilio Number to Vapi**

This is the KEY integration step:

```javascript
// lib/vapi.js

import Vapi from '@vapi-ai/server-sdk';

const vapi = new Vapi({
  token: process.env.VAPI_API_KEY
});

export async function importTwilioNumberToVapi(twilioPhoneNumber, twilioAccountSid, twilioAuthToken) {
  // Import Twilio number into Vapi
  const vapiPhone = await vapi.phoneNumbers.create({
    provider: 'twilio',
    twilioAccountSid: twilioAccountSid,
    twilioAuthToken: twilioAuthToken,
    twilioPhoneNumber: twilioPhoneNumber,
    name: 'Practice Main Line'
  });
  
  return vapiPhone;
}

export async function createAssistantAndLinkToNumber(practice, vapiPhoneId) {
  // Create assistant
  const assistant = await vapi.assistants.create({
    name: `${practice.name} AI Receptionist`,
    firstMessage: `Thank you for calling ${practice.name}, this is Emma, how can I help you today?`,
    
    model: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{
        role: 'system',
        content: generateSystemPrompt(practice)
      }]
    },
    
    voice: {
      provider: 'elevenlabs',
      voiceId: '21m00Tcm4TlvDq8ikWAM'
    },
    
    tools: [
      {
        type: 'function',
        name: 'check_availability',
        description: 'Check appointment availability',
        parameters: {
          type: 'object',
          properties: {
            date: { type: 'string' },
            appointmentType: { type: 'string' }
          }
        },
        server: {
          url: `${process.env.API_URL}/api/vapi/check-availability`,
          method: 'POST'
        }
      },
      {
        type: 'function',
        name: 'book_appointment',
        description: 'Book an appointment',
        parameters: {
          type: 'object',
          properties: {
            patientName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            dateTime: { type: 'string' },
            appointmentType: { type: 'string' },
            insurance: { type: 'string' }
          },
          required: ['patientName', 'phone', 'dateTime', 'appointmentType']
        },
        server: {
          url: `${process.env.API_URL}/api/vapi/book-appointment`,
          method: 'POST'
        }
      }
    ],
    
    serverUrl: `${process.env.API_URL}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
  });
  
  // Link assistant to phone number
  await vapi.phoneNumbers.update(vapiPhoneId, {
    assistantId: assistant.id
  });
  
  return assistant;
}
```

### **Step 5: Complete Provisioning Flow**

```javascript
// app/api/phone-numbers/provision/route.js

import { searchAvailableNumbers, purchasePhoneNumber, twilioClient } from '@/lib/twilio';
import { importTwilioNumberToVapi, createAssistantAndLinkToNumber } from '@/lib/vapi';
import { db } from '@/lib/db';

export async function POST(req) {
  const { practiceId, selectedPhoneNumber } = await req.json();
  
  try {
    const practice = await db.practices.findById(practiceId);
    
    // Step 1: Purchase number from Twilio
    const twilioNumber = await purchasePhoneNumber(selectedPhoneNumber);
    
    // Step 2: Import Twilio number into Vapi
    const vapiPhone = await importTwilioNumberToVapi(
      twilioNumber.phoneNumber,
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    
    // Step 3: Create Vapi assistant and link to number
    const assistant = await createAssistantAndLinkToNumber(
      practice,
      vapiPhone.id
    );
    
    // Step 4: Update Twilio number with Vapi voice URL
    // Vapi provides a webhook URL for voice calls
    await twilioClient.incomingPhoneNumbers(twilioNumber.sid)
      .update({
        voiceUrl: vapiPhone.voiceUrl, // Vapi provides this
        voiceMethod: 'POST',
        smsUrl: `${process.env.API_URL}/api/webhooks/twilio/sms`,
        smsMethod: 'POST'
      });
    
    // Step 5: Save to database
    const dbPhoneNumber = await db.phone_numbers.create({
      practice_id: practiceId,
      phone_number: twilioNumber.phoneNumber,
      twilio_sid: twilioNumber.sid,
      vapi_phone_number_id: vapiPhone.id,
      vapi_assistant_id: assistant.id,
      is_primary: true,
      status: 'active'
    });
    
    return Response.json({
      success: true,
      phoneNumber: dbPhoneNumber
    });
    
  } catch (error) {
    console.error('Error provisioning number:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

## 💬 **SMS Implementation (via Twilio)**

### **Sending SMS Confirmations:**

```javascript
// lib/sms.js

import twilio from 'twilio';

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS({ from, to, body }) {
  try {
    const message = await twilioClient.messages.create({
      from: from,  // Your Twilio/Vapi phone number
      to: to,      // Patient's phone
      body: body
    });
    
    return {
      success: true,
      messageId: message.sid,
      status: message.status
    };
    
  } catch (error) {
    console.error('SMS send error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function sendAppointmentConfirmation(appointment) {
  const patient = await db.patients.findById(appointment.patient_id);
  const practice = await db.practices.findById(appointment.practice_id);
  const appointmentType = await db.appointment_types.findById(
    appointment.appointment_type_id
  );
  const phoneNumber = await db.phone_numbers.findPrimary(practice.id);
  
  const message = `Hi ${patient.first_name}! Your ${appointmentType.name} at ${practice.name} is confirmed for ${formatDate(appointment.appointment_date)} at ${formatTime(appointment.start_time)}. Reply CONFIRM or CANCEL.`;
  
  const result = await sendSMS({
    from: phoneNumber.phone_number,
    to: patient.phone,
    body: message
  });
  
  // Log to database
  await db.messages.create({
    practice_id: practice.id,
    patient_id: patient.id,
    message_type: 'sms',
    direction: 'outbound',
    to_address: patient.phone,
    from_address: phoneNumber.phone_number,
    body: message,
    provider: 'twilio',
    provider_message_id: result.messageId,
    status: result.success ? 'sent' : 'failed',
    related_type: 'appointment',
    related_id: appointment.id,
    sent_at: result.success ? new Date() : null,
    error_message: result.error || null
  });
  
  return result;
}
```

### **Receiving SMS (Patient Replies):**

```javascript
// app/api/webhooks/twilio/sms/route.js

import twilio from 'twilio';
import { db } from '@/lib/db';
import { sendSMS } from '@/lib/sms';

export async function POST(req) {
  // Verify webhook is from Twilio
  const signature = req.headers.get('x-twilio-signature');
  const url = `${process.env.API_URL}/api/webhooks/twilio/sms`;
  const params = await req.formData();
  
  const isValid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    Object.fromEntries(params)
  );
  
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 403 });
  }
  
  const fromNumber = params.get('From');
  const toNumber = params.get('To');
  const body = params.get('Body');
  
  // Find practice by phone number
  const phoneNumber = await db.phone_numbers.findByNumber(toNumber);
  if (!phoneNumber) {
    return Response.json({ error: 'Unknown number' }, { status: 404 });
  }
  
  const practice = await db.practices.findById(phoneNumber.practice_id);
  const patient = await db.patients.findByPhone(practice.id, fromNumber);
  
  // Log incoming message
  await db.messages.create({
    practice_id: practice.id,
    patient_id: patient?.id,
    message_type: 'sms',
    direction: 'inbound',
    from_address: fromNumber,
    to_address: toNumber,
    body: body,
    provider: 'twilio',
    status: 'received',
    received_at: new Date()
  });
  
  // Handle common responses
  const normalizedBody = body.trim().toUpperCase();
  
  if (normalizedBody.includes('CONFIRM')) {
    await handleConfirmation(patient, practice, phoneNumber);
  } 
  else if (normalizedBody.includes('CANCEL')) {
    await handleCancellation(patient, practice, phoneNumber);
  }
  
  return Response.json({ success: true });
}

async function handleConfirmation(patient, practice, phoneNumber) {
  const appointment = await db.appointments.findNext(patient.id);
  
  await db.appointments.update(appointment.id, {
    confirmation_status: 'confirmed'
  });
  
  await sendSMS({
    from: phoneNumber.phone_number,
    to: patient.phone,
    body: `Perfect! Your appointment is confirmed. See you then! 😊`
  });
}

async function handleCancellation(patient, practice, phoneNumber) {
  const appointment = await db.appointments.findNext(patient.id);
  
  await db.appointments.update(appointment.id, {
    status: 'cancelled',
    cancelled_at: new Date(),
    cancellation_reason: 'Patient cancelled via SMS'
  });
  
  // Remove from calendar
  await calendarService.deleteEvent(appointment.calendar_event_id);
  
  // Create lead for follow-up
  await db.leads.create({
    practice_id: practice.id,
    patient_id: patient.id,
    status: 'new',
    notes: 'Cancelled via SMS - needs rescheduling'
  });
  
  await sendSMS({
    from: phoneNumber.phone_number,
    to: patient.phone,
    body: `Your appointment has been cancelled. We'll call you soon to reschedule, or call us at ${phoneNumber.phone_number}.`
  });
  
  // Notify practice
  await notifyPracticeStaff(practice.id, {
    type: 'appointment_cancelled',
    message: `${patient.first_name} ${patient.last_name} cancelled via SMS`
  });
}
```

---

## 💰 **Pricing Breakdown**

### **Twilio Costs:**
```
Phone Number: $1.15/month per number
Incoming Calls: $0.0085/minute
Outgoing Calls: $0.013/minute
SMS (Outbound): $0.0079 per message
SMS (Inbound): $0.0079 per message
```

### **Vapi Costs:**
```
Calls: ~$0.05-0.15/minute
(Includes STT, LLM, TTS)
```

### **Total Cost Per Customer (Monthly):**
```
Twilio phone number: $1.15
Average calls: 200/month × 3 min × $0.0085 = $5.10
Vapi AI costs: 200 calls × 3 min × $0.10 = $60
SMS confirmations: 50 × $0.0079 = $0.40
SMS reminders: 100 × $0.0079 = $0.79

Total: ~$67.44/month per customer

Your revenue: $497/month
Your margin: $429.56/month (86%)
```

**Still EXCELLENT margins!**

---

## 🔧 **Updated Database Schema**

```sql
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS twilio_sid VARCHAR(255);
ALTER TABLE phone_numbers ADD COLUMN IF NOT EXISTS twilio_account_sid VARCHAR(255);

-- Now your phone_numbers table has:
-- - phone_number (the actual number)
-- - twilio_sid (Twilio's ID for the number)
-- - vapi_phone_number_id (Vapi's ID for the imported number)
-- - vapi_assistant_id (The AI assistant assigned to it)
```

---

## 📋 **Complete User Flow (Updated)**

### **Dentist Onboarding:**

```
1. Sign up & pay ($497/month via Lemon Squeezy)
   ↓
2. Onboarding: Practice details, office hours, calendar
   ↓
3. Phone Number Selection Screen:
   "Choose your AI receptionist's phone number"
   
   Enter area code: [512] [Search]
   
   Available numbers:
   ⚪ (512) 555-0199 - Austin, TX
   ⚫ (512) 555-0200 - Austin, TX ← Selected
   ⚪ (512) 555-0201 - Austin, TX
   
   [Get This Number]
   ↓
4. Backend Magic (invisible to dentist):
   a. Purchase from Twilio API
   b. Import into Vapi
   c. Create Vapi assistant
   d. Link assistant to number
   e. Configure webhooks
   ✅ Done in 5-10 seconds
   ↓
5. "✅ Your number is ready: (512) 555-0200"
   [Make a Test Call]
   ↓
6. Dentist tests, it works!
   ↓
7. Go live! 🚀
```

---

## 🎯 **Your Implementation Checklist**

### **Week 1: Twilio Setup**
- [ ] Create Twilio account
- [ ] Get TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
- [ ] Install twilio npm package: `npm install twilio`
- [ ] Test buying a number via Twilio API
- [ ] Test sending SMS via Twilio
- [ ] Set up Twilio webhook endpoint

### **Week 2: Vapi Integration**
- [ ] Get VAPI_API_KEY from dashboard
- [ ] Install Vapi SDK: `npm install @vapi-ai/server-sdk`
- [ ] Test importing Twilio number to Vapi
- [ ] Create test assistant
- [ ] Test inbound call flow
- [ ] Test function calling (check_availability)

### **Week 3: Connect Everything**
- [ ] Build phone number provisioning flow
- [ ] Integrate Twilio + Vapi in one API call
- [ ] Test end-to-end: purchase → import → create assistant
- [ ] Build SMS confirmation logic
- [ ] Test SMS sending after appointment booking
- [ ] Test SMS receiving (patient replies)

### **Week 4: Polish**
- [ ] Add error handling
- [ ] Add retry logic for failed SMS
- [ ] Build reminder cron job
- [ ] Test complete user flow
- [ ] Deploy to production

---

## ✅ **Summary**

**The CORRECT architecture is:**

```
TWILIO: Phone numbers + SMS infrastructure
   ↓
VAPI: AI voice intelligence
   ↓
YOUR APP: Business logic, booking, database
```

**You need BOTH services, but it's simple:**

1. Buy number from Twilio (one API call)
2. Import to Vapi (one API call)
3. Create assistant (one API call)
4. Send SMS via Twilio (one API call per message)

**Total setup time per practice: ~10 seconds**

**Dentist sees: Pick a number → Done**

**You handle: All the integration complexity**

This is the industry-standard way to build AI voice apps. Vapi is the "brain", Twilio is the "mouth/ears". Together they're powerful! 🚀
