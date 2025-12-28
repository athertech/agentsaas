'use client'

import * as React from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PhoneCall, Clock, Calendar, User, Play, Pause, Download, Volume2, Search, FileText, BrainCircuit } from "lucide-react"

export interface TranscriptSegment {
    role: 'assistant' | 'user' | 'system'
    content: string
}

export interface CallDetail {
    id: string
    caller_number: string
    status: string
    outcome?: string
    duration_seconds: number
    talk_time_seconds?: number
    recording_url?: string
    transcript?: string
    summary?: string
    sentiment_score?: number
    started_at: string
    created_at: string
    bookings?: {
        id: string
        start_time: string
        end_time: string
        appointment_type: string
        status: string
    }[]
}

interface CallDetailModalProps {
    call: CallDetail | null
    isOpen: boolean
    onClose: () => void
}

export function CallDetailModal({ call, isOpen, onClose }: CallDetailModalProps) {
    if (!call) return null

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'default'
            case 'in-progress': return 'secondary'
            case 'failed': return 'destructive'
            default: return 'secondary'
        }
    }

    const parseTranscript = (transcriptJson?: string) => {
        if (!transcriptJson) return []
        try {
            return JSON.parse(transcriptJson)
        } catch (e) {
            // Fallback for plain text transcript
            return [{ role: 'system', content: transcriptJson }]
        }
    }

    const transcript = parseTranscript(call.transcript)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-md">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl flex items-center gap-3">
                                <span className="p-2 bg-primary/10 rounded-lg">
                                    <PhoneCall className="h-5 w-5 text-primary" />
                                </span>
                                {call.caller_number}
                            </DialogTitle>
                            <DialogDescription className="flex items-center gap-4 pt-1">
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(call.started_at).toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    {formatDuration(call.duration_seconds)}
                                </span>
                                <Badge variant={getStatusColor(call.status)} className="capitalize font-medium">
                                    {call.status}
                                </Badge>
                                {call.outcome && (
                                    <Badge variant="outline" className="capitalize border-primary/20 text-primary bg-primary/5">
                                        {call.outcome}
                                    </Badge>
                                )}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-0 mt-6 border-t">
                    {/* Left Panel: Summary & Details */}
                    <div className="md:col-span-1 border-r bg-muted/30 p-6 space-y-6 overflow-y-auto">
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                <BrainCircuit className="h-4 w-4" />
                                AI Summary
                            </h4>
                            <div className="p-4 bg-background rounded-xl border border-primary/10 shadow-sm">
                                <p className="text-sm leading-relaxed">
                                    {call.summary || "Generating summary..."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Call Quality</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 bg-background rounded-lg border text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Sentiment</p>
                                    <p className="font-semibold text-lg">
                                        {call.sentiment_score ? (call.sentiment_score * 100).toFixed(0) + '%' : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-3 bg-background rounded-lg border text-center">
                                    <p className="text-xs text-muted-foreground mb-1">Talk Time</p>
                                    <p className="font-semibold text-lg">
                                        {call.talk_time_seconds ? formatDuration(call.talk_time_seconds) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {call.bookings && call.bookings.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Related Appointment
                                </h4>
                                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 shadow-sm space-y-3">
                                    <div className="space-y-1">
                                        <p className="text-xs text-primary/60 font-medium uppercase">Type</p>
                                        <p className="text-sm font-semibold">{call.bookings[0].appointment_type}</p>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <div className="space-y-1">
                                            <p className="text-xs text-primary/60 font-medium uppercase">Date</p>
                                            <p className="font-medium">
                                                {new Date(call.bookings[0].start_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-xs text-primary/60 font-medium uppercase">Time</p>
                                            <p className="font-medium">
                                                {new Date(call.bookings[0].start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge className="w-full justify-center bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                        {call.bookings[0].status}
                                    </Badge>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3 pt-2">
                            <Button className="w-full justify-start gap-2 h-11" variant="outline">
                                <Play className="h-4 w-4" />
                                Play Recording
                            </Button>
                            <Button className="w-full justify-start gap-2 h-11" variant="ghost">
                                <Download className="h-4 w-4" />
                                Download Transcript
                            </Button>
                        </div>
                    </div>

                    {/* Right Panel: Transcript Viewer */}
                    <div className="md:col-span-2 flex flex-col h-full bg-background">
                        <div className="p-4 border-b flex items-center justify-between bg-muted/10">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Conversation Transcript
                            </h4>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-muted">
                            {transcript.length > 0 ? (
                                transcript.map((segment: TranscriptSegment, idx: number) => (
                                    <div
                                        key={idx}
                                        className={`flex flex-col ${segment.role === 'assistant' ? 'items-start' : 'items-end'}`}
                                    >
                                        <div className={`flex items-center gap-2 mb-1 text-xs font-medium text-muted-foreground ${segment.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center ${segment.role === 'assistant' ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                                {segment.role === 'assistant' ? <BrainCircuit className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                                            </div>
                                            {segment.role === 'assistant' ? 'AI Assistant' : 'Caller'}
                                        </div>
                                        <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${segment.role === 'assistant'
                                            ? 'bg-muted rounded-tl-none border-l-4 border-l-primary'
                                            : 'bg-primary text-primary-foreground rounded-tr-none'
                                            }`}>
                                            {segment.content}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-50">
                                    <FileText className="h-10 w-10 mb-2" />
                                    <p>Transcript is being processed...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
