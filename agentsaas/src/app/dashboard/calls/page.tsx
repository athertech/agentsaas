import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PhoneCall, Clock, Calendar, Download } from "lucide-react"
import dynamic from "next/dynamic"

const CallsList = dynamic(() => import("@/components/dashboard/calls-list").then(mod => mod.CallsList), {
    loading: () => <div className="h-64 w-full animate-pulse bg-muted rounded-lg" />
})

export default async function CallsPage() {
    const supabase = await createClient()

    // Fetch all calls with more details, including associated bookings
    const { data: calls } = await supabase
        .from('calls')
        .select(`
            *,
            bookings(*)
        `)
        .order('started_at', { ascending: false })

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Call Intelligence</h1>
                    <p className="text-muted-foreground">
                        Review AI-handled calls, transcripts, and automated patient data extraction.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10">
                        <Download className="mr-2 h-4 w-4" />
                        Export Logs
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="border-none shadow-sm bg-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Calls</CardTitle>
                        <PhoneCall className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{calls?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <PhoneCall className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calls?.filter((c: any) => c.status === 'completed').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calls?.length ? formatDuration(
                                Math.round(calls.reduce((acc: number, c: any) => acc + (c.duration_seconds || 0), 0) / calls.length)
                            ) : '0:00'}
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Today</CardTitle>
                        <Calendar className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {calls?.filter((c: any) => {
                                const callDate = new Date(c.started_at)
                                const today = new Date()
                                return callDate.toDateString() === today.toDateString()
                            }).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Calls List */}
            <Card className="border-none shadow-md overflow-hidden bg-background">
                <CardHeader className="bg-muted/30 pb-4">
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                        Full visibility into AI receptionist interactions. Click a call to view the full transcript and summary.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {calls && calls.length > 0 ? (
                        <CallsList calls={calls} />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="p-4 bg-muted rounded-full">
                                <PhoneCall className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-semibold">No calls to report</h3>
                                <p className="text-muted-foreground max-w-sm mx-auto">
                                    Incoming calls handled by your AI assistant will appear here automatically with full intelligence analysis.
                                </p>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
