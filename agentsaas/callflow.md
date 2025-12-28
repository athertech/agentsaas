# DentalAnswer AI - Vapi Integration Strategy & User Flow

## 🎯 **TL;DR - Your Answer**

**YES! Use Vapi for EVERYTHING - phone numbers AND SMS. No Twilio needed.**

Here's the flow:
1. Dentist subscribes → Payment processed
2. Your backend provisions phone number from Vapi automatically
3. Same Vapi number handles calls AND sends SMS
4. Dentist never sees Vapi, never configures anything
5. It just works ✨

---

## 📱 **Vapi Can Do BOTH Calls + SMS**

### **What Vapi Provides:**

```
✅ Phone number provisioning (buy numbers via API)
✅ Inbound calls (AI answers)
✅ Outbound calls (campaigns, reminders)
✅ SMS sending (confirmations, reminders)
✅ SMS receiving (patient replies)
✅ Two-way SMS conversations
```

**You DON'T need separate Twilio account for SMS!**

Vapi uses Twilio under the hood, but you never touch it directly.

---

## 🔄 **The CORRECT User Flow**

### **Dentist Perspective (What They See):**

```
STEP 1: Sign Up
  → Enter email, password, practice name
  → Email verification
  
STEP 2: Choose Plan & Pay
  → Select Professional Plan ($497/month)
  → Enter payment info (Lemon Squeezy/Paddle)
  → Payment processed ✅
  
STEP 3: Onboarding (Auto-Starts After Payment)
  
  Screen 1: "Welcome! Let's get you set up (5 minutes)"
  
  Screen 2: Practice Details
    → Address, insurance accepted, etc.
    
  Screen 3: Office Hours
    → Set schedule (Mon-Fri 9-5)
    
  Screen 4: Connect Calendar
    → Click "Connect Cal.com"
    → OAuth flow
    → ✅ Connected
    
  Screen 5: Choose Your Phone Number
    → "Select your AI receptionist's phone number"
    → Shows available numbers in their area code:
      ⚪ (512) 555-0199
      ⚫ (512) 555-0200 ← Selected
      ⚪ (512) 555-0201
    → Click "Get This Number"
    → ✅ Number provisioned (happens in 2 seconds)
    
  Screen 6: Customize AI Voice
    → Select voice: Emma (Friendly), Sarah (Professional)
    → Edit greeting: "Thank you for calling..."
    → Click "Save"
    
  Screen 7: Test It!
    → "Call your new number: (512) 555-0200"
    → [Call Now from Dashboard] button
    → They test it, it works!
    → Click "I'm Ready to Go Live"
    
✅ DONE! Dashboard loads, they're live.
```

**Key Point:** Dentist NEVER sees "Vapi", "Twilio", "API keys", or any technical stuff.

They just:
1. Pay
2. Pick a number
3. Done

---

## 🛠️ **Backend Flow (What Actually Happens)**

### **When Dentist Subscribes:**

```javascript
// POST /api/billing/subscribe

async function handleSubscription(practiceId, plan, paymentMethodId) {
  
  // 1. Create subscription in Lemon Squeezy
  const subscription = await createLemonSqueezySubscription({
    practiceId,
    plan,
    paymentMethodId
  });
  
  // 2. Update practice status
  await db.practices.update(practiceId, {
    subscription_status: 'active',
    subscription_plan: plan
  });
  
  // 3. Redirect to onboarding
  return { redirect: '/dashboard/onboarding' };
}
```

### **When They Choose Phone Number:**

