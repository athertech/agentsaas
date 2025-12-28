"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface Call {
    id: string
    caller_number: string
    status: string
    duration_seconds: number
    started_at: string
    summary: string
}

export function CallTable({ calls }: { calls: Call[] }) {
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Caller</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Summary</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {calls.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">No calls recorded yet.</TableCell>
                    </TableRow>
                ) : (
                    calls.map((call) => (
                        <TableRow key={call.id}>
                            <TableCell>{new Date(call.started_at).toLocaleString()}</TableCell>
                            <TableCell>{call.caller_number}</TableCell>
                            <TableCell>
                                <Badge variant={call.status === 'completed' ? 'default' : 'destructive'}>
                                    {call.status}
                                </Badge>
                            </TableCell>
                            <TableCell>{call.duration_seconds}s</TableCell>
                            <TableCell className="max-w-[300px] truncate" title={call.summary}>
                                {call.summary || '-'}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    )
}
