import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { PhoneCall, Zap, CreditCard, History, AlertCircle } from "lucide-react"

export default async function UsagePage() {
    const supabase = await createClient()

    // Fetch call count for the current month
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { count: callCount } = await supabase
        .from('calls')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', startOfMonth.toISOString())

    // Mock data for other stats (since we don't have a billing backend yet)
    const callLimit = 500
    const minutesUsed = Math.round((callCount || 0) * 2.5) // Assuming 2.5 mins per call
    const minuteLimit = 1250
    const creditBalance = 45.50

    const usagePercentage = Math.min(((callCount || 0) / callLimit) * 100, 100)
    const minutesPercentage = Math.min((minutesUsed / minuteLimit) * 100, 100)

    return (
        <div className="space-y-6 text-foreground">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Usage & Credits</h1>
                    <p className="text-muted-foreground">
                        Monitor your monthly call volume, AI minutes, and credit balance.
                    </p>
                </div>
                <Button className="bg-primary hover:bg-primary/90">
                    <Zap className="mr-2 h-4 w-4" />
                    Add Credits
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Credit Balance Card */}
                <Card className="border-none shadow-md bg-gradient-to-br from-primary/10 to-transparent">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-primary" />
                            Credit Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">${creditBalance.toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Estimated 182 minutes remaining
                        </p>
                    </CardContent>
                </Card>

                {/* Subscription Usage Card */}
                <Card className="md:col-span-2 border-none shadow-md">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-orange-500" />
                                Professional Plan Status
                            </div>
                            <span className="text-[10px] uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-6 md:grid-cols-2 pt-4">
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Monthly Calls</span>
                                <span className="font-semibold">{callCount || 0} / {callLimit}</span>
                            </div>
                            <Progress value={usagePercentage} className="h-2" />
                            <p className="text-[10px] text-muted-foreground">Resets in 12 days</p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">AI Minutes</span>
                                <span className="font-semibold">{minutesUsed} / {minuteLimit}</span>
                            </div>
                            <Progress value={minutesPercentage} className="h-2" />
                            <p className="text-[10px] text-muted-foreground">Average 2.4 min/call</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert for low credits (Mock) */}
            {creditBalance < 50 && (
                <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-600 dark:text-orange-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    <p className="text-sm font-medium">
                        Your credit balance is getting low. Add credits soon to ensure uninterrupted service for your AI receptionist.
                    </p>
                    <Button variant="ghost" size="sm" className="ml-auto text-orange-600 hover:text-orange-700 hover:bg-orange-500/10">
                        Top Up
                    </Button>
                </div>
            )}

            {/* Usage History Table */}
            <Card className="border-none shadow-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <History className="h-5 w-5 text-muted-foreground" />
                        Billing & Usage History
                    </CardTitle>
                    <CardDescription>
                        A detailed breakdown of your monthly spend and call activity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border">
                        <div className="grid grid-cols-4 p-4 border-b bg-muted/30 font-semibold text-sm">
                            <div>Date</div>
                            <div>Description</div>
                            <div>Activity</div>
                            <div className="text-right">Amount</div>
                        </div>
                        {[
                            { date: 'Dec 15, 2023', desc: 'Credit Top-up', activity: 'Manual Addition', amount: '+$50.00', plus: true },
                            { date: 'Dec 01, 2023', desc: 'Professional Plan Renewal', activity: 'Monthly Subscription', amount: '-$497.00', plus: false },
                            { date: 'Nov 30, 2023', desc: 'AI Minute Usage (Nov)', activity: '432 Minutes', amount: '-$21.60', plus: false },
                            { date: 'Nov 15, 2023', desc: 'Credit Top-up', activity: 'Auto-refill', amount: '+$25.00', plus: true },
                        ].map((row, i) => (
                            <div key={i} className="grid grid-cols-4 p-4 text-sm border-b last:border-0 hover:bg-muted/10 transition-colors">
                                <div className="text-muted-foreground">{row.date}</div>
                                <div className="font-medium">{row.desc}</div>
                                <div className="text-muted-foreground">{row.activity}</div>
                                <div className={`text-right font-semibold ${row.plus ? 'text-green-600' : 'text-foreground'}`}>
                                    {row.amount}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