```javascript
// POST /api/phone-numbers/provision

async function provisionPhoneNumber(practiceId, selectedNumber) {
  
  // 1. Purchase number from Vapi
  const vapiNumber = await vapi.phoneNumbers.buy({
    phoneNumber: selectedNumber,
    name: `${practice.name} - Main Line`
  });
  
  // 2. Create assistant in Vapi
  const assistant = await vapi.assistants.create({
    name: `${practice.name} - AI Receptionist`,
    firstMessage: practice.greeting || 
      `Thank you for calling ${practice.name}, this is Emma, how can I help you today?`,
    model: {
      provider: 'openai',
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt(practice)
        }
      ]
    },
    voice: {
      provider: 'elevenlabs',
      voiceId: practice.ai_voice_id || 'emma'
    },
    // Function calling for booking
    functions: [
      {
        name: 'check_availability',
        url: `${process.env.API_URL}/api/vapi/check-availability`,
        method: 'POST'
      },
      {
        name: 'book_appointment',
        url: `${process.env.API_URL}/api/vapi/book-appointment`,
        method: 'POST'
      }
    ],
    // Webhook for call events
    serverUrl: `${process.env.API_URL}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
  });
  
  // 3. Link assistant to phone number
  await vapi.phoneNumbers.update(vapiNumber.id, {
    assistantId: assistant.id
  });
  
  // 4. Store in your database
  const phoneNumber = await db.phone_numbers.create({
    practice_id: practiceId,
    phone_number: selectedNumber,
    vapi_phone_number_id: vapiNumber.id,
    vapi_assistant_id: assistant.id,
    is_primary: true,
    status: 'active'
  });
  
  return phoneNumber;
}
```

**Dentist sees:** "✅ Your number is ready: (512) 555-0200"

**What happened:** You provisioned Vapi number + created assistant + linked them together

---

## 💬 **SMS Sending (Confirmations, Reminders)**

### **After Appointment Booked:**

```javascript
// After appointment is booked via AI call

async function sendAppointmentConfirmation(appointment) {
  const patient = await db.patients.findById(appointment.patient_id);
  const practice = await db.practices.findById(appointment.practice_id);
  const phoneNumber = await db.phone_numbers.findPrimary(practice.id);
  
  // Send SMS via Vapi (using the same phone number!)
  const message = await vapi.phoneNumbers.sendSms({
    phoneNumberId: phoneNumber.vapi_phone_number_id,
    to: patient.phone,
    message: `Hi ${patient.first_name}, your appointment at ${practice.name} is confirmed for ${formatDate(appointment.date)} at ${formatTime(appointment.time)}. Reply CONFIRM or CANCEL.`
  });
  
  // Log it
  await db.messages.create({
    practice_id: practice.id,
    patient_id: patient.id,
    message_type: 'sms',
    direction: 'outbound',
    to_address: patient.phone,
    from_address: phoneNumber.phone_number,
    body: message.message,
    provider: 'vapi',
    provider_message_id: message.id,
    status: 'sent'
  });
}
```

**Key Points:**
- ✅ Same phone number that receives calls also sends SMS
- ✅ Patient sees texts coming from practice's main number
- ✅ Consistent experience
- ✅ No confusion

---

## 📥 **SMS Receiving (Patient Replies)**

### **When Patient Texts Back:**

```javascript
// Vapi webhook: POST /api/webhooks/vapi

async function handleVapiWebhook(req, res) {
  const event = req.body;
  
  // SMS received
  if (event.type === 'sms-message-received') {
    const { phoneNumberId, from, message } = event.data;
    
    // Find which practice this number belongs to
    const phoneNumber = await db.phone_numbers.findByVapiId(phoneNumberId);
    const practice = await db.practices.findById(phoneNumber.practice_id);
    
    // Find patient
    const patient = await db.patients.findByPhone(practice.id, from);
    
    // Log the message
    await db.messages.create({
      practice_id: practice.id,
      patient_id: patient?.id,
      message_type: 'sms',
      direction: 'inbound',
      from_address: from,
      to_address: phoneNumber.phone_number,
      body: message,
      provider: 'vapi',
      status: 'received'
    });
    
    // Handle common replies
    const normalizedMessage = message.trim().toUpperCase();
    
    if (normalizedMessage.includes('CONFIRM')) {
      await handleConfirmation(patient, practice);
    } 
    else if (normalizedMessage.includes('CANCEL')) {
      await handleCancellation(patient, practice);
    }
    
    res.sendStatus(200);
  }
}

