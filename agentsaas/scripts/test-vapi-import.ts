
// Try default import
import * as VapiModule from '@vapi-ai/server-sdk';

console.log("Module keys:", Object.keys(VapiModule));

try {
    // @ts-ignore
    const v1 = new VapiModule.default({ token: 'test' });
    console.log("Default export works");
} catch (e) { console.log("Default export failed"); }

try {
    // @ts-ignore
    const v2 = new VapiModule.VapiClient({ token: 'test' });
    console.log("VapiClient export works");
} catch (e) { console.log("VapiClient export failed"); }

try {
    // @ts-ignore
    const v3 = new VapiModule.Vapi({ token: 'test' });
    console.log("Vapi export works");
} catch (e) { console.log("Vapi export failed"); }
