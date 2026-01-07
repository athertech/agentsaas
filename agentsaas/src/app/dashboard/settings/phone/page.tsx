import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Phone, Plus, Settings, CheckCircle, AlertCircle } from "lucide-react"
import { getPracticePhoneNumbers } from "@/lib/actions/phone-numbers"
import { PhoneNumberProvisioner } from "@/components/phone-number-provisioner"
import { TestCallButton } from "@/components/test-call-button"
import { redirect } from "next/navigation"

export default async function PhoneSettingsPage({
    searchParams
}: {
    searchParams: Promise<{ success?: string; error?: string }>
}) {
    const params = await searchParams
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch practice
    const { data: practice } = await supabase
        .from('practices')
        .select('*')
        .eq('owner_id', user.id)
        .single()

    if (!practice) {
        redirect('/dashboard/settings')
    }

    // Get phone numbers from our new action
    const phoneNumbers = await getPracticePhoneNumbers()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Phone Numbers</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your AI receptionist phone numbers and call forwarding settings.
                </p>
            </div>

            {/* Success/Error Messages */}
            {params.success === 'number_provisioned' && (
                <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="text-green-800">Phone number successfully provisioned!</p>
                </div>
            )}

            {params.error && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <p className="text-red-800">
                        {params.error === 'already_has_number' && 'You already have a phone number'}
                        {params.error === 'provisioning_failed' && 'Failed to provision phone number. Please try again.'}
                        {params.error === 'practice_not_found' && 'Practice not found'}
                    </p>
                </div>
            )}

            {/* Add New Number UI */}
            {phoneNumbers.length === 0 && (
                <PhoneNumberProvisioner />
            )}

            {/* Active Phone Numbers */}
            {phoneNumbers.length > 0 ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold">Active Numbers</h2>
                        <Badge variant="outline" className="text-primary border-primary/20">
                            1 Primary Number
                        </Badge>
                    </div>
                    {phoneNumbers.map((phone) => (
                        <Card key={phone.id} className="shadow-soft border-primary/10 overflow-hidden">
                            <div className="h-1 bg-primary" />
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-primary/10 rounded-xl">
                                            <Phone className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-3xl font-mono tracking-tight">
                                                {phone.phone_number}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 mt-1">
                                                <CardDescription>
                                                    Active since {new Date(phone.created_at).toLocaleDateString()}
                                                </CardDescription>
                                                <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/10 border-none h-5 px-1.5 text-[10px] uppercase font-bold tracking-wider">
                                                    Primary
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <Badge
                                        variant={phone.status === 'active' ? 'default' : 'secondary'}
                                        className="flex items-center gap-1.5 px-3 py-1"
                                    >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                        {phone.status.toUpperCase()}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Vapi Assistant
                                        </p>
                                        <p className="text-sm font-mono truncate bg-muted/50 p-1.5 rounded border">
                                            {phone.vapi_assistant_id}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            Capabilities
                                        </p>
                                        <div className="flex gap-1">
                                            <Badge variant="outline" className="text-[10px]">VOICE</Badge>
                                            <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">AI RECEPTIONIST</Badge>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-4 border-t">
                                    <Button variant="outline" size="sm">
                                        <Settings className="mr-2 h-4 w-4" />
                                        Configure
                                    </Button>
                                    <TestCallButton />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : null}

            {/* Help Section */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                        • Phone numbers are provided by Vapi and include unlimited incoming calls
                    </p>
                    <p>
                        • Set a forwarding number to transfer calls to your office when needed
                    </p>
                    <p>
                        • Test your AI receptionist anytime with the "Test Call" button
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