async function handleConfirmation(patient, practice) {
  // Find their next appointment
  const appointment = await db.appointments.findNext(patient.id);
  
  // Update status
  await db.appointments.update(appointment.id, {
    confirmation_status: 'confirmed'
  });
  
  // Send acknowledgment
  await vapi.phoneNumbers.sendSms({
    phoneNumberId: practice.phone_number.vapi_phone_number_id,
    to: patient.phone,
    message: `Perfect! Your appointment is confirmed. See you then! 😊`
  });
}

async function handleCancellation(patient, practice) {
  const appointment = await db.appointments.findNext(patient.id);
  
  // Cancel appointment
  await db.appointments.update(appointment.id, {
    status: 'cancelled',
    cancelled_at: new Date()
  });
  
  // Remove from calendar
  await calendar.deleteEvent(appointment.calendar_event_id);
  
  // Create lead for follow-up
  await db.leads.create({
    practice_id: practice.id,
    patient_id: patient.id,
    status: 'new',
    notes: 'Cancelled via SMS - needs rescheduling'
  });
  
  // Send acknowledgment
  await vapi.phoneNumbers.sendSms({
    phoneNumberId: practice.phone_number.vapi_phone_number_id,
    to: patient.phone,
    message: `Your appointment has been cancelled. We'll call you soon to reschedule, or call us at ${practice.phone_number.phone_number}.`
  });
  
  // Notify practice
  await notifyPracticeStaff(practice.id, {
    type: 'appointment_cancelled',
    message: `${patient.first_name} ${patient.last_name} cancelled via SMS`
  });
}
```

---

## 🎯 **Architecture Overview**

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
                                │ API Calls
                                │
                    ┌───────────▼───────────┐
                    │      VAPI.AI          │
                    │                       │
                    │  ┌─────────────────┐ │
                    │  │ Phone Numbers   │ │
                    │  │ • Buy numbers   │ │
                    │  │ • Send SMS      │ │
                    │  │ • Receive SMS   │ │
                    │  └─────────────────┘ │
                    │                       │
                    │  ┌─────────────────┐ │
                    │  │ Assistants      │ │
                    │  │ • AI logic      │ │
                    │  │ • Voice config  │ │
                    │  │ • Functions     │ │
                    │  └─────────────────┘ │
                    │                       │
                    │  ┌─────────────────┐ │
                    │  │ Calls           │ │
                    │  │ • Inbound       │ │
                    │  │ • Outbound      │ │
                    │  │ • Transcripts   │ │
                    │  └─────────────────┘ │
                    └───────────┬───────────┘
                                │
                                │ Webhooks
                                │
                    ┌───────────▼───────────┐
                    │  YOUR WEBHOOK         │
                    │  /api/webhooks/vapi   │
                    │                       │
                    │  • call.started       │
                    │  • call.ended         │
                    │  • sms.received       │
                    │  • function.called    │
                    └───────────────────────┘
```

**ONE SERVICE = Everything**

---

## 💰 **Vapi Pricing (What It Costs)**

### **Phone Numbers:**
```
Purchase: $2/month per number
Usage: Included in call costs
SMS: $0.0075 per message (outbound)
```

### **Calls:**
```
Inbound calls: ~$0.05-0.15/minute
  • Speech-to-text: $0.006/min
  • LLM (GPT-4): $0.04-0.10/min
  • Text-to-speech: $0.015/min
  
Average 3-minute call: $0.15-0.45
```

### **Your Costs Per Customer (Monthly):**
```
Phone number: $2
Average calls: 200/month
Average duration: 3 minutes
Call costs: 200 × 3 × $0.15 = $90
SMS (confirmations): 50 × $0.0075 = $0.38
SMS (reminders): 100 × $0.0075 = $0.75

Total Vapi cost: ~$93/month per customer

Your revenue: $497/month
Your margin: $404/month (81%)
```

**This is GREAT margin!**

---

## 🔧 **Implementation Code**

