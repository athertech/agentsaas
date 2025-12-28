'use client'

import { Lead } from "@/components/dashboard/leads-board"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Phone, Mail, Calendar, DollarSign, Clock, User } from "lucide-react"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface LeadDetailModalProps {
    lead: Lead | null
    onClose: () => void
    onUpdate: (updatedLead: Lead) => void
}

export function LeadDetailModal({ lead, onClose, onUpdate }: LeadDetailModalProps) {
    const [notes, setNotes] = useState(lead?.notes || '')
    const [status, setStatus] = useState(lead?.status || 'new')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

    if (!lead) return null

    const handleSave = async () => {
        setLoading(true)
        const { error } = await supabase
            .from('leads')
            .update({ notes, status, updated_at: new Date().toISOString() })
            .eq('id', lead.id)

        setLoading(false)
        if (!error) {
            onUpdate({ ...lead, notes, status })
            onClose()
        }
    }

    return (
        <Dialog open={!!lead} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center justify-between mr-4">
                        <DialogTitle className="text-xl">
                            {lead.first_name || lead.last_name
                                ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                                : 'Unknown Lead'}
                        </DialogTitle>
                        <Badge variant={lead.priority === 'high' ? 'destructive' : 'secondary'}>
                            {lead.priority.toUpperCase()} PRIORITY
                        </Badge>
                    </div>
                    <DialogDescription className="flex items-center gap-4 pt-1">
                        <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {lead.phone}
                        </span>
                        {lead.email && (
                            <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" /> {lead.email}
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Status & Value */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pipeline Stage</label>
                            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="interested">Interested</SelectItem>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="lost">Lost</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Expected Value</label>
                            <div className="flex items-center h-10 px-3 border rounded-md bg-muted/20">
                                <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
                                <span className="font-semibold">{lead.expected_value || '0.00'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center justify-between">
                            Notes & Activity
                            <span className="text-xs text-muted-foreground font-normal">Private to staff</span>
                        </label>
                        <Textarea
                            value={notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                            className="min-h-[150px] resize-none"
                            placeholder="Add notes about this patient..."
                        />
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-6 text-xs text-muted-foreground border-t pt-4">
                        <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Created {new Date(lead.created_at).toLocaleDateString()}
                        </div>
                        {lead.last_call_id && (
                            <div className="flex items-center gap-1 text-primary cursor-pointer hover:underline">
                                <Phone className="h-3 w-3" />
                                View Related Call
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
