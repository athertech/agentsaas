'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2 } from "lucide-react"

interface StepIndicatorProps {
    currentStep: number
    totalSteps: number
    steps: string[]
}

export function StepIndicator({ currentStep, totalSteps, steps }: StepIndicatorProps) {
    const progress = (currentStep / totalSteps) * 100

    return (
        <div className="space-y-4">
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="font-medium">
                    {Math.round(progress)}% Complete
                </span>
            </div>

            {/* Step checklist preview */}
            <Card className="bg-muted/50">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Setup Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                    {steps.map((step, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                            {index < currentStep ? (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                            ) : index === currentStep ? (
                                <div className="h-4 w-4 rounded-full border-2 border-primary bg-primary/20" />
                            ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                            )}
                            <span className={index < currentStep ? "text-muted-foreground line-through" : index === currentStep ? "font-medium" : "text-muted-foreground"}>
                                {step}
                            </span>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