### **Vapi SDK Setup:**

```javascript
// lib/vapi.js

import Vapi from '@vapi-ai/server-sdk';

export const vapi = new Vapi({
  token: process.env.VAPI_API_KEY
});

// Helper functions

export async function searchAvailableNumbers(areaCode) {
  const numbers = await vapi.phoneNumbers.list({
    areaCode: areaCode
  });
  
  return numbers.data.filter(n => n.available);
}

export async function provisionNumber(phoneNumber, practiceName) {
  return await vapi.phoneNumbers.buy({
    phoneNumber: phoneNumber,
    name: `${practiceName} - Main Line`,
    assistantId: null // We'll link it after creating assistant
  });
}

export async function createAssistant(practice) {
  return await vapi.assistants.create({
    name: `${practice.name} - AI Receptionist`,
    
    // First message
    firstMessage: practice.ai_greeting_message || 
      `Thank you for calling ${practice.name}, this is Emma, how can I help you today?`,
    
    // AI Model
    model: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      messages: [
        {
          role: 'system',
          content: generateSystemPrompt(practice)
        }
      ]
    },
    
    // Voice
    voice: {
      provider: 'elevenlabs',
      voiceId: practice.ai_voice_id || '21m00Tcm4TlvDq8ikWAM' // Rachel voice
    },
    
    // Function calling
    functions: [
      {
        name: 'check_availability',
        description: 'Check available appointment slots for a given date and time preference',
        parameters: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Preferred date in YYYY-MM-DD format'
            },
            appointmentType: {
              type: 'string',
              description: 'Type of appointment (cleaning, exam, emergency, etc.)'
            },
            timePreference: {
              type: 'string',
              enum: ['morning', 'afternoon', 'evening'],
              description: 'Preferred time of day'
            }
          }
        },
        url: `${process.env.API_URL}/api/vapi/check-availability`,
        method: 'POST'
      },
      {
        name: 'book_appointment',
        description: 'Book an appointment for a patient',
        parameters: {
          type: 'object',
          properties: {
            patientName: { type: 'string' },
            phone: { type: 'string' },
            email: { type: 'string' },
            appointmentType: { type: 'string' },
            dateTime: { type: 'string' },
            insurance: { type: 'string' },
            reasonForVisit: { type: 'string' }
          },
          required: ['patientName', 'phone', 'appointmentType', 'dateTime']
        },
        url: `${process.env.API_URL}/api/vapi/book-appointment`,
        method: 'POST'
      }
    ],
    
    // Webhook for events
    serverUrl: `${process.env.API_URL}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET,
    
    // End call phrases
    endCallPhrases: ['goodbye', 'bye', 'thank you goodbye'],
    
    // Transfer if needed
    forwardingPhoneNumber: practice.phone
  });
}

export async function sendSMS(phoneNumberId, to, message) {
  return await vapi.phoneNumbers.sendMessage({
    phoneNumberId: phoneNumberId,
    message: {
      to: to,
      content: message
    }
  });
}

export async function linkAssistantToNumber(phoneNumberId, assistantId) {
  return await vapi.phoneNumbers.update(phoneNumberId, {
    assistantId: assistantId
  });
}

function generateSystemPrompt(practice) {
  return `
You are Emma, the friendly AI receptionist for ${practice.name}, a dental practice in ${practice.city}, ${practice.state}.

Your role is to:
1. Answer calls professionally and warmly
2. Help patients book appointments
3. Answer common questions about the practice
4. Transfer complex issues to human staff

PRACTICE INFORMATION:
- Name: ${practice.name}
- Location: ${practice.address_line1}, ${practice.city}, ${practice.state}
- Insurance Accepted: ${practice.insurance_accepted.join(', ')}
- Services: ${practice.practice_types.join(', ')}

AVAILABLE APPOINTMENT TYPES:
${practice.appointment_types.map(apt => 
  `- ${apt.name} (${apt.duration_minutes} min)`
).join('\n')}

GUIDELINES:
- Always be warm, professional, and empathetic
- For bookings: collect name, phone, email, insurance, reason for visit
- Use check_availability() before suggesting times
- Use book_appointment() to confirm bookings
- For emergencies (severe pain, trauma), prioritize immediately
- For billing/prescriptions/complex medical questions, transfer to staff
- Always confirm all details before ending the call

Remember: You represent ${practice.name}. Be helpful and caring!
`;
}
```

---

### **API Routes:**

```javascript
// app/api/phone-numbers/provision/route.js

