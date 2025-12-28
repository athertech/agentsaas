'use client'

import * as React from 'react'
import { useState } from 'react'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PhoneCall, Clock, Calendar, ChevronRight, Search, Filter } from "lucide-react"
import { CallDetailModal, type CallDetail } from "./call-detail-modal"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface CallsListProps {
    calls: CallDetail[]
}

export function CallsList({ calls }: CallsListProps) {
    const [selectedCall, setSelectedCall] = useState<CallDetail | null>(null)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [outcomeFilter, setOutcomeFilter] = useState<string | null>(null)

    const handleCallClick = (call: CallDetail) => {
        setSelectedCall(call)
        setIsModalOpen(true)
    }

    const filteredCalls = calls.filter((call) => {
        const matchesSearch =
            call.caller_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (call.summary && call.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (call.transcript && call.transcript.toLowerCase().includes(searchQuery.toLowerCase()))

        const matchesStatus = !statusFilter || call.status === statusFilter
        const matchesOutcome = !outcomeFilter || call.outcome === outcomeFilter

        return matchesSearch && matchesStatus && matchesOutcome
    })

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

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search transcripts, summaries, or numbers..."
                        className="pl-10 h-11 bg-background/50 border-primary/10 focus-visible:ring-primary/20"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 gap-2 border-primary/10 bg-background/50">
                                <Filter className="h-4 w-4" />
                                {statusFilter ? `Status: ${statusFilter}` : 'All Status'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setStatusFilter(null)}>All Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('completed')}>Completed</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('in-progress')}>In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusFilter('failed')}>Failed</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-11 gap-2 border-primary/10 bg-background/50">
                                <Filter className="h-4 w-4" />
                                {outcomeFilter ? `Outcome: ${outcomeFilter}` : 'All Outcomes'}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Filter by Outcome</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setOutcomeFilter(null)}>All Outcomes</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOutcomeFilter('booked')}>Booked</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOutcomeFilter('transferred')}>Transferred</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOutcomeFilter('voicemail')}>Voicemail</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setOutcomeFilter('hang_up')}>Hang Up</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="space-y-3">
                {filteredCalls.length > 0 ? (
                    filteredCalls.map((call) => (
                        <div
                            key={call.id}
                            onClick={() => handleCallClick(call)}
                            className="group flex items-center justify-between p-5 border rounded-2xl hover:bg-muted/40 transition-all cursor-pointer hover:border-primary/20 hover:shadow-md bg-background/50"
                        >
                            <div className="flex items-center gap-5 flex-1">
                                <div className="p-3 bg-primary/5 rounded-xl group-hover:bg-primary/10 transition-colors border border-primary/5">
                                    <PhoneCall className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3">
                                        <p className="font-semibold text-lg hover:text-primary transition-colors">
                                            {call.caller_number || 'Unknown Caller'}
                                        </p>
                                        <Badge variant={getStatusColor(call.status)} className="capitalize px-3 py-0.5 font-medium">
                                            {call.status}
                                        </Badge>
                                        {call.outcome && (
                                            <Badge variant="outline" className="capitalize border-primary/20 text-primary bg-primary/5 px-3 py-0.5 font-medium">
                                                {call.outcome}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-2xl italic">
                                        {call.summary || 'No summary available for this call'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-8 px-4">
                                <div className="flex flex-col items-end gap-1.5 min-w-[100px]">
                                    <div className="flex items-center gap-1.5 text-sm font-medium">
                                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                        {formatDuration(call.duration_seconds || 0)}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {new Date(call.started_at).toLocaleDateString(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                        })}
                                    </div>
                                </div>
                                <div className="p-2 rounded-full group-hover:bg-primary/5 group-hover:text-primary transition-all text-muted-foreground/30">
                                    <ChevronRight className="h-5 w-5" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-60">
                        <Search className="h-8 w-8 text-muted-foreground" />
                        <p>No calls match your search or filters.</p>
                        <Button variant="link" onClick={() => { setSearchQuery(''); setStatusFilter(null); setOutcomeFilter(null); }}>
                            Clear all filters
                        </Button>
                    </div>
                )}
            </div>

            <CallDetailModal
                call={selectedCall}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    )
}
