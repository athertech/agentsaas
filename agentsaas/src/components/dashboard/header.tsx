'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from "@/components/ui/dropdown-menu"
import { LayoutDashboard, PhoneCall, CalendarDays, Settings, Phone, User, Plug, ChevronDown, LogOut, Bell, CreditCard } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface DashboardHeaderProps {
    userEmail?: string
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
    const userInitial = userEmail?.charAt(0).toUpperCase() || "U"

    return (
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur px-6 shadow-sm">
            <Link href="/dashboard" className="font-bold text-xl flex items-center gap-2 shrink-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    D
                </span>
                <span className="hidden sm:inline-block">DentalAnswer</span>
            </Link>

            <div className="h-6 w-[1px] bg-border mx-2 hidden lg:block" />

            <h1 className="text-lg font-semibold text-foreground/80 truncate">
                Dashboard
            </h1>

            <div className="ml-auto flex items-center gap-2">
                {/* Main Pages Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1">
                            Pages
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Main Pages</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard" className="flex items-center gap-2 cursor-pointer">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/calls" className="flex items-center gap-2 cursor-pointer">
                                <PhoneCall className="h-4 w-4" />
                                Call Logs
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/leads" className="flex items-center gap-2 cursor-pointer">
                                <LayoutDashboard className="h-4 w-4" />
                                Leads Pipeline
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/usage" className="flex items-center gap-2 cursor-pointer">
                                <CreditCard className="h-4 w-4" />
                                Usage & Billing
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/appointments" className="flex items-center gap-2 cursor-pointer">
                                <CalendarDays className="h-4 w-4" />
                                Appointments
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/onboarding" className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                                <Settings className="h-4 w-4" />
                                Onboarding
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Settings Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="gap-1">
                            <Settings className="h-4 w-4" />
                            <span className="hidden sm:inline">Settings</span>
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Settings</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
                                    <Settings className="h-4 w-4" />
                                    Practice Info
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings/phone" className="flex items-center gap-2 cursor-pointer">
                                    <Phone className="h-4 w-4" />
                                    Phone Numbers
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings/ai" className="flex items-center gap-2 cursor-pointer">
                                    <User className="h-4 w-4" />
                                    AI Configuration
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/settings/integrations" className="flex items-center gap-2 cursor-pointer">
                                    <Plug className="h-4 w-4" />
                                    Integrations
                                </Link>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-full">
                    <Bell className="h-5 w-5" />
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Avatar className="h-8 w-8 cursor-pointer border ring-offset-background transition-colors hover:border-primary">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                                {userInitial}
                            </AvatarFallback>
                        </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">My Account</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {userEmail}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/dashboard/settings" className="cursor-pointer">
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 cursor-pointer">
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
