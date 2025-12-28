I've done comprehensive research on Vapi's API. Let me compile everything you need to know:

# Complete Vapi API Guide for DentalAnswer AI

## 🔑 **How to Get Your Vapi API Key**

### **Step-by-Step:**

1. **Go to Vapi Dashboard**
   - Visit: https://dashboard.vapi.ai
   - Sign up or log in

2. **Navigate to API Keys**
   - Click your account menu (top right)
   - Select **"API Keys"**
   - Or go directly to: https://dashboard.vapi.ai/org/api-keys

3. **Copy Your Private Key**
   - Click the **"Copy"** icon next to "Private Key"
   - Store it securely (treat like a password!)
   - Add to your `.env` file:
   ```bash
   VAPI_API_KEY=your-private-key-here
   ```

4. **Important Notes:**
   - There are TWO types of keys: **Private** and **Public**
   - **Private Key:** Use for server-side API calls (creating assistants, phone numbers, etc.)
   - **Public Key:** Use for client-side (web calls, browser integrations)
   - For your use case (DentalAnswer AI), you only need the **Private Key**

---

## 🎯 **What You Can Do with Vapi API**

### **1. Phone Number Management**

#### **Buy/Provision Phone Numbers**
```javascript
// List available numbers
GET https://api.vapi.ai/phone-number

// Create (buy) a phone number
POST https://api.vapi.ai/phone-number
{
  "name": "Bright Smile Dental - Main Line",
  "assistantId": "assistant-id-here"
}

// Free US numbers (up to 10 per account)
// For international, you need to import from Twilio
```

**What you can do:**
- ✅ Buy US phone numbers (free, up to 10)
- ✅ Import international numbers from Twilio
- ✅ Assign assistants to phone numbers
- ✅ Enable SMS on phone numbers
- ✅ List all your phone numbers
- ✅ Update phone number settings
- ✅ Delete phone numbers

---

### **2. Assistant (AI Agent) Management**

#### **Create an Assistant**
```javascript
POST https://api.vapi.ai/assistant
{
  "name": "Bright Smile Dental Receptionist",
  "firstMessage": "Thank you for calling Bright Smile Dental, this is Emma, how can I help you today?",
  
  // AI Model Configuration
  "model": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7,
    "messages": [
      {
        "role": "system",
        "content": "You are Emma, a friendly dental receptionist..."
      }
    ]
  },
  
  // Voice Configuration
  "voice": {
    "provider": "elevenlabs",
    "voiceId": "21m00Tcm4TlvDq8ikWAM" // Rachel voice
  },
  
  // Custom Tools (Functions)
  "tools": [
    {
      "type": "function",
      "name": "check_availability",
      "description": "Check available appointment slots",
      "parameters": {
        "type": "object",
        "properties": {
          "date": { "type": "string" },
          "appointmentType": { "type": "string" }
        }
      },
      "server": {
        "url": "https://your-api.com/check-availability",
        "method": "POST"
      }
    }
  ],
  
  // Webhook for events
  "serverUrl": "https://your-api.com/webhooks/vapi",
  "serverUrlSecret": "your-secret-key"
}
```

**What you can do:**
- ✅ Create AI assistants
- ✅ Configure conversation behavior
- ✅ Add custom functions (tools)
- ✅ Set voice and personality
- ✅ Define webhooks for events
- ✅ Update assistants
- ✅ Delete assistants
- ✅ List all assistants

---

### **3. Making Calls**

#### **Inbound Calls (Automatic)**
When someone calls your Vapi phone number, it automatically triggers the assigned assistant.

**No API call needed** - just assign assistant to phone number!

#### **Outbound Calls**
```javascript
POST https://api.vapi.ai/call
{
  "phoneNumberId": "your-vapi-phone-id",
  "customer": {
    "number": "+15125557890"  // Who to call
  },
  "assistantId": "your-assistant-id",
  
  // Optional: Schedule for later
  "schedulePlan": {
    "earliestAt": "2025-12-20T14:00:00Z"
  }
}
```

**What you can do:**
- ✅ Make outbound calls
- ✅ Schedule calls for later
- ✅ Batch calls (campaigns)
- ✅ Pass custom data to calls
- ✅ Get call status
- ✅ End calls programmatically

---

### **4. SMS Capabilities** ⭐ (This is what you need!)

