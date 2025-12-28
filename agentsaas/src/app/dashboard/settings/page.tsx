import { createClient } from "@/lib/supabase/server"
import { updateSettings } from "@/lib/actions/settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default async function SettingsPage() {
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

    return (
        <div className="grid gap-4 md:gap-8">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Practice Settings</CardTitle>
                    <CardDescription>Configure your dental practice details and AI behavior.</CardDescription>
                </CardHeader>
                <form action={updateSettings}>
                    <CardContent className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="name">Practice Name</Label>
                            <Input
                                type="text"
                                id="name"
                                name="name"
                                defaultValue={practice?.name || ''}
                                placeholder="Ex: Bright Smile Dental"
                                required
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="address">Practice Address</Label>
                            <Input
                                type="text"
                                id="address"
                                name="address"
                                defaultValue={practice?.address || ''}
                                placeholder="1234 Main St, Austin, TX"
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="website">Website</Label>
                            <Input
                                type="url"
                                id="website"
                                name="website"
                                defaultValue={practice?.website || ''}
                                placeholder="https://www.yourpractice.com"
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="forwarding_number">Forwarding Number (Office)</Label>
                            <Input
                                type="tel"
                                id="forwarding_number"
                                name="forwarding_number"
                                defaultValue={practice?.forwarding_number || ''}
                                placeholder="+15550000000"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="office_hours_start">Open Time</Label>
                                <Input
                                    type="time"
                                    id="office_hours_start"
                                    name="office_hours_start"
                                    defaultValue={practice?.office_hours?.start || '09:00'}
                                />
                            </div>
                            <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="office_hours_end">Close Time</Label>
                                <Input
                                    type="time"
                                    id="office_hours_end"
                                    name="office_hours_end"
                                    defaultValue={practice?.office_hours?.end || '17:00'}
                                />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit">Save Changes</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
