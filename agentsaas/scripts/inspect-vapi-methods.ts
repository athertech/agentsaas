import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { VapiClient } from '@vapi-ai/server-sdk';

const vapi = new VapiClient({
    token: process.env.VAPI_PRIVATE_KEY || ''
});

console.log("Phone Numbers Client Methods:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(vapi.phoneNumbers)));

console.log("\nAssistants Client Methods:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(vapi.assistants)));

console.log("\nCalls Client Methods:");
console.log(Object.getOwnPropertyNames(Object.getPrototypeOf(vapi.calls)));