import { vapi } from '@/lib/vapi';
import { db } from '@/lib/db';

export async function POST(req) {
  const { practiceId, phoneNumber } = await req.json();
  
  try {
    const practice = await db.practices.findById(practiceId);
    
    // 1. Buy number from Vapi
    const vapiNumber = await vapi.provisionNumber(
      phoneNumber,
      practice.name
    );
    
    // 2. Create assistant
    const assistant = await vapi.createAssistant(practice);
    
    // 3. Link them
    await vapi.linkAssistantToNumber(
      vapiNumber.id,
      assistant.id
    );
    
    // 4. Save to database
    const dbPhoneNumber = await db.phone_numbers.create({
      practice_id: practiceId,
      phone_number: phoneNumber,
      vapi_phone_number_id: vapiNumber.id,
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

```javascript
// app/api/messages/send-sms/route.js

import { vapi } from '@/lib/vapi';
import { db } from '@/lib/db';

export async function POST(req) {
  const { practiceId, patientId, message } = await req.json();
  
  try {
    const practice = await db.practices.findById(practiceId);
    const patient = await db.patients.findById(patientId);
    const phoneNumber = await db.phone_numbers.findPrimary(practiceId);
    
    // Send via Vapi
    const sms = await vapi.sendSMS(
      phoneNumber.vapi_phone_number_id,
      patient.phone,
      message
    );
    
    // Log it
    await db.messages.create({
      practice_id: practiceId,
      patient_id: patientId,
      message_type: 'sms',
      direction: 'outbound',
      to_address: patient.phone,
      from_address: phoneNumber.phone_number,
      body: message,
      provider: 'vapi',
      provider_message_id: sms.id,
      status: 'sent',
      sent_at: new Date()
    });
    
    return Response.json({ success: true });
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
```

---

## ✅ **Summary: Your Exact Flow**

### **Dentist Journey:**
```
1. Sign up (email, password, practice name)
2. Pay $497/month (Lemon Squeezy)
3. Onboarding wizard:
   - Practice details
   - Office hours
   - Connect calendar
   - Pick phone number from list
   - Customize AI voice
   - Test call
4. ✅ Go live!
```

**Total time:** 10-15 minutes  
**Technical knowledge required:** ZERO  
**Vapi exposure:** ZERO (they never see it)

### **Your Backend:**
```
1. User signs up → Create user + practice
2. Payment succeeds → Activate subscription
3. User picks number → Provision via Vapi API
4. Auto-create assistant → Link to number
5. User goes live → Start receiving calls
6. Appointment booked → Send SMS via same number
7. Patient replies → Webhook handles it
```

**APIs you integrate:** Vapi only (for calls + SMS)  
**Twilio needed:** NO  
**Complexity:** Low  

---

## 🎯 **Final Answer to Your Question**

> "Should dentists connect Twilio and Vapi?"

**NO! Dentists do NOTHING. You handle everything.**

> "Can the Vapi number send messages?"

**YES! Same number for calls AND SMS.**

> "Do I need Twilio separately?"

**NO! Vapi handles it all.**

---

## 🚀 **Next Steps for You**

1. **Sign up for Vapi:** https://vapi.ai
2. **Get API key:** Dashboard → Settings → API Keys
3. **Test number provisioning:** Try buying a number via API
4. **Test SMS sending:** Send a test SMS via API
5. **Build the onboarding flow:** Let dentists pick numbers
6. **Done!**

**Stop overthinking. Vapi does everything you need. Use it exclusively.** 🎉