#### **Send SMS**
```javascript
// Via Default Tool in Assistant
"tools": [
  {
    "type": "sms",
    "name": "send_text"
  }
]

// Assistant can now call this during conversation
// "Send them a text with the appointment details"
```

**Or send directly via API:**
```javascript
// Note: Actual SMS sending happens through your assistant's tools
// Or via Twilio integration that Vapi manages

POST /phone-number/{id}/message
{
  "to": "+15125557890",
  "content": "Your appointment at Bright Smile Dental is confirmed for Dec 18 at 2 PM"
}
```

#### **Receive SMS (Inbound)**
```javascript
// Enable SMS on phone number
PATCH /phone-number/{id}
{
  "smsEnabled": true,
  "assistantId": "your-assistant-id"
}

// When patient texts your number:
// 1. Vapi creates a chat session
// 2. Assistant responds via text
// 3. Two-way SMS conversation works automatically
```

**SMS Features:**
- ✅ Send SMS messages
- ✅ Receive SMS messages
- ✅ Two-way SMS conversations
- ✅ SMS handled by same assistant as calls
- ✅ Same phone number for calls + SMS
- ❌ US numbers only (for now)
- ❌ Requires Twilio account linked

---

### **5. Custom Tools (Function Calling)**

This is **CRITICAL** for your appointment booking system!

```javascript
{
  "tools": [
    {
      "type": "function",
      "name": "check_availability",
      "description": "Check available appointment slots for a date",
      "parameters": {
        "type": "object",
        "properties": {
          "date": {
            "type": "string",
            "description": "Date in YYYY-MM-DD format"
          },
          "appointmentType": {
            "type": "string",
            "description": "Type of appointment"
          },
          "timePreference": {
            "type": "string",
            "enum": ["morning", "afternoon", "evening"]
          }
        },
        "required": ["date", "appointmentType"]
      },
      "server": {
        "url": "https://api.dentalanswer.ai/vapi/check-availability",
        "method": "POST",
        "timeout": 10
      },
      "messages": [
        {
          "type": "request-start",
          "content": "Let me check our availability for you..."
        },
        {
          "type": "request-complete",
          "content": "I found some available times."
        }
      ]
    },
    {
      "type": "function",
      "name": "book_appointment",
      "description": "Book an appointment for a patient",
      "parameters": {
        "type": "object",
        "properties": {
          "patientName": { "type": "string" },
          "phone": { "type": "string" },
          "email": { "type": "string" },
          "dateTime": { "type": "string" },
          "appointmentType": { "type": "string" },
          "insurance": { "type": "string" }
        },
        "required": ["patientName", "phone", "dateTime", "appointmentType"]
      },
      "server": {
        "url": "https://api.dentalanswer.ai/vapi/book-appointment",
        "method": "POST"
      }
    }
  ]
}
```

**How Tools Work:**

1. **AI decides when to call your tool** (based on conversation)
2. **Vapi sends HTTP request to your URL:**
   ```json
   {
     "message": {
       "type": "tool-calls",
       "toolCallList": [
         {
           "id": "call_abc123",
           "type": "function",
           "function": {
             "name": "check_availability",
             "arguments": {
               "date": "2025-12-18",
               "appointmentType": "cleaning",
               "timePreference": "afternoon"
             }
           }
         }
       ]
     }
   }
   ```

3. **Your server processes and responds:**
   ```json
   {
     "results": [
       {
         "toolCallId": "call_abc123",
         "result": {
           "success": true,
           "availableSlots": [
             {
               "dateTime": "2025-12-18T14:00:00Z",
               "displayTime": "Wednesday, Dec 18 at 2:00 PM"
             },
             {
               "dateTime": "2025-12-18T15:00:00Z",
               "displayTime": "Wednesday, Dec 18 at 3:00 PM"
             }
           ]
         }
       }
     ]
   }
   ```

4. **AI uses your response in conversation:**
   > "I have a few times available. How about Wednesday, December 18th at 2:00 PM?"

---

### **6. Webhooks (Real-Time Events)**

Configure webhook URL in assistant to receive events:

```javascript
{
  "serverUrl": "https://api.dentalanswer.ai/webhooks/vapi",
  "serverUrlSecret": "your-webhook-secret"
}
```

**Events You'll Receive:**

