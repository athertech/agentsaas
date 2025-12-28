'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { completeOnboarding } from '@/lib/actions/onboarding'
import { OnboardingData, OfficeHours } from '@/lib/types/onboarding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { ArrowRight, ArrowLeft, Sparkles, Play, Calendar, CheckCircle2, Phone, Search, Loader2 } from "lucide-react"
import { searchNumbers } from '@/lib/actions/phone-numbers'

const STEPS = [
    "Welcome",
    "Practice Information",
    "Office Hours",
    "Calendar Connection",
    "Appointment Types",
    "Phone Number",
    "AI Customization"
]

export default function OnboardingPage() {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [formData, setFormData] = useState<OnboardingData>({
        // Practice info
        practiceName: '',
        address: '',
        website: '',
        practiceType: [],
        insurance: [],

        // Office hours
        officeHours: {},

        // Phone
        phoneNumber: '',

        // AI
        voiceId: 'jennifer',
        greeting: '',
        tone: 'professional'
    })

    const handleNext = async () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1)
        } else {
            // Complete onboarding
            setIsSaving(true)
            try {
                await completeOnboarding(formData)
                router.push('/dashboard?onboarding=complete')
            } catch (error) {
                console.error("Failed to save onboarding data:", error)
                // You might want to show a toast here
            } finally {
                setIsSaving(false)
            }
        }
    }

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    const renderStep = () => {
        switch (currentStep) {
            case 0:
                return <WelcomeStep onNext={handleNext} />
            case 1:
                return <PracticeInfoStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 2:
                return <OfficeHoursStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 3:
                return <CalendarStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 4:
                return <AppointmentTypesStep onNext={handleNext} onBack={handleBack} />
            case 5:
                return <PhoneNumberStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 6:
                return <AICustomizationStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} isSaving={isSaving} />
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-secondary/30 py-8">
            <div className="container max-w-5xl mx-auto px-4">
                <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
                    {/* Sidebar with progress */}
                    <div className="hidden lg:block">
                        <div className="sticky top-8">
                            <StepIndicator
                                currentStep={currentStep}
                                totalSteps={STEPS.length}
                                steps={STEPS}
                            />
                        </div>
                    </div>

                    {/* Main content */}
                    <div>
                        {/* Mobile progress */}
                        <div className="lg:hidden mb-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-muted-foreground">
                                    Step {currentStep + 1} of {STEPS.length}
                                </span>
                                <span className="text-sm font-medium">
                                    {Math.round(((currentStep + 1) / STEPS.length) * 100)}%
                                </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                                />
                            </div>
                        </div>

                        {renderStep()}
                    </div>
                </div>
            </div>
        </div>
    )
}

