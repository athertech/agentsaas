
import Vapi from '@vapi-ai/server-sdk';

console.log("Inspecting Vapi SDK...");
try {
    const vapi = new Vapi({ token: 'dummy' });
    console.log("Vapi instance keys:", Object.keys(vapi));

    if (vapi.phoneNumbers) {
        console.log("phoneNumbers methods:", Object.keys(Object.getPrototypeOf(vapi.phoneNumbers) || vapi.phoneNumbers));
    } else {
        console.log("❌ vapi.phoneNumbers is missing");
    }

    if (vapi.assistants) {
        console.log("assistants methods:", Object.keys(Object.getPrototypeOf(vapi.assistants) || vapi.assistants));
    } else {
        console.log("❌ vapi.assistants is missing");
    }

} catch (e) {
    console.error("Error initializing Vapi:", e);
}
