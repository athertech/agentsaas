import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
        // If config is missing, allow request to proceed (e.g. for landing page)
        // Auth will not work, but the app won't crash.
        console.warn('Supabase env vars missing in middleware. Skipping session update.')
        return supabaseResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options: _options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/signup') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        !request.nextUrl.pathname.startsWith('/api') && // Allow webhooks
        request.nextUrl.pathname !== '/' // Allow landing page (if we make one)
    ) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // Onboarding redirection logic
    const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')
    const isOnboardingPath = request.nextUrl.pathname.startsWith('/dashboard/onboarding')

    if (user && isDashboardPath) {
        const { data: practice } = await supabase
            .from('practices')
            .select('has_completed_onboarding')
            .eq('owner_id', user.id)
            .maybeSingle()

        const hasCompleted = practice?.has_completed_onboarding

        if (!hasCompleted && !isOnboardingPath) {
            // Mandatory onboarding
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard/onboarding'
            return NextResponse.redirect(url)
        }

        if (hasCompleted && isOnboardingPath) {
            // Already completed, don't allow access
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
