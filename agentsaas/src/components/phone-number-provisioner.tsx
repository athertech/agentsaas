'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { searchNumbers, provisionPhoneNumberComplete } from "@/lib/actions/phone-numbers"
import { Phone, Search, Plus, Loader2, Check, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export function PhoneNumberProvisioner() {
    const [areaCode, setAreaCode] = useState("512")
    const [numbers, setNumbers] = useState<any[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [isProvisioning, setIsProvisioning] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSearching(true)

        try {
            const result = await searchNumbers(areaCode)
            if (result.success) {
                setNumbers(result.numbers || [])
                if (result.numbers?.length === 0) {
                    setError(`No numbers found in area code ${areaCode}`)
                }
            } else {
                setError(result.error || "Failed to search numbers")
            }
        } catch (err: any) {
            setError(err.message || "An unexpected error occurred")
        } finally {
            setIsSearching(false)
        }
    }

    const handleProvision = async (numObj: any) => {
        setError(null)
        setIsProvisioning(numObj.phoneNumber)

        try {
            // This will redirect on success
            await provisionPhoneNumberComplete(
                numObj.phoneNumber,
                areaCode,
                numObj.vapi_phone_number_id
            )
        } catch (err: any) {
            setError(err.message || "Failed to provision number")
            setIsProvisioning(null)
        }
    }

    return (
        <div className="space-y-6">
            <Card className="border-2 shadow-soft">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-primary" />
                        Choose Your AI Receptionist's Number
                    </CardTitle>
                    <CardDescription>
                        Search for a local US phone number by area code. We'll check for any free numbers already in your account first.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
                        <Input
                            placeholder="Area Code (e.g. 512)"
                            value={areaCode}
                            onChange={(e) => setAreaCode(e.target.value)}
                            maxLength={3}
                            className="bg-white"
                        />
                        <Button type="submit" disabled={isSearching || isProvisioning !== null}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
                            Search
                        </Button>
                    </form>

                    {error && (
                        <div className="flex items-center gap-2 p-3 mt-4 text-sm bg-red-50 border border-red-100 text-red-700 rounded-lg">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {numbers.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h3 className="text-sm font-medium text-muted-foreground">Available Options</h3>
                            <div className="grid gap-2">
                                {numbers.map((num) => (
                                    <div
                                        key={num.phoneNumber}
                                        className={`flex items-center justify-between p-3 border rounded-lg transition-colors group ${num.isExisting ? 'bg-primary/5 border-primary/20' : 'hover:bg-muted/50'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-mono font-medium tracking-tight">
                                                {num.friendlyName}
                                            </span>
                                            <Badge variant={num.isExisting ? "default" : "secondary"} className="text-[10px] uppercase">
                                                {num.isExisting ? "Already Owned" : "Vapi Free Tier"}
                                            </Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={num.isExisting ? "default" : "outline"}
                                            disabled={isProvisioning !== null}
                                            onClick={() => handleProvision(num)}
                                        >
                                            {isProvisioning === num.phoneNumber ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <>
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    {num.isExisting ? "Use This Number" : "Provision New"}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
                <div className="flex gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-primary">Vapi Native Telephony</p>
                        <p>Direct integration with Vapi's infrastructure for the lowest latency and highest reliability.</p>
                    </div>
                </div>
                <div className="flex gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium text-primary">Free US Numbers</p>
                        <p>Take advantage of Vapi's free tier offering up to 10 US-based phone numbers.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
