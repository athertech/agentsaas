import { signup } from '@/lib/actions/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function SignupPage(props: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const searchParams = await props.searchParams
    const error = searchParams.error as string | undefined

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 px-4 py-12 sm:px-6 lg:px-8">

            <div className="absolute top-8 left-8">
                <Link href="/login" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">D</div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                    Create your account
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Start your 14-day free trial today. No credit card required.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[450px]">
                {error && (
                    <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <Card className="shadow-soft border-border/60 bg-background/50 backdrop-blur-sm">
                    <form action={signup}>
                        <CardContent className="pt-6 grid gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        type="text"
                                        placeholder="Dr. Sarah Chen"
                                        required
                                        className="h-11 bg-background"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="practice_name">Practice Name</Label>
                                    <Input
                                        id="practice_name"
                                        name="practice_name"
                                        type="text"
                                        placeholder="Bright Smile Dental"
                                        required
                                        className="h-11 bg-background"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="sarah@example.com"
                                    required
                                    className="h-11 bg-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-11 bg-background"
                                />
                                <p className="text-[11px] text-muted-foreground">
                                    Must be at least 8 characters long.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-6 border-t pt-6 bg-secondary/5">
                            <Button type="submit" className="w-full h-11 text-base shadow-soft hover:shadow-soft-hover transition-all">
                                Create account
                            </Button>
                            <p className="text-center text-xs text-muted-foreground mt-2">
                                Already have an account?{" "}
                                <Link href="/login" className="text-primary font-medium hover:underline">
                                    Sign in
                                </Link>
                            </p>
                        </CardFooter>
                    </form>
                </Card>
                <p className="px-8 text-center text-[11px] text-muted-foreground mt-6">
                    By creating an account, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}