#### **call.started**
```json
{
  "type": "call.started",
  "call": {
    "id": "call-abc123",
    "phoneNumberId": "phone-123",
    "customerId": "+15125557890",
    "status": "ringing",
    "startedAt": "2025-12-15T14:30:00Z"
  }
}
```

#### **tool-calls** (When AI calls your function)
```json
{
  "type": "tool-calls",
  "toolCallList": [
    {
      "id": "call_xyz",
      "function": {
        "name": "book_appointment",
        "arguments": { ... }
      }
    }
  ]
}
```

#### **call.ended**
```json
{
  "type": "call.ended",
  "call": {
    "id": "call-abc123",
    "endedAt": "2025-12-15T14:35:00Z",
    "duration": 300,
    "recordingUrl": "https://...",
    "transcript": "Full conversation text...",
    "summary": "Patient booked a cleaning appointment"
  }
}
```

#### **sms-message-received** (When patient texts back)
```json
{
  "type": "sms-message-received",
  "phoneNumberId": "phone-123",
  "from": "+15125557890",
  "message": "CONFIRM"
}
```

**All Events:**
- ✅ `call.started`
- ✅ `call.ended`
- ✅ `tool-calls`
- ✅ `transcript` (real-time)
- ✅ `sms-message-received`
- ✅ `hang`
- ✅ `speech-update`
- ✅ `status-update`
- ✅ `end-of-call-report`

---

### **7. Default Tools (Built-in)**

Vapi provides these tools out-of-the-box:

#### **Transfer Call**
```javascript
{
  "type": "transferCall",
  "destinations": [
    {
      "type": "number",
      "number": "+15125550123",
      "message": "Transferring you to our staff..."
    }
  ]
}
```

#### **End Call**
```javascript
{
  "type": "endCall"
}
```

#### **Send SMS**
```javascript
{
  "type": "sms"
}
```

#### **DTMF (Dial Keypad)**
```javascript
{
  "type": "dtmf"  // For IVR navigation
}
```

---

## 📋 **Complete API Endpoints Reference**

### **Assistants**
```
POST   /assistant          Create assistant
GET    /assistant          List assistants
GET    /assistant/:id      Get assistant
PATCH  /assistant/:id      Update assistant
DELETE /assistant/:id      Delete assistant
```

### **Phone Numbers**
```
POST   /phone-number       Create/buy phone number
GET    /phone-number       List phone numbers
GET    /phone-number/:id   Get phone number
PATCH  /phone-number/:id   Update phone number
DELETE /phone-number/:id   Delete phone number
POST   /phone-number/import Import from Twilio
```

### **Calls**
```
POST   /call              Make outbound call
GET    /call              List calls
GET    /call/:id          Get call details
DELETE /call/:id          End call
```

### **Tools**
```
POST   /tool              Create custom tool
GET    /tool              List tools
GET    /tool/:id          Get tool
PATCH  /tool/:id          Update tool
DELETE /tool/:id          Delete tool
```

---

## 💻 **Code Example: Complete Integration**

```javascript
// lib/vapi.js
import Vapi from '@vapi-ai/server-sdk';

const vapi = new Vapi({
  token: process.env.VAPI_API_KEY
});

// 1. Create Assistant
export async function createDentalAssistant(practice) {
  return await vapi.assistants.create({
    name: `${practice.name} AI Receptionist`,
    firstMessage: `Thank you for calling ${practice.name}, this is Emma, how can I help you today?`,
    
    model: {
      provider: 'openai',
      model: 'gpt-4',
      temperature: 0.7,
      messages: [{
        role: 'system',
        content: `You are Emma, the AI receptionist for ${practice.name}...`
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
      },
      {
        type: 'sms'  // Enable SMS sending
      }
    ],
    
    serverUrl: `${process.env.API_URL}/api/webhooks/vapi`,
    serverUrlSecret: process.env.VAPI_WEBHOOK_SECRET
  });
}

// 2. Buy Phone Number
export async function buyPhoneNumber(areaCode = '512') {
  return await vapi.phoneNumbers.create({
    areaCode: areaCode
  });
}

// 3. Link Assistant to Phone Number
export async function linkAssistantToNumber(phoneNumberId, assistantId) {
  return await vapi.phoneNumbers.update(phoneNumberId, {
    assistantId: assistantId,
    smsEnabled: true  // Enable SMS!
  });
}

// 4. Make Outbound Call
export async function makeCall(phoneNumberId, customerPhone, assistantId) {
  return await vapi.calls.create({
    phoneNumberId: phoneNumberId,
    customer: {
      number: customerPhone
    },
    assistantId: assistantId
  });
}

// 5. Send SMS
export async function sendSMS(phoneNumberId, to, message) {
  // SMS is sent via the assistant's SMS tool
  // You trigger it by making a call and having the assistant send the text
  // Or by using the phone number's messaging capability
  
  return await vapi.phoneNumbers.sendMessage(phoneNumberId, {
    to: to,
    content: message
  });
}
```

