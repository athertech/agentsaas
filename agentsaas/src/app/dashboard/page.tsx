import { createClient } from "@/lib/supabase/server"
import { CallTable } from "@/components/calls/call-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneIncoming, Clock, CheckCircle, TrendingUp } from "lucide-react"
import { OnboardingSuccessModal } from "@/components/onboarding/success-modal"

export default async function DashboardPage() {
    const supabase = await createClient()

    // Fetch calls (limit 20 for now)
    const { data: calls } = await supabase
        .from('calls')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20)

    // Quick Metrics (Mocked for now, but logical)
    const totalCalls = calls?.length || 0
    const completedCalls = calls?.filter(c => c.status === 'completed').length || 0
    const minutesSaved = Math.round((calls?.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) || 0) / 60)

    return (
        <div className="space-y-8">
            <OnboardingSuccessModal />

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="shadow-soft hover:shadow-soft-hover transition-all border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Calls</CardTitle>
                        <PhoneIncoming className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCalls}</div>
                        <p className="text-xs text-muted-foreground mt-1">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card className="shadow-soft hover:shadow-soft-hover transition-all border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Successful Bookings</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedCalls}</div>
                        <p className="text-xs text-muted-foreground mt-1">+12 since yesterday</p>
                    </CardContent>
                </Card>
                <Card className="shadow-soft hover:shadow-soft-hover transition-all border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Minutes Saved</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{minutesSaved}m</div>
                        <p className="text-xs text-muted-foreground mt-1">Freeing up your staff</p>
                    </CardContent>
                </Card>
                <Card className="shadow-soft hover:shadow-soft-hover transition-all border-border/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Engagement Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">98.2%</div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-600">+4.1% vs average</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="grid gap-4 md:gap-8 lg:grid-cols-3">
                <Card className="lg:col-span-3 shadow-soft border-border/50">
                    <CardHeader className="flex flex-row items-center">
                        <div className="grid gap-1">
                            <CardTitle className="text-xl">Recent Calls</CardTitle>
                            <CardDescription>
                                Live log of incoming patient inquiries and their status.
                            </CardDescription>
                        </div>
                        <div className="ml-auto">
                            {/* Filter or Export buttons could go here */}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CallTable calls={calls || []} />
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
