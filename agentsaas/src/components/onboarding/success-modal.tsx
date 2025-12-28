'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Phone, Play, X } from "lucide-react"

export function OnboardingSuccessModal() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        // Check if onboarding was just completed
        if (searchParams.get('onboarding') === 'complete') {
            setIsOpen(true)
        }
    }, [searchParams])

    const handleClose = () => {
        setIsOpen(false)
        // Remove the query parameter
        router.replace('/dashboard')
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
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
                            <p className="text-2xl font-bold font-mono">(512) 555-0200</p>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="w-full">
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
    )
}