---

## 🎯 **Your DentalAnswer AI Implementation**

### **Step 1: Setup**
```bash
npm install @vapi-ai/server-sdk
```

### **Step 2: When Dentist Signs Up**
```javascript
// After payment succeeds
const assistant = await createDentalAssistant(practice);
const phoneNumber = await buyPhoneNumber(practice.areaCode);
await linkAssistantToNumber(phoneNumber.id, assistant.id);

// Save to your database
await db.phone_numbers.create({
  practice_id: practice.id,
  phone_number: phoneNumber.number,
  vapi_phone_number_id: phoneNumber.id,
  vapi_assistant_id: assistant.id
});
```

### **Step 3: Handle Webhooks**
```javascript
// app/api/webhooks/vapi/route.js
export async function POST(req) {
  const event = await req.json();
  
  switch (event.type) {
    case 'call.started':
      await handleCallStarted(event.call);
      break;
      
    case 'tool-calls':
      // Your assistant is calling check_availability or book_appointment
      return await handleToolCall(event);
      
    case 'call.ended':
      await handleCallEnded(event.call);
      break;
      
    case 'sms-message-received':
      await handleSMS(event);
      break;
  }
  
  return Response.json({ success: true });
}
```

### **Step 4: Tool Implementation**
```javascript
// app/api/vapi/check-availability/route.js
export async function POST(req) {
  const { message } = await req.json();
  const args = message.toolCallList[0].function.arguments;
  
  // Query your calendar
  const slots = await calendar.getAvailability(
    args.date,
    args.appointmentType
  );
  
  return Response.json({
    results: [{
      toolCallId: message.toolCallList[0].id,
      result: {
        availableSlots: slots
      }
    }]
  });
}

// app/api/vapi/book-appointment/route.js
export async function POST(req) {
  const { message } = await req.json();
  const args = message.toolCallList[0].function.arguments;
  
  // Book the appointment
  const appointment = await bookAppointment(args);
  
  // Send SMS confirmation
  await sendSMS(phoneNumberId, args.phone, 
    `Your appointment is confirmed for ${args.dateTime}`
  );
  
  return Response.json({
    results: [{
      toolCallId: message.toolCallList[0].id,
      result: {
        success: true,
        appointmentId: appointment.id
      }
    }]
  });
}
```

---

## ✅ **Summary: What Vapi Can Do for You**

### **Core Features:**
1. ✅ Buy/provision US phone numbers (free, up to 10)
2. ✅ Create AI voice assistants
3. ✅ Handle inbound calls automatically
4. ✅ Make outbound calls (campaigns, reminders)
5. ✅ Send SMS messages
6. ✅ Receive SMS messages (two-way)
7. ✅ Custom function calling (your APIs)
8. ✅ Real-time webhooks for all events
9. ✅ Call recordings and transcripts
10. ✅ Transfer calls to humans

### **What You DON'T Need:**
- ❌ Separate Twilio account (for basic use)
- ❌ Separate SMS service
- ❌ Complex voice infrastructure
- ❌ Multiple phone numbers for calls vs SMS

### **Limitations:**
- ⚠️ Free numbers: US only, max 10 per account
- ⚠️ SMS: US only (for now)
- ⚠️ International: Need to import Twilio number
- ⚠️ Outbound calls: Limited on free numbers

---

## 🚀 **Next Steps**

1. **Sign up:** https://dashboard.vapi.ai
2. **Get API key:** Dashboard → API Keys
3. **Test in playground:** Dashboard → Assistants → Create
4. **Integrate:** Use the code examples above
5. **Launch:** Start receiving calls!

**You're ready to build! 🎉**
