import { config } from 'dotenv'
import path from 'path'

config({ path: path.resolve(process.cwd(), '.env.local') })

console.log("--- CHECKING ALT KEYS ---")
const keys = [
    'VAPI_API_KEY',
    'VAPI_PRIVATE_API_KEY',
    'VAPI_PRIVATE_KEY',
    'VAPI_KEY'
]

keys.forEach(k => {
    const val = process.env[k]
    if (val) {
        console.log(`FOUND ${k}: Length ${val.length}`)
    } else {
        console.log(`MISSING ${k}`)
    }
})
