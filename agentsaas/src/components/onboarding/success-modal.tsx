'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Phone, Play, Loader2 } from "lucide-react"
import { toast } from 'sonner'
import { getPracticePhoneNumbers } from '@/lib/actions/phone-numbers'
import { makeTestCall } from '@/lib/actions/test-call'

export function OnboardingSuccessModal() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    // Data state
    const [phoneNumber, setPhoneNumber] = useState<string | null>(null)
    const [isLoadingNumber, setIsLoadingNumber] = useState(false)

    // Test call state
    const [isTestCallOpen, setIsTestCallOpen] = useState(false)
    const [testPhoneNumber, setTestPhoneNumber] = useState('')
    const [isCalling, setIsCalling] = useState(false)

    useEffect(() => {
        if (searchParams.get('onboarding') === 'complete') {
            setIsOpen(true)
            fetchPhoneNumber()
        }
    }, [searchParams])

    async function fetchPhoneNumber() {
        setIsLoadingNumber(true)
        try {
            const numbers = await getPracticePhoneNumbers()
            if (numbers && numbers.length > 0) {
                // Determine the best number to show (primary or first available)
                const primary = numbers.find((n: any) => n.is_primary) || numbers[0]
                setPhoneNumber(primary.number)
            } else {
                console.warn('No phone numbers found for practice.')
            }
        } catch (error) {
            console.error('Failed to fetch practice phone number:', error)
        } finally {
            setIsLoadingNumber(false)
        }
    }

    const handleClose = () => {
        setIsOpen(false)
        router.replace('/dashboard')
    }

    const handleTestCall = async () => {
        if (!testPhoneNumber) {
            toast.error("Please enter a phone number")
            return
        }

        setIsCalling(true)
        toast.info("Initiating test call...")

        try {
            const result = await makeTestCall(testPhoneNumber)
            if (result.success) {
                toast.success("Calling you now! Pick up to verify.", { duration: 5000 })
                setIsTestCallOpen(false)
            } else {
                toast.error(result.error || "Failed to make call")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsCalling(false)
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <div className="text-4xl">🎉</div>
                        </div>
                        <DialogTitle className="text-center text-2xl">You're All Set!</DialogTitle>
                        <DialogDescription className="text-center">
                            Your AI receptionist is now live and ready to answer calls
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <Card className="border-2 border-primary/20 bg-primary/5">
                            <CardContent className="pt-6 text-center">
                                <p className="text-sm text-muted-foreground mb-2">Your AI Phone Number</p>
                                {isLoadingNumber ? (
                                    <div className="flex justify-center py-1">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <p className="text-2xl font-bold font-mono">
                                        {phoneNumber || "No Number Assigned"}
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => setIsTestCallOpen(true)}
                                disabled={!phoneNumber || isLoadingNumber}
                            >
                                <Phone className="mr-2 h-4 w-4" />
                                Make Test Call
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => router.push('/dashboard/settings')}>
                                View Setup
                            </Button>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm text-muted-foreground text-center">
                                Need help? Watch this 3-min tour
                            </p>
                            <Button variant="ghost" size="sm" className="w-full mt-2">
                                <Play className="mr-2 h-4 w-4" />
                                Watch Tutorial
                            </Button>
                        </div>

                        <Button onClick={handleClose} className="w-full">
                            Go to Dashboard
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Nested Test Call Dialog */}
            <Dialog open={isTestCallOpen} onOpenChange={setIsTestCallOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Test Your AI Receptionist</DialogTitle>
                        <DialogDescription>
                            Enter your phone number below and we'll call you immediately.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="success-test-phone">Your Phone Number</Label>
                            <Input
                                id="success-test-phone"
                                placeholder="+1 555 000 0000"
                                value={testPhoneNumber}
                                onChange={(e) => setTestPhoneNumber(e.target.value)}
                            />
                            <div className="space-y-1">
                                <p className="text-[10px] text-muted-foreground">
                                    Use E.164 format (e.g., +15550000000).
                                </p>
                                <p className="text-[10px] text-amber-600 font-medium">
                                    Note: Vapi native test calls are currently limited to US numbers (+1).
                                </p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={handleTestCall}
                            disabled={isCalling || !testPhoneNumber}
                            className="w-full sm:w-auto"
                        >
                            {isCalling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCalling ? 'Calling...' : 'Call Me Now'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
