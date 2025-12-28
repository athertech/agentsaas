import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle2, Phone, Calendar, Shield, Play } from "lucide-react"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-2 font-bold text-xl tracking-tight" href="#">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              D
            </span>
            <span>DentalAnswer</span>
          </Link>
          <nav className="hidden md:flex gap-8">
            <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">
              Features
            </Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" href="#how-it-works">
              How it Works
            </Link>
            <Link className="text-sm font-medium hover:text-primary transition-colors" href="#pricing">
              Pricing
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="shadow-soft hover:shadow-soft-hover transition-all">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 md:pt-32">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium text-muted-foreground bg-secondary/50 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                HIPAA-Compliant AI Receptionist
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70 leading-[1.1]">
                Stop Losing Patients <br className="hidden sm:inline" /> When Your Phone Rings
              </h1>
              <p className="mx-auto max-w-[800px] text-lg text-muted-foreground md:text-2xl leading-relaxed">
                DentalAnswer AI answers every call, books appointments automatically, and recovers revenue your front desk misses — 24/7.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                <Link href="/login">
                  <Button size="lg" className="h-14 px-10 text-lg shadow-soft hover:shadow-soft-hover transition-all bg-primary hover:bg-primary/90">
                    Start Free 14-Day Trial
                  </Button>
                </Link>
                <p className="text-sm text-muted-foreground">No credit card required</p>
              </div>
            </div>
          </div>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -z-10 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        </section>

        {/* Loss Aversion Section */}
        <section className="py-24 border-y bg-secondary/10">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Every Missed Call Is a Lost Patient</h2>
              <p className="text-xl text-muted-foreground">Here’s what happens in most dental practices:</p>

              <div className="grid gap-4 md:grid-cols-5 items-center justify-center text-sm font-medium">
                <div className="p-4 bg-background rounded-xl border shadow-sm">Front desk is busy</div>
                <ArrowRight className="hidden md:block h-4 w-4 mx-auto text-muted-foreground" />
                <div className="p-4 bg-background rounded-xl border shadow-sm">Phone rings</div>
                <ArrowRight className="hidden md:block h-4 w-4 mx-auto text-muted-foreground" />
                <div className="p-4 bg-background rounded-xl border shadow-sm text-destructive">Patient hangs up</div>
              </div>

              <div className="pt-8 space-y-4">
                <p className="text-lg font-medium">You never see the loss — but it adds up fast.</p>
                <div className="grid gap-8 md:grid-cols-2">
                  <div className="p-6 bg-background rounded-2xl border shadow-soft">
                    <span className="text-3xl mb-2 block">📉</span>
                    <p className="text-2xl font-bold text-destructive">10–15 calls/week</p>
                    <p className="text-muted-foreground">Average missed calls per practice</p>
                  </div>
                  <div className="p-6 bg-background rounded-2xl border shadow-soft">
                    <span className="text-3xl mb-2 block">💸</span>
                    <p className="text-2xl font-bold text-destructive">$50,000+ per year</p>
                    <p className="text-muted-foreground">In lost treatment revenue</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Core Solution Section */}
        <section id="features" className="py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">DentalAnswer AI Fixes This Automatically</h2>
              <p className="text-xl text-muted-foreground">Answers every call in under 3 seconds and books appointments in real time. No call forwarding. No voicemail. No &quot;please call back later.&quot;</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {[
                { title: "Sounds Human", desc: "Natural, empathetic voice that patients actually like talking to — not a robotic menu.", icon: <Phone className="h-6 w-6" /> },
                { title: "Live Calendar Booking", desc: "Checks your live schedule via Cal.com and books patients directly into open slots.", icon: <Calendar className="h-6 w-6" /> },
                { title: "Smart Routing", desc: "Knows when to handle the booking and when to transfer complex cases to your human staff.", icon: <ArrowRight className="h-6 w-6" /> }
              ].map((feature, i) => (
                <div key={i} className="group relative overflow-hidden rounded-2xl border bg-background p-8 shadow-soft hover:shadow-soft-hover transition-all duration-300">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {feature.icon}
                  </div>
                  <h3 className="mb-3 text-2xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-16 p-8 bg-primary/5 rounded-3xl border border-primary/20">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold uppercase tracking-wider text-primary">On every call, it:</h3>
                  <ul className="space-y-4">
                    {[
                      "Collects patient info & insurance",
                      "Checks live calendar availability",
                      "Books the appointment",
                      "Sends SMS & email confirmation",
                      "Transfers complex calls to staff"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-lg font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-background p-8 rounded-2xl border shadow-soft space-y-4">
                  <h4 className="text-xl font-bold italic">&quot;An assistant that never misses a call — and knows its limits.&quot;</h4>
                  <p className="text-muted-foreground">Built specifically for dental practices. It understands insurance questions, emergency routing, and new vs returning patient logic.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-4xl">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-3xl font-bold tracking-tight sm:text-5xl leading-tight">The ROI Is Immediate</h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">Let’s keep it simple: If it books just one patient, it pays for itself. Most practices book 10–30 extra patients per month.</p>
                </div>
                <div className="p-8 bg-background rounded-3xl border shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest rounded-bl-xl">Value Math</div>
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b pb-4">
                      <span className="text-muted-foreground">One booked patient</span>
                      <span className="text-2xl font-bold text-primary">≈ $500</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-4">
                      <span className="text-muted-foreground">DentalAnswer AI</span>
                      <span className="text-2xl font-bold">$497/mo</span>
                    </div>
                    <div className="pt-4 bg-primary/5 p-4 rounded-xl text-center">
                      <p className="text-sm font-medium uppercase text-primary mb-1">Potential Monthly Gain</p>
                      <p className="text-4xl font-black text-primary">$5,000 - $15,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust/Safety Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-3xl text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">“But I Don’t Trust AI With My Phones”</h2>
              <p className="text-lg text-muted-foreground">Neither did our early customers — until they heard the calls. DentalAnswer AI is designed for safety and efficiency.</p>

              <div className="grid gap-6 md:grid-cols-2 text-left">
                {[
                  "Handles routine bookings only",
                  "Knows when to transfer to humans",
                  "Follows your office hours & rules",
                  "HIPAA-compliant infrastructure"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-secondary/50 rounded-xl border">
                    <Shield className="h-5 w-5 text-primary shrink-0" />
                    <span className="font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Dental Specifics Section */}
        <section className="py-24 bg-background">
          <div className="container px-4 md:px-6 text-center space-y-8">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Built Specifically for Dental Practices</h2>
            <p className="text-xl text-muted-foreground mx-auto max-w-2xl">This is not a generic call bot. DentalAnswer AI is trained for how dental offices actually work.</p>

            <div className="grid gap-6 md:grid-cols-5 py-8">
              {[
                { label: "Dental Appointment Types", icon: "🦷" },
                { label: "New vs Returning Patients", icon: "👤" },
                { label: "Insurance Questions", icon: "📄" },
                { label: "Emergency Routing", icon: "🚨" },
                { label: "After-hours Behavior", icon: "🌙" }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-secondary/30 rounded-2xl border shadow-sm space-y-3">
                  <div className="text-3xl">{item.icon}</div>
                  <p className="font-semibold text-sm leading-tight">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Setup Section */}
        <section className="py-24 bg-secondary/10 border-y">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Setup Takes 15 Minutes</h2>
                <p className="text-xl text-muted-foreground leading-relaxed">No IT. No training. No disruption. You’re live the same day.</p>
                <div className="space-y-4">
                  {[
                    "1️⃣ Connect your calendar",
                    "2️⃣ Choose your greeting",
                    "3️⃣ Forward your phone number"
                  ].map((step, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-background rounded-xl border shadow-sm">
                      <span className="text-xl font-bold text-primary">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative h-[400px] w-full rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 shadow-soft border flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <Play className="h-12 w-12 text-primary mx-auto opacity-50" />
                  <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Live Interaction Simulation</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24">
          <div className="container px-4 md:px-6">
            <div className="mx-auto max-w-2xl text-center space-y-4 mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">Simple, Transparent Pricing</h2>
              <p className="text-xl text-muted-foreground">Plans built to scale with your practice.</p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3 items-start">
              {/* Starter Plan */}
              <div className="p-8 rounded-3xl border border-border bg-background shadow-soft hover:shadow-soft-hover transition-all">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Starter</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">$297</span>
                      <span className="text-muted-foreground font-medium">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-4 border-t pt-6">
                    {[
                      "1 AI phone line",
                      "Up to 200 calls/month",
                      "Unlimited bookings",
                      "24/7 AI receptionist",
                      "Standard analytics"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="block">
                    <Button variant="outline" size="lg" className="w-full">
                      Start Trial
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Professional Plan (Featured) */}
              <div className="relative p-8 rounded-3xl border-2 border-primary bg-background shadow-2xl scale-105 z-10">
                <div className="absolute top-0 right-0 p-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest rounded-bl-xl">Most Popular</div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2 text-primary">Professional</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black">$497</span>
                      <span className="text-muted-foreground font-medium">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-4 border-t pt-6">
                    {[
                      "Unlimited AI phone lines",
                      "Up to 500 calls/month",
                      "Unlimited bookings",
                      "Priority SMS/Email confirmations",
                      "Full analytics dashboard",
                      "Custom greeting & voice"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="block">
                    <Button size="lg" className="w-full h-12 text-lg shadow-soft hover:shadow-soft-hover bg-primary">
                      Start 14-Day Free Trial
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">Cancel anytime</p>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="p-8 rounded-3xl border border-border bg-background shadow-soft hover:shadow-soft-hover transition-all">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black">Custom</span>
                    </div>
                  </div>
                  <ul className="space-y-4 border-t pt-6">
                    {[
                      "Unlimited calls & lines",
                      "Multilocation support",
                      "Dedicated account manager",
                      "Custom PMS integrations",
                      "HIPAA BAA signed",
                      "Custom AI training"
                    ].map((feature, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/login" className="block">
                    <Button variant="outline" size="lg" className="w-full">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Promise & Final CTA */}
        <section className="py-24 bg-primary text-primary-foreground overflow-hidden relative">
          <div className="container px-4 md:px-6 relative z-10">
            <div className="mx-auto max-w-4xl text-center space-y-8">
              <h2 className="text-3xl font-bold tracking-tight sm:text-6xl italic underline underline-offset-8 decoration-primary-foreground/30">Our Promise</h2>
              <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                If DentalAnswer AI doesn’t book at least one appointment during your trial… <br className="hidden md:inline" />
                <span className="text-5xl md:text-7xl font-black block mt-4">You don’t pay.</span>
              </p>

              <div className="pt-12 space-y-6">
                <h3 className="text-xl md:text-2xl font-bold uppercase tracking-widest opacity-80">Stop Letting Voicemail Steal Your Growth</h3>
                <p className="text-lg opacity-90 max-w-2xl mx-auto">Patients are calling. Marketing is working. The only question is whether you’re answering the phone.</p>
                <Link href="/login">
                  <Button size="lg" variant="secondary" className="h-16 px-12 text-2xl font-bold shadow-2xl hover:scale-105 transition-transform">
                    Start Your Free Trial Now
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full blur-[120px]" />
          </div>
        </section>
      </main>

      <footer className="py-12 border-t bg-background">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-sm text-muted-foreground">
            &copy; 2024 DentalAnswer AI. Built with ❤️ for Dentists.
          </p>
          <nav className="flex gap-6">
            <Link className="text-sm text-muted-foreground hover:underline underline-offset-4" href="#">
              Privacy
            </Link>
            <Link className="text-sm text-muted-foreground hover:underline underline-offset-4" href="#">
              Terms
            </Link>
            <Link className="text-sm text-muted-foreground hover:underline underline-offset-4" href="#">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
