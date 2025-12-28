import { createClient } from "@/lib/supabase/server"
import { updateAISettings } from "@/lib/actions/ai-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Bot, Phone, AlertTriangle } from "lucide-react"
import { TestCallButton } from "@/components/test-call-button"

export default async function AISettingsPage() {
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

    // Default AI settings (would come from database in production)
    const aiSettings = {
        voice: practice?.ai_voice || 'jennifer',
        greeting: practice?.ai_greeting || "Thank you for calling! I'm your AI receptionist. How can I help you today?",
        tone: practice?.ai_tone || 'professional',
        transferKeywords: practice?.transfer_keywords || ['speak to someone', 'human', 'real person'],
        emergencyKeywords: practice?.emergency_keywords || ['emergency', 'urgent', 'pain', 'bleeding']
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">AI Configuration</h1>
                <p className="text-muted-foreground mt-2">
                    Customize your AI receptionist's voice, personality, and behavior.
                </p>
            </div>

            <form action={updateAISettings} className="space-y-6">
                {/* Voice Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bot className="h-5 w-5" />
                            Voice & Personality
                        </CardTitle>
                        <CardDescription>
                            Choose how your AI receptionist sounds and speaks to patients.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="voice">Voice Selection</Label>
                            <select
                                id="voice"
                                name="voice"
                                defaultValue={aiSettings.voice}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="jennifer">Jennifer (Female, Professional)</option>
                                <option value="mark">Mark (Male, Friendly)</option>
                                <option value="sarah">Sarah (Female, Warm)</option>
                                <option value="david">David (Male, Confident)</option>
                            </select>
                            <p className="text-xs text-muted-foreground">
                                Listen to voice samples in the Vapi dashboard
                            </p>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="tone">Conversation Tone</Label>
                            <select
                                id="tone"
                                name="tone"
                                defaultValue={aiSettings.tone}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="professional">Professional</option>
                                <option value="friendly">Friendly</option>
                                <option value="casual">Casual</option>
                                <option value="empathetic">Empathetic</option>
                            </select>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="greeting">Greeting Message</Label>
                            <textarea
                                id="greeting"
                                name="greeting"
                                defaultValue={aiSettings.greeting}
                                rows={3}
                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                placeholder="Enter your custom greeting..."
                            />
                            <p className="text-xs text-muted-foreground">
                                This is the first thing patients hear when they call
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Transfer Rules */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            Call Transfer Rules
                        </CardTitle>
                        <CardDescription>
                            Configure when calls should be transferred to your office.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="transfer_keywords">Transfer Keywords</Label>
                            <Input
                                type="text"
                                id="transfer_keywords"
                                name="transfer_keywords"
                                defaultValue={aiSettings.transferKeywords.join(', ')}
                                placeholder="speak to someone, human, real person"
                            />
                            <p className="text-xs text-muted-foreground">
                                Comma-separated phrases that trigger a transfer to your office
                            </p>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="forwarding_number">Forwarding Number</Label>
                            <Input
                                type="tel"
                                id="forwarding_number"
                                name="forwarding_number"
                                defaultValue={practice?.forwarding_number || ''}
                                placeholder="+15550000000"
                            />
                            <p className="text-xs text-muted-foreground">
                                Calls will be transferred to this number when requested
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Emergency Handling */}
                <Card className="border-orange-200 dark:border-orange-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                            <AlertTriangle className="h-5 w-5" />
                            Emergency Detection
                        </CardTitle>
                        <CardDescription>
                            Keywords that trigger priority handling for urgent situations.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="emergency_keywords">Emergency Keywords</Label>
                            <Input
                                type="text"
                                id="emergency_keywords"
                                name="emergency_keywords"
                                defaultValue={aiSettings.emergencyKeywords.join(', ')}
                                placeholder="emergency, urgent, pain, bleeding"
                            />
                            <p className="text-xs text-muted-foreground">
                                These keywords will immediately transfer the call and send alerts
                            </p>
                        </div>

                        <div className="bg-orange-50 dark:bg-orange-950/20 p-4 rounded-lg">
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                <strong>Note:</strong> Emergency calls are automatically prioritized and logged separately for immediate follow-up.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <Card>
                    <CardFooter className="flex justify-between pt-6">
                        <TestCallButton />
                        <Button type="submit">
                            Save AI Settings
                        </Button>
                    </CardFooter>
                </Card>
            </form>

            {/* Help Section */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-base">Tips for Best Results</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                    <p>
                        • Keep your greeting concise and welcoming (under 20 seconds)
                    </p>
                    <p>
                        • Use a professional tone for medical practices
                    </p>
                    <p>
                        • Test your AI after making changes to ensure it sounds natural
                    </p>
                    <p>
                        • Add common variations of transfer phrases (e.g., "talk to someone", "speak with staff")
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
