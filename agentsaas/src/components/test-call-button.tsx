'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, Loader2 } from 'lucide-react'
import { makeTestCall } from '@/lib/actions/test-call'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TestCallButton() {
    const [open, setOpen] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

    const handleTestCall = async () => {
        if (!phoneNumber) {
            setResult({ success: false, error: 'Please enter a phone number' })
            return
        }

        setLoading(true)
        setResult(null)

        try {
            const response = await makeTestCall(phoneNumber)
            setResult(response)

            if (response.success) {
                // Close dialog after 3 seconds on success
                setTimeout(() => {
                    setOpen(false)
                    setPhoneNumber('')
                    setResult(null)
                }, 3000)
            }
        } catch (error) {
            setResult({
                success: false,
                error: 'Failed to initiate test call'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Test Call
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Test Your AI Receptionist</DialogTitle>
                    <DialogDescription>
                        Enter your phone number to receive a test call from your AI receptionist.
                        This will use your current AI settings.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="test-phone">Phone Number</Label>
                        <Input
                            id="test-phone"
                            type="tel"
                            placeholder="+15125551234"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            disabled={loading}
                        />
                        <p className="text-xs text-muted-foreground">
                            Use E.164 format (e.g., +1 for US numbers)
                        </p>
                    </div>

                    {result && (
                        <div className={`p-3 rounded-lg ${result.success
                                ? 'bg-green-50 border border-green-200 text-green-800'
                                : 'bg-red-50 border border-red-200 text-red-800'
                            }`}>
                            <p className="text-sm font-medium">
                                {result.success ? '✓ ' : '✗ '}
                                {result.message || result.error}
                            </p>
                        </div>
                    )}

                    <Button
                        onClick={handleTestCall}
                        disabled={loading || !phoneNumber}
                        className="w-full"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Initiating Call...
                            </>
                        ) : (
                            <>
                                <Phone className="mr-2 h-4 w-4" />
                                Make Test Call
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
