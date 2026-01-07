'use server'

/**
 * Vapi Curated Voices
 * These are pre-optimized voices provided directly by Vapi.
 * Using these does not require external provider keys (like ElevenLabs).
 */
const CURATED_VOICES = [
    {
        id: 'Rohan',
        name: 'Rohan',
        provider: 'vapi',
        description: 'Bright, optimistic, energetic (Male)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/1f86f04a7047eb766e43af6270d30e1ba044450a568a1ec040730e5acec540fd/static/audio/rohan-sample.wav'
    },
    {
        id: 'Neha',
        name: 'Neha',
        provider: 'vapi',
        description: 'Professional, charming (Female)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/ff54671fa4731f0a35aef1914bd9e2ae47b67357f6121edb1fd042ed3584000f/static/audio/neha-sample.wav'
    },
    {
        id: 'Hana',
        name: 'Hana',
        provider: 'vapi',
        description: 'Soft, soothing, gentle (Female)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/22949d864a14f15809f3d46a5afa627d5c77c045d78fe7ac6268dc229fe474cf/static/audio/hana-sample.wav'
    },
    {
        id: 'Harry',
        name: 'Harry',
        provider: 'vapi',
        description: 'Clear, energetic, professional (Male)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/69bda125162d386abc9c9b5ddce97af4de6d6d9329607b20d795b711be68bc8d/static/audio/harry-sample.wav'
    },
    {
        id: 'Elliot',
        name: 'Elliot',
        provider: 'vapi',
        description: 'Friendly, professional (Male)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/b9d75fcd2257261082e65fb4743e54201a9a95e48bdb2c66e403bba569b0425b/static/audio/elliot-sample.wav'
    },
    {
        id: 'Lily',
        name: 'Lily',
        provider: 'vapi',
        description: 'Warm, clear (Female)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/72f1a92b5ac6e6cb0a6f9bf23b0bb00d373b5e45f7ced09d0f98a5654ae9ab75/static/audio/lily-sample.wav'
    },
    {
        id: 'Paige',
        name: 'Paige',
        provider: 'vapi',
        description: 'Confident, professional (Female)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/65b7c6faa4e258753535e38b290a9fad3cdd7856661026b8d9f7ecaeb3f47c18/static/audio/paige-sample.wav'
    },
    {
        id: 'Cole',
        name: 'Cole',
        provider: 'vapi',
        description: 'Deep, authoritative (Male)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/6d92961fd818729b17d9b99a6875aeca9490bcd530d2885b356e1b977c088b3d/static/audio/cole-sample.wav'
    },
    {
        id: 'Savannah',
        name: 'Savannah',
        provider: 'vapi',
        description: 'Friendly, helpful (Female)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/674a34f25eab8767fdc243f7d13e2faabb46f94170823a42210e37ab2ce07a0b/static/audio/savannah-sample.wav'
    },
    {
        id: 'Spencer',
        name: 'Spencer',
        provider: 'vapi',
        description: 'Calm, steady (Male)',
        previewUrl: 'https://files.buildwithfern.com/https://vapi.docs.buildwithfern.com/a2773434d5cdf2db89ca6ce09b79c16dac4133a50391f533471e3b456d8ea61e/static/audio/spencer-sample.wav'
    }
]

export async function getAvailableVoices() {
    try {
        console.log("[Voices Action] Returning curated Vapi voices...")

        return {
            success: true,
            voices: CURATED_VOICES
        }
    } catch (error) {
        console.error("[Voices Action] Failed to return curated voices:", error)
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to load voices"
        }
    }
}
