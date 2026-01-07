import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Layout } from "lucide-react"
import dynamic from "next/dynamic"

const LeadsBoard = dynamic(() => import("@/components/dashboard/leads-board").then(mod => mod.LeadsBoard), {
    loading: () => <div className="h-[600px] w-full animate-pulse bg-muted rounded-lg" />
})

export default async function LeadsPage() {
    const supabase = await createClient()

    // Fetch all leads for the practice
    const { data: leads } = await supabase
        .from('leads')
        .select(`
            *,
            patient:patients(*)
        `)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 text-foreground h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between shrink-0">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Leads Pipeline</h1>
                    <p className="text-muted-foreground">
                        Manage and convert potential patients from missed calls and voicemails.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline">
                        <Layout className="mr-2 h-4 w-4" />
                        List View
                    </Button>
                    <Button className="bg-primary">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Lead
                    </Button>
                </div>
            </div>

            <LeadsBoard initialLeads={leads || []} />
        </div>
    )
}
