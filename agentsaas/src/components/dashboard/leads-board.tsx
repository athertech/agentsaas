'use client'

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Clock, MoreHorizontal, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'scheduled' | 'lost'

import { LeadDetailModal } from "@/components/dashboard/lead-detail-modal"

export interface Lead {
    id: string
    first_name: string | null
    last_name: string | null
    phone: string
    email: string | null
    status: LeadStatus
    priority: 'low' | 'medium' | 'high'
    expected_value: number | null
    notes: string | null
    last_call_id: string | null
    created_at: string
}

const STAGES: { id: LeadStatus; label: string; color: string }[] = [
    { id: 'new', label: 'New', color: 'bg-blue-500' },
    { id: 'contacted', label: 'Contacted', color: 'bg-amber-500' },
    { id: 'interested', label: 'Interested', color: 'bg-indigo-500' },
    { id: 'scheduled', label: 'Scheduled', color: 'bg-emerald-500' },
    { id: 'lost', label: 'Lost', color: 'bg-slate-500' }
]

export function LeadsBoard({ initialLeads }: { initialLeads: Lead[] }) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads)
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

    const getLeadsByStatus = (status: LeadStatus) => {
        return leads.filter(l => l.status === status)
    }

    const handleUpdateLead = (updatedLead: Lead) => {
        setLeads(leads.map(l => l.id === updatedLead.id ? updatedLead : l))
    }

    return (
        <>
            <div className="flex gap-4 h-full overflow-x-auto pb-4 scrollbar-hide">
                {STAGES.map((stage) => (
                    <div key={stage.id} className="flex flex-col gap-4 min-w-[300px] w-[300px]">
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                                <h3 className="font-semibold text-sm">{stage.label}</h3>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                    {getLeadsByStatus(stage.id).length}
                                </Badge>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="flex-1 bg-muted/30 rounded-xl p-2 space-y-3 overflow-y-auto border border-dashed border-border/50">
                            {getLeadsByStatus(stage.id).map((lead) => (
                                <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <LeadDetailModal
                key={selectedLead?.id}
                lead={selectedLead}
                onClose={() => setSelectedLead(null)}
                onUpdate={handleUpdateLead}
            />
        </>
    )
}

function LeadCard({ lead, onClick }: { lead: Lead, onClick: () => void }) {
    const priorityColor = {
        low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        medium: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
        high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }[lead.priority]

    return (
        <Card
            onClick={onClick}
            className="border shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/50 group"
        >
            <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                    <div>
                        <h4 className="font-bold text-sm">
                            {lead.first_name || lead.last_name
                                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                : lead.phone}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <Badge variant="outline" className={`border-none px-1 h-4 scale-90 ${priorityColor}`}>
                                {lead.priority}
                            </Badge>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowRight className="h-3 w-3" />
                    </Button>
                </div>

                <div className="space-y-1.5 pt-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {lead.phone}
                    </div>
                    {lead.email && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {lead.email}
                        </div>
                    )}
                </div>

                {lead.expected_value && (
                    <div className="pt-2 border-t mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground font-medium">Expected Value</span>
                        <span className="text-xs font-bold text-primary">${lead.expected_value}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
