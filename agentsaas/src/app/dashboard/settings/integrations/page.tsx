import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Calendar, CheckCircle, XCircle, ExternalLink } from "lucide-react"
import { updateIntegrationSettings } from "@/lib/actions/integrations"

export default async function IntegrationsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let practice = null
    if (user) {
        const { data } = await supabase
            .from('practices')
            .select('*')
            .eq('owner_id', user.id)
            .single()
        practice = data
    }

    const isConnected = !!(practice?.calcom_api_key && practice?.calcom_event_type_id)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground mt-2">
                    Connect your calendar to enable automatic AI booking
                </p>
            </div>

            {/* Cal.com Integration */}
            <form action={updateIntegrationSettings}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Calendar className="h-6 w-6 text-blue-500" />
                                </div>
                                <div>
                                    <CardTitle>Cal.com</CardTitle>
                                    <CardDescription>
                                        Sync appointments and manage availability
                                    </CardDescription>
                                </div>
                            </div>
                            <Badge variant={isConnected ? "default" : "secondary"}>
                                {isConnected ? (
                                    <><CheckCircle className="h-3 w-3 mr-1" /> Connected</>
                                ) : (
                                    <><XCircle className="h-3 w-3 mr-1" /> Not Connected</>
                                )}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="calcom_api_key">Cal.com API Key</Label>
                            <Input
                                type="password"
                                id="calcom_api_key"
                                name="calcom_api_key"
                                defaultValue={practice?.calcom_api_key || ''}
                                placeholder="cal_live_..."
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="calcom_event_type_id">Event Type ID</Label>
                            <Input
                                type="text"
                                id="calcom_event_type_id"
                                name="calcom_event_type_id"
                                defaultValue={practice?.calcom_event_type_id || ''}
                                placeholder="123456"
                            />
                            <p className="text-xs text-muted-foreground">
                                Get your API key and Event ID from{" "}
                                <a href="https://cal.com/settings/developer/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                                    Cal.com Settings
                                    <ExternalLink className="h-3 w-3" />
                                </a>
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit">
                                {isConnected ? 'Update Connection' : 'Connect Cal.com'}
                            </Button>
                        </div>

                        <div className="bg-muted/50 p-4 rounded-lg">
                            <p className="text-sm font-medium mb-2">What this enables:</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                                <li>• Automatic appointment booking via AI calls</li>
                                <li>• Real-time availability checking</li>
                                <li>• Two-way calendar sync</li>
                                <li>• Booking confirmations sent to patients</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>
            </form>

            {/* Help Section */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">Managed Infrastructure</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                        • <strong>Phone & Voice:</strong> Twilio and Vapi are managed automatically by DentalAnswer AI. No setup required.
                    </p>
                    <p>
                        • <strong>Cal.com:</strong> Required for the AI to know when you're available and to book real appointments.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
