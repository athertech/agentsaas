import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Mail, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { NewAppointmentModal } from "@/components/dashboard/new-appointment-modal"

export default async function AppointmentsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    // Get practice ID
    const { data: practice } = await supabase
        .from('practices')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!practice) return null

    // Fetch all bookings for this practice with patient details
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            *,
            patients (
                first_name,
                last_name,
                email,
                phone
            )
        `)
        .eq('practice_id', practice.id)
        .order('start_time', { ascending: true })

    const upcomingBookings = (bookings || []).filter((b: any) => new Date(b.start_time) > new Date())
    const pastBookings = (bookings || []).filter((b: any) => new Date(b.start_time) <= new Date())

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'default'
            case 'pending': return 'secondary'
            case 'cancelled': return 'destructive'
            default: return 'secondary'
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage patient appointments and bookings
                    </p>
                </div>
                <NewAppointmentModal />
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bookings?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
                        <Calendar className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{upcomingBookings.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Week</CardTitle>
                        <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {upcomingBookings.filter((b: any) => {
                                const bookingDate = new Date(b.start_time)
                                const weekFromNow = new Date()
                                weekFromNow.setDate(weekFromNow.getDate() + 7)
                                return bookingDate <= weekFromNow
                            }).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Appointments */}
            <Card>
                <CardHeader>
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <CardDescription>
                        Scheduled appointments for the coming days
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {upcomingBookings.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingBookings.map((booking: any) => (
                                <div
                                    key={booking.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <Calendar className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium">
                                                    {(booking.patients?.first_name
                                                        ? `${booking.patients.first_name} ${booking.patients.last_name}`
                                                        : booking.patient_name) || 'Unknown Patient'}
                                                </p>
                                                <Badge variant={getStatusColor(booking.status)}>
                                                    {booking.status || 'pending'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                                {(booking.patients?.email || booking.patient_email) && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {booking.patients?.email || booking.patient_email}
                                                    </div>
                                                )}
                                                {(booking.patients?.phone || booking.patient_phone) && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {booking.patients?.phone || booking.patient_phone}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-right">
                                            <p className="font-medium">{formatDate(booking.start_time)}</p>
                                            <p className="text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                                <Clock className="h-3 w-3" />
                                                {formatTime(booking.start_time)}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No upcoming appointments</h3>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                New appointments will appear here when patients book through your AI receptionist.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Past Appointments */}
            {pastBookings.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Past Appointments</CardTitle>
                        <CardDescription>
                            Previously completed appointments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {pastBookings.slice(0, 5).map((booking: any) => (
                                <div
                                    key={booking.id}
                                    className="flex items-center justify-between p-4 border rounded-lg opacity-75"
                                >
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="p-2 bg-muted rounded-lg">
                                            <Calendar className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {booking.patients?.first_name
                                                    ? `${booking.patients.first_name} ${booking.patients.last_name}`
                                                    : booking.patient_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {booking.patients?.email || booking.patient_email}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        {formatDate(booking.start_time)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