// Step 1: Welcome
function WelcomeStep({ onNext }: { onNext: () => void }) {
    return (
        <Card>
            <CardHeader className="text-center space-y-4 pb-8">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                    <CardTitle className="text-3xl mb-2">Welcome to DentalAnswer AI!</CardTitle>
                    <CardDescription className="text-base">
                        Let&apos;s get your AI receptionist set up. This takes about 15 minutes.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <Button variant="outline" size="lg">
                        <Play className="mr-2 h-5 w-5" />
                        Watch Setup Overview (2 min)
                    </Button>
                </div>

                <div className="bg-muted/50 p-6 rounded-lg space-y-3">
                    <h3 className="font-semibold">What we&apos;ll set up:</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>Your practice details and office hours</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>Connect your calendar for real-time booking</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>Choose your AI receptionist&apos;s phone number</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>Customize your AI&apos;s voice and personality</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-primary mt-0.5">✓</span>
                            <span>Test your AI with a live call</span>
                        </li>
                    </ul>
                </div>

                <Button onClick={onNext} size="lg" className="w-full">
                    Let&apos;s Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

// Step 2: Practice Information
interface StepProps {
    formData: OnboardingData
    setFormData: React.Dispatch<React.SetStateAction<OnboardingData>>
    onNext: () => void
    onBack: () => void
}

function PracticeInfoStep({ formData, setFormData, onNext, onBack }: StepProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tell us about your practice</CardTitle>
                <CardDescription>
                    This helps us personalize your AI receptionist
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="practiceName">Practice Name *</Label>
                        <Input
                            id="practiceName"
                            value={formData.practiceName}
                            onChange={(e) => setFormData({ ...formData, practiceName: e.target.value })}
                            placeholder="Bright Smile Dental"
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="address">Address *</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            placeholder="1234 Main St, Austin, TX 78701"
                        />
                    </div>

                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            type="url"
                            value={formData.website}
                            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                            placeholder="www.yourpractice.com"
                        />
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <Label>Practice Type</Label>
                    <div className="grid grid-cols-2 gap-3">
                        {['General Dentistry', 'Cosmetic Dentistry', 'Orthodontics', 'Pediatric', 'Oral Surgery', 'Endodontics'].map((type) => (
                            <label key={type} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.practiceType.includes(type)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setFormData({ ...formData, practiceType: [...formData.practiceType, type] })
                                        } else {
                                            setFormData({ ...formData, practiceType: formData.practiceType.filter((t: string) => t !== type) })
                                        }
                                    }}
                                    className="rounded border-gray-300"
                                />
                                <span className="text-sm">{type}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button onClick={onBack} variant="outline" className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1" disabled={!formData.practiceName || !formData.address}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Step 3: Office Hours
function OfficeHoursStep({ formData, setFormData, onNext, onBack }: StepProps) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    const initializeHours = () => {
        if (Object.keys(formData.officeHours).length === 0) {
            const defaultHours: Record<string, OfficeHours> = {}
            days.forEach((day, index) => {
                defaultHours[day] = {
                    isOpen: index < 5, // Mon-Fri open by default
                    open: '09:00',
                    close: index === 4 ? '15:00' : '17:00', // Friday closes early
                    breaks: []
                }
            })
            setFormData({ ...formData, officeHours: defaultHours })
        }
    }

    React.useEffect(() => {
        initializeHours()
    }, [])

    const updateDay = (day: string, field: keyof OfficeHours, value: string | boolean) => {
        setFormData({
            ...formData,
            officeHours: {
                ...formData.officeHours,
                [day]: {
                    ...formData.officeHours[day],
                    [field]: value
                }
            }
        })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Office Hours</CardTitle>
                <CardDescription>When is your office open?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-3">
                    {days.map((day) => {
                        const hours = formData.officeHours[day] || { isOpen: false, open: '09:00', close: '17:00' }
                        return (
                            <div key={day} className="flex items-center gap-3 p-3 border rounded-lg">
                                <div className="w-28">
                                    <span className="font-medium">{day}</span>
                                </div>
                                <div className="flex items-center gap-2 flex-1">
                                    <input
                                        type="checkbox"
                                        checked={hours.isOpen}
                                        onChange={(e) => updateDay(day, 'isOpen', e.target.checked)}
                                        className="rounded"
                                    />
                                    {hours.isOpen ? (
                                        <>
                                            <Input
                                                type="time"
                                                value={hours.open}
                                                onChange={(e) => updateDay(day, 'open', e.target.value)}
                                                className="w-32"
                                            />
                                            <span className="text-muted-foreground">to</span>
                                            <Input
                                                type="time"
                                                value={hours.close}
                                                onChange={(e) => updateDay(day, 'close', e.target.value)}
                                                className="w-32"
                                            />
                                        </>
                                    ) : (
                                        <span className="text-muted-foreground">Closed</span>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        💡 Your AI receptionist will inform callers of your office hours and handle after-hours calls according to your preferences.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button onClick={onBack} variant="outline" className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Step 4: Calendar Connection
function CalendarStep({ formData, setFormData, onNext, onBack }: StepProps) {
    const isConnected = !!(formData.calcomApiKey && formData.calcomEventTypeId)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connect Your Calendar</CardTitle>
                <CardDescription>Enable real-time appointment booking via Cal.com</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="calcomApiKey">Cal.com API Key</Label>
                        <Input
                            type="password"
                            id="calcomApiKey"
                            value={formData.calcomApiKey || ''}
                            onChange={(e) => setFormData({ ...formData, calcomApiKey: e.target.value })}
                            placeholder="cal_live_..."
                        />
                    </div>
                    <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="calcomEventTypeId">Event Type ID</Label>
                        <Input
                            type="text"
                            id="calcomEventTypeId"
                            value={formData.calcomEventTypeId || ''}
                            onChange={(e) => setFormData({ ...formData, calcomEventTypeId: e.target.value })}
                            placeholder="123456"
                        />
                        <p className="text-xs text-muted-foreground">
                            You can find these in your Cal.com Dashboard under Settings &gt; Developer.
                        </p>
                    </div>
                </div>

                {isConnected && (
                    <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Details Entered!</p>
                            <p className="text-sm text-green-700 dark:text-green-300">We will verify the connection during final setup.</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button onClick={onBack} variant="outline" className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1" disabled={!isConnected}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Step 5: Appointment Types
function AppointmentTypesStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
    const [appointmentTypes, setAppointmentTypes] = React.useState([
        { name: 'New Patient Exam', duration: 60, active: true },
        { name: 'Cleaning & Exam', duration: 60, active: true },
        { name: 'Emergency Visit', duration: 30, active: true },
        { name: 'Consultation', duration: 30, active: true },
        { name: 'Cosmetic Consult', duration: 45, active: true },
    ])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appointment Types</CardTitle>
                <CardDescription>What services do you offer?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    {appointmentTypes.map((apt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3 flex-1">
                                <input
                                    type="checkbox"
                                    checked={apt.active}
                                    onChange={(e) => {
                                        const updated = [...appointmentTypes]
                                        updated[index].active = e.target.checked
                                        setAppointmentTypes(updated)
                                    }}
                                    className="rounded"
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{apt.name}</p>
                                    <p className="text-sm text-muted-foreground">{apt.duration} minutes</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button variant="outline" className="w-full">
                    + Add Custom Appointment Type
                </Button>

                <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                        💡 You can customize these later in Settings. Your AI will offer these appointment types to callers.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button onClick={onBack} variant="outline" className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Step 6: Phone Number Selection
function PhoneNumberStep({ formData, setFormData, onNext, onBack }: StepProps) {
    const [areaCode, setAreaCode] = React.useState('512')
    const [isSearching, setIsSearching] = React.useState(false)
    const [availableNumbers, setAvailableNumbers] = React.useState<any[]>([])
    const [selectedNumber, setSelectedNumber] = React.useState(formData.phoneNumber || '')

    const handleSearch = async () => {
        setIsSearching(true)
        try {
            const result = await searchNumbers(areaCode)
            if (result.success && result.numbers) {
                setAvailableNumbers(result.numbers)
            } else {
                console.error("Number search failed:", result.error)
            }
        } catch (error) {
            console.error("Search error:", error)
        } finally {
            setIsSearching(false)
        }
    }

    React.useEffect(() => {
        handleSearch()
    }, [])

    return (
        <Card>
            <CardHeader>
                <CardTitle>Choose Your Phone Number</CardTitle>
                <CardDescription>Get your AI receptionist&apos;s phone number</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="areaCode">Search by Area Code</Label>
                        <div className="flex gap-2 mt-1.5">
                            <Input
                                id="areaCode"
                                value={areaCode}
                                onChange={(e) => setAreaCode(e.target.value)}
                                placeholder="512"
                                maxLength={3}
                                className="w-24"
                            />
                            <Button variant="outline" onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                <span className="ml-2">Search</span>
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Available Numbers</Label>
                        {availableNumbers.length > 0 ? (
                            availableNumbers.map((num) => (
                                <label
                                    key={num.phoneNumber}
                                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${selectedNumber === num.phoneNumber ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                                >
                                    <input
                                        type="radio"
                                        name="phoneNumber"
                                        value={num.phoneNumber}
                                        checked={selectedNumber === num.phoneNumber}
                                        onChange={(e) => {
                                            setSelectedNumber(e.target.value)
                                            setFormData({ ...formData, phoneNumber: e.target.value })
                                        }}
                                        className="rounded-full"
                                    />
                                    <span className="font-mono font-medium">{num.friendlyName}</span>
                                    <span className="text-sm text-muted-foreground ml-auto">{num.locality}, {num.region}</span>
                                </label>
                            ))
                        ) : (
                            !isSearching && (
                                <div className="text-center py-8 border rounded-lg text-muted-foreground">
                                    No numbers found. Try another area code.
                                </div>
                            )
                        )}
                        {isSearching && (
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <Separator />

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                        💡 Managed Phone Infrastructure
                    </p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        We will handle the provisioning and monthly costs of this number as part of your subscription.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Button onClick={onBack} variant="outline" className="flex-1">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1" disabled={!selectedNumber}>
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Step 7: AI Customization
interface AICustomizationProps extends StepProps {
    isSaving: boolean
}

function AICustomizationStep({ formData, setFormData, onNext, onBack, isSaving }: AICustomizationProps) {
    const voices = [
        { id: 'sarah', name: 'Sarah', description: 'Warm & Professional' },
        { id: 'emma', name: 'Emma', description: 'Friendly & Energetic' },
        { id: 'jessica', name: 'Jessica', description: 'Calm & Reassuring' },
        { id: 'michael', name: 'Michael', description: 'Professional Male' },
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Customize Your AI Receptionist</CardTitle>
                <CardDescription>Choose your AI&apos;s voice and personality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Voice Selection</Label>
                    {voices.map((voice) => (
                        <label
                            key={voice.id}
                            className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <input
                                    type="radio"
                                    name="voice"
                                    value={voice.id}
                                    checked={formData.voiceId === voice.id}
                                    onChange={(e) => setFormData({ ...formData, voiceId: e.target.value })}
                                    className="rounded-full"
                                />
                                <div>
                                    <p className="font-medium">{voice.name}</p>
                                    <p className="text-sm text-muted-foreground">{voice.description}</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm">
                                <Play className="h-4 w-4" />
                            </Button>
                        </label>
                    ))}
                </div>

                <Separator />

                <div className="space-y-2">
                    <Label htmlFor="greeting">Greeting Message</Label>
                    <textarea
                        id="greeting"
                        value={formData.greeting || `Thank you for calling ${formData.practiceName || 'your practice'}, how can I help you today?`}
                        onChange={(e) => setFormData({ ...formData, greeting: e.target.value })}
                        rows={3}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    />
                    <p className="text-xs text-muted-foreground">
                        This is the first thing patients hear when they call
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>Conversation Tone</Label>
                    <div className="flex gap-2">
                        {['Professional', 'Friendly', 'Casual'].map((tone) => (
                            <Button
                                key={tone}
                                variant={formData.tone === tone.toLowerCase() ? 'default' : 'outline'}
                                onClick={() => setFormData({ ...formData, tone: tone.toLowerCase() })}
                                className="flex-1"
                            >
                                {tone}
                            </Button>
                        ))}
                    </div>
                </div>

                <Separator />

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">Test Your AI Now</p>
                            <p className="text-sm text-muted-foreground">Hear how your AI sounds before going live</p>
                        </div>
                    </div>
                    <Button className="w-full" size="lg">
                        <Phone className="mr-2 h-4 w-4" />
                        Make Test Call
                    </Button>
                </div>

                <div className="flex gap-3">
                    <Button onClick={onBack} variant="outline" className="flex-1" disabled={isSaving}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1" disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Finish Setup'}
                        {!isSaving && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
