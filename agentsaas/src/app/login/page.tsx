import { login, signup } from '@/lib/actions/auth'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 px-4 py-12 sm:px-6 lg:px-8">

            <div className="absolute top-8 left-8">
                <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                </Link>
            </div>

            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">D</div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-center text-sm text-muted-foreground">
                    Or <a href="#" className="font-medium text-primary hover:text-primary/90">start your 14-day free trial</a>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[400px]">
                <Card className="shadow-soft border-border/60 bg-background/50 backdrop-blur-sm">
                    <form>
                        <CardContent className="pt-6 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="doctor@example.com"
                                    required
                                    className="h-11 bg-background"
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    <a href="#" className="text-xs font-medium text-primary hover:text-primary/90">Forgot password?</a>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="h-11 bg-background"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-3 pb-6">
                            <Button formAction={login} className="w-full h-11 text-base shadow-soft hover:shadow-soft-hover transition-all">
                                Sign in
                            </Button>
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                                </div>
                            </div>
                            <Button formAction={signup} variant="outline" className="w-full h-11 bg-background">
                                Create an account
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
                <p className="px-8 text-center text-sm text-muted-foreground mt-6">
                    By clicking continue, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
                </p>
            </div>
        </div>
    )
}
