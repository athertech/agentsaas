'use client'

import * as React from 'react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingData, OfficeHours, KBEntry } from '@/lib/types/onboarding'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { StepIndicator } from "@/components/onboarding/step-indicator"
import { ArrowRight, ArrowLeft, Sparkles, Play, Calendar, CheckCircle2, Phone, Search, Loader2, Volume2 } from "lucide-react"
import { searchNumbers, performProvisioning } from '@/lib/actions/phone-numbers'
import { makeTestCall } from '@/lib/actions/test-call'
import { getAvailableVoices } from '@/lib/actions/voices'
import { completeOnboarding, savePracticeDraft } from '@/lib/actions/onboarding'
import { Toaster, toast } from 'sonner'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const STEPS = [
    "Welcome",
    "Practice Information",
    "Office Hours",
    "Calendar Connection",
    "Appointment Types",
    "Phone Number",
    "Knowledge Base",
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

        // Knowledge Base
        knowledgeBase: [
            { category: 'faq', question: 'What are your most common procedures?', content: '' },
            { category: 'insurance', question: 'Which insurance plans do you accept?', content: '' },
            { category: 'emergency', question: 'How do you handle dental emergencies?', content: '' }
        ],

        // Appointment Types
        appointmentTypes: [
            { name: 'New Patient Exam', duration: 60, active: true },
            { name: 'Cleaning & Exam', duration: 60, active: true },
            { name: 'Emergency Visit', duration: 30, active: true },
            { name: 'Consultation', duration: 30, active: true },
            { name: 'Cosmetic Consult', duration: 45, active: true },
        ],

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
            toast.loading("Saving your practice settings...", { id: 'onboarding-save' })
            try {
                await completeOnboarding(formData)
                toast.success("Setup complete! Redirecting to dashboard...", { id: 'onboarding-save' })
                // Give a small delay for the toast to be seen
                setTimeout(() => {
                    router.push('/dashboard?onboarding=complete')
                }, 1500)
            } catch (error: any) {
                console.error("Failed to save onboarding data:", error)
                toast.error(`Failed to save settings: ${error.message || 'Unknown error'}`, { id: 'onboarding-save' })
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
                return <AppointmentTypesStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 5:
                return <PhoneNumberStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 6:
                return <KnowledgeBaseStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} />
            case 7:
                return <AICustomizationStep formData={formData} setFormData={setFormData} onNext={handleNext} onBack={handleBack} isSaving={isSaving} />
            default:
                return null
        }
    }

    return (
        <div className="min-h-screen bg-secondary/30 py-8">
            <Toaster position="top-center" richColors />
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
                    {/* Custom practice type input */}
                    <div className="flex gap-2 mt-2">
                        <Input
                            placeholder="Other service (e.g. Dental Jewelry)"
                            id="customPracticeType"
                            className="text-sm h-8"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement).value.trim();
                                    if (val && !formData.practiceType.includes(val)) {
                                        setFormData({ ...formData, practiceType: [...formData.practiceType, val] });
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => {
                                const input = document.getElementById('customPracticeType') as HTMLInputElement;
                                const val = input.value.trim();
                                if (val && !formData.practiceType.includes(val)) {
                                    setFormData({ ...formData, practiceType: [...formData.practiceType, val] });
                                    input.value = '';
                                }
                            }}
                        >
                            Add
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {formData.practiceType.filter(t => !['General Dentistry', 'Cosmetic Dentistry', 'Orthodontics', 'Pediatric', 'Oral Surgery', 'Endodontics'].includes(t)).map(custom => (
                            <Badge key={custom} variant="secondary" className="flex items-center gap-1">
                                {custom}
                                <button className="hover:text-destructive" onClick={() => setFormData({ ...formData, practiceType: formData.practiceType.filter(t => t !== custom) })}>×</button>
                            </Badge>
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
            // Default after hours if not set
            const initialData = {
                ...formData,
                officeHours: defaultHours,
                afterHoursBehavior: formData.afterHoursBehavior || 'book_next'
            }
            setFormData(initialData)
        }
    }

    React.useEffect(() => {
        initializeHours()
    }, [])

    const updateDay = (day: string, field: keyof OfficeHours, value: any) => {
        setFormData(prev => ({
            ...prev,
            officeHours: {
                ...prev.officeHours,
                [day]: {
                    ...prev.officeHours[day],
                    [field]: value
                }
            }
        }))
    }

    const addBreak = (day: string) => {
        const currentBreaks = formData.officeHours[day]?.breaks || []
        updateDay(day, 'breaks', [...currentBreaks, { start: '12:00', end: '13:00' }])
    }

    const removeBreak = (day: string, index: number) => {
        const currentBreaks = formData.officeHours[day]?.breaks || []
        updateDay(day, 'breaks', currentBreaks.filter((_, i) => i !== index))
    }

    const updateBreak = (day: string, index: number, field: 'start' | 'end', value: string) => {
        const currentBreaks = [...(formData.officeHours[day]?.breaks || [])]
        currentBreaks[index] = { ...currentBreaks[index], [field]: value }
        updateDay(day, 'breaks', currentBreaks)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Office Hours</CardTitle>
                <CardDescription>When is your office open?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    {days.map((day) => {
                        const hours = formData.officeHours[day] || { isOpen: false, open: '09:00', close: '17:00', breaks: [] }
                        return (
                            <div key={day} className={`p-3 border rounded-lg transition-colors ${hours.isOpen ? 'bg-card' : 'bg-muted/30'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-28 flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={hours.isOpen}
                                            onChange={(e) => updateDay(day, 'isOpen', e.target.checked)}
                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <span className={`font-medium ${!hours.isOpen && 'text-muted-foreground'}`}>{day}</span>
                                    </div>

                                    <div className="flex-1">
                                        {hours.isOpen ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        type="time"
                                                        value={hours.open}
                                                        onChange={(e) => updateDay(day, 'open', e.target.value)}
                                                        className="w-32 h-9"
                                                    />
                                                    <span className="text-muted-foreground text-sm">to</span>
                                                    <Input
                                                        type="time"
                                                        value={hours.close}
                                                        onChange={(e) => updateDay(day, 'close', e.target.value)}
                                                        className="w-32 h-9"
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => addBreak(day)}
                                                        className="ml-2 h-8 text-xs"
                                                    >
                                                        + Add Break
                                                    </Button>
                                                </div>

                                                {/* Breaks */}
                                                {hours.breaks && hours.breaks.length > 0 && (
                                                    <div className="space-y-2 pl-2 border-l-2 border-muted ml-1">
                                                        {hours.breaks.map((brk, idx) => (
                                                            <div key={idx} className="flex items-center gap-2">
                                                                <span className="text-xs text-muted-foreground w-12">Break:</span>
                                                                <Input
                                                                    type="time"
                                                                    value={brk.start}
                                                                    onChange={(e) => updateBreak(day, idx, 'start', e.target.value)}
                                                                    className="w-28 h-8 text-xs"
                                                                />
                                                                <span className="text-muted-foreground text-xs">to</span>
                                                                <Input
                                                                    type="time"
                                                                    value={brk.end}
                                                                    onChange={(e) => updateBreak(day, idx, 'end', e.target.value)}
                                                                    className="w-28 h-8 text-xs"
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                                    onClick={() => removeBreak(day, idx)}
                                                                >
                                                                    ×
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground text-sm italic">Closed</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <Separator />

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">After-Hours Behavior</h3>
                    <div className="grid gap-3">
                        <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.afterHoursBehavior === 'book_next' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                            <input
                                type="radio"
                                name="afterHours"
                                value="book_next"
                                checked={formData.afterHoursBehavior === 'book_next'}
                                onChange={() => setFormData({ ...formData, afterHoursBehavior: 'book_next' })}
                                className="mt-1"
                            />
                            <div>
                                <span className="font-medium block">Book appointments for next available day</span>
                                <span className="text-sm text-muted-foreground">The AI will offer the earliest available slots from your calendar.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.afterHoursBehavior === 'voicemail' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                            <input
                                type="radio"
                                name="afterHours"
                                value="voicemail"
                                checked={formData.afterHoursBehavior === 'voicemail'}
                                onChange={() => setFormData({ ...formData, afterHoursBehavior: 'voicemail' })}
                                className="mt-1"
                            />
                            <div>
                                <span className="font-medium block">Take messages only</span>
                                <span className="text-sm text-muted-foreground">The AI will take a message and send you a notification.</span>
                            </div>
                        </label>

                        <label className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${formData.afterHoursBehavior === 'transfer' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                            <input
                                type="radio"
                                name="afterHours"
                                value="transfer"
                                checked={formData.afterHoursBehavior === 'transfer'}
                                onChange={() => setFormData({ ...formData, afterHoursBehavior: 'transfer' })}
                                className="mt-1"
                            />
                            <div className="flex-1">
                                <span className="font-medium block">Transfer to emergency line</span>
                                <span className="text-sm text-muted-foreground mb-2 block">Redirect calls to an on-call doctor or service.</span>

                                {formData.afterHoursBehavior === 'transfer' && (
                                    <Input
                                        placeholder="Enter emergency phone number (e.g. +1...)"
                                        value={formData.emergencyPhoneNumber || ''}
                                        onChange={(e) => setFormData({ ...formData, emergencyPhoneNumber: e.target.value })}
                                        className="max-w-xs mt-2"
                                    />
                                )}
                            </div>
                        </label>
                    </div>
                </div>

                <div className="flex gap-3 pt-4">
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
function AppointmentTypesStep({ formData, setFormData, onNext, onBack }: StepProps) {
    const [showAddCustom, setShowAddCustom] = React.useState(false)
    const [customName, setCustomName] = React.useState('')
    const [customDuration, setCustomDuration] = React.useState('30')

    const appointmentTypes = formData.appointmentTypes || []

    const toggleActive = (index: number) => {
        const updated = [...appointmentTypes]
        updated[index].active = !updated[index].active
        setFormData({ ...formData, appointmentTypes: updated })
    }

    const addCustomType = () => {
        if (!customName.trim()) return
        const newType = {
            name: customName.trim(),
            duration: parseInt(customDuration) || 30,
            active: true
        }
        setFormData({
            ...formData,
            appointmentTypes: [...appointmentTypes, newType]
        })
        setCustomName('')
        setShowAddCustom(false)
        toast.success(`Added ${newType.name}`)
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Appointment Types</CardTitle>
                <CardDescription>What services do you offer?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    {appointmentTypes.map((apt, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3 flex-1">
                                <input
                                    type="checkbox"
                                    checked={apt.active}
                                    onChange={() => toggleActive(index)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <div className="flex-1">
                                    <p className="font-medium">{apt.name}</p>
                                    <p className="text-sm text-muted-foreground">{apt.duration} minutes</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!showAddCustom ? (
                    <Button variant="outline" className="w-full border-dashed" onClick={() => setShowAddCustom(true)}>
                        + Add Custom Appointment Type
                    </Button>
                ) : (
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="custom-name">Appointment Name</Label>
                            <Input
                                id="custom-name"
                                placeholder="e.g. Teeth Whitening"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="custom-duration">Duration (minutes)</Label>
                            <Input
                                id="custom-duration"
                                type="number"
                                value={customDuration}
                                onChange={(e) => setCustomDuration(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1" onClick={() => setShowAddCustom(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={addCustomType}>Add Type</Button>
                        </div>
                    </div>
                )}

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
                    <Button onClick={onNext} className="flex-1" disabled={!appointmentTypes.some(a => a.active)}>
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
                    <Button onClick={onBack} variant="outline" className="flex-1" disabled={isSearching}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button
                        onClick={async () => {
                            if (!selectedNumber) return
                            const tid = toast.loading("Provisioning your number...")
                            try {
                                const practiceId = await savePracticeDraft(formData)
                                const result = await performProvisioning(practiceId, selectedNumber, formData.practiceName)
                                if (result.success) {
                                    toast.success("Number linked successfully!", { id: tid })
                                    onNext()
                                } else {
                                    toast.error("Provisioning failed. Please try another number.", { id: tid })
                                }
                            } catch (error: any) {
                                console.error("Provisioning error:", error)
                                toast.error(`Error: ${error.message || 'Failed to provision'}`, { id: tid })
                            }
                        }}
                        className="flex-1"
                        disabled={!selectedNumber || isSearching}
                    >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Step 7: Knowledge Base
function KnowledgeBaseStep({ formData, setFormData, onNext, onBack }: StepProps) {
    const addEntry = () => {
        const newKB = [...(formData.knowledgeBase || []), { category: 'faq', question: '', content: '' }]
        setFormData({ ...formData, knowledgeBase: newKB })
    }

    const updateEntry = (index: number, field: keyof KBEntry, value: string) => {
        const newKB = [...(formData.knowledgeBase || [])]
        newKB[index] = { ...newKB[index], [field]: value }
        setFormData({ ...formData, knowledgeBase: newKB })
    }

    const removeEntry = (index: number) => {
        const newKB = (formData.knowledgeBase || []).filter((_, i) => i !== index)
        setFormData({ ...formData, knowledgeBase: newKB })
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI Knowledge Base</CardTitle>
                <CardDescription>
                    Provide the AI with specific information about your practice to help it answer patient questions accurately.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    {formData.knowledgeBase?.map((entry, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3 relative group">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => removeEntry(index)}
                            >
                                <Separator className="w-4 h-0.5 bg-destructive" />
                            </Button>

                            <div className="grid gap-3">
                                <div className="grid gap-1.5">
                                    <Label>Category</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={entry.category}
                                        onChange={(e) => updateEntry(index, 'category', e.target.value)}
                                    >
                                        <option value="faq">FAQ</option>
                                        <option value="insurance">Insurance</option>
                                        <option value="procedures">Procedures</option>
                                        <option value="emergency">Emergency Policy</option>
                                        <option value="general">General Info</option>
                                    </select>
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Topic / Question</Label>
                                    <Input
                                        value={entry.question}
                                        onChange={(e) => updateEntry(index, 'question', e.target.value)}
                                        placeholder="e.g. Do you accept Delta Dental?"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label>Answer / Content</Label>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                        value={entry.content}
                                        onChange={(e) => updateEntry(index, 'content', e.target.value)}
                                        placeholder="Provide a detailed answer for the AI..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Button variant="outline" className="w-full border-dashed" onClick={addEntry}>
                    + Add More Information
                </Button>

                <div className="bg-primary/5 p-4 rounded-lg flex gap-3 items-start">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-primary/80">
                        The more information you provide, the better your AI receptionist will be at helping your patients.
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

// Step 8: AI Customization
interface AICustomizationProps extends StepProps {
    isSaving: boolean
}

function AICustomizationStep({ formData, setFormData, onNext, onBack, isSaving }: AICustomizationProps) {
    const [isPlaying, setIsPlaying] = React.useState<string | null>(null)
    const [isCalling, setIsCalling] = React.useState(false)
    const [testPhoneNumber, setTestPhoneNumber] = React.useState('')
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [voices, setVoices] = React.useState<any[]>([])
    const [isLoadingVoices, setIsLoadingVoices] = React.useState(true)
    const audioRef = React.useRef<HTMLAudioElement | null>(null)

    React.useEffect(() => {
        async function fetchVoices() {
            setIsLoadingVoices(true)
            const result = await getAvailableVoices()
            if (result.success && result.voices) {
                // Filter for common high-quality providers if list is too long, 
                // or just take the first few popular ones
                const popularVoices = result.voices.filter((v: any) =>
                    v.provider === 'elevenlabs' || v.provider === 'playht' || v.provider === 'vapi'
                ).slice(0, 10)
                setVoices(popularVoices)

                // Set default voice if none selected
                if (!formData.voiceId && popularVoices.length > 0) {
                    setFormData(prev => ({
                        ...prev,
                        voiceId: popularVoices[0].id,
                        voiceProvider: popularVoices[0].provider
                    }))
                }
            } else {
                toast.error("Failed to load voices from Vapi")
            }
            setIsLoadingVoices(false)
        }
        fetchVoices()
    }, [])

    const playVoicePreview = (voiceId: string, previewUrl: string) => {
        if (isPlaying === voiceId) {
            audioRef.current?.pause()
            setIsPlaying(null)
            return
        }

        if (audioRef.current) {
            audioRef.current.pause()
        }

        if (!previewUrl) {
            toast.error("No preview available for this voice")
            return
        }

        const audio = new Audio(previewUrl)
        audioRef.current = audio
        setIsPlaying(voiceId)
        audio.play().catch(err => {
            console.error("Audio playback error:", err)
            toast.error("Could not play preview. Vapi might be processing it.")
            setIsPlaying(null)
        })
        audio.onended = () => setIsPlaying(null)
    }

    const handleTestCall = async () => {
        if (!formData.phoneNumber) {
            toast.error("Please select a phone number first")
            return
        }

        if (!testPhoneNumber) {
            toast.error("Please enter a phone number")
            return
        }

        setIsCalling(true)
        toast.info("Initiating test call...")

        try {
            const result = await makeTestCall(testPhoneNumber)
            if (result.success) {
                toast.success("Test call initiated! You should receive a call shortly.")
                setIsDialogOpen(false)
            } else {
                toast.error(result.error || "Failed to initiate test call")
            }
        } catch (error) {
            console.error("Test call error:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsCalling(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Customize Your AI Receptionist</CardTitle>
                <CardDescription>Choose your AI&apos;s voice and personality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Voice Selection</Label>
                    {isLoadingVoices ? (
                        <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        voices.map((voice) => (
                            <label
                                key={voice.id}
                                className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${formData.voiceId === voice.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="radio"
                                        name="voice"
                                        value={voice.id}
                                        checked={formData.voiceId === voice.id}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            voiceId: e.target.value,
                                            voiceProvider: voice.provider
                                        })}
                                        className="h-4 w-4 rounded-full border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <p className="font-medium text-sm">{voice.name}</p>
                                        <p className="text-xs text-muted-foreground">{voice.description}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={isPlaying === voice.id ? 'text-primary' : ''}
                                    onClick={(e) => {
                                        e.preventDefault()
                                        playVoicePreview(voice.id, voice.previewUrl)
                                    }}
                                >
                                    {isPlaying === voice.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
                                </Button>
                            </label>
                        ))
                    )}
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
                        {['Professional', 'Friendly', 'Casual'].map((toneLabel) => (
                            <Button
                                key={toneLabel}
                                type="button"
                                variant={formData.tone === toneLabel.toLowerCase() ? 'default' : 'outline'}
                                onClick={() => setFormData({ ...formData, tone: toneLabel.toLowerCase() })}
                                className="flex-1"
                            >
                                {toneLabel}
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

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="w-full"
                                size="lg"
                                disabled={!formData.phoneNumber}
                            >
                                <Phone className="mr-2 h-4 w-4" />
                                Make Test Call
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Experience Your AI Receptionist</DialogTitle>
                                <DialogDescription>
                                    Enter your phone number below. We&apos;ll have your new AI receptionist call you so you can hear its voice and tone in action.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="test-phone">Your Phone Number</Label>
                                    <Input
                                        id="test-phone"
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

                    {!formData.phoneNumber && (
                        <p className="text-xs text-destructive mt-2 text-center">
                            Please select a phone number in the previous step to enable test calls.
                        </p>
                    )}
                </div>

                <div className="flex gap-3 mt-8">
                    <Button onClick={onBack} variant="outline" className="flex-1" disabled={isSaving}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                    <Button onClick={onNext} className="flex-1" disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                Finish Setup
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
