'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        console.error('Login error:', error)
        // Check for specific error like email not confirmed
        if (error.message.includes('Email not confirmed')) {
            redirect('/login?error=Email not confirmed. Please check your inbox for the verification link.')
        }
        redirect(`/login?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const practiceName = formData.get('practice_name') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
            data: {
                full_name: fullName,
                practice_name: practiceName
            }
        },
    })

    if (error) {
        console.error('Signup error:', error)
        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    // If session is null, it means email confirmation is enabled
    if (data.user && !data.session) {
        redirect('/login?message=Account created! Please check your email to confirm your account before logging in.')
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}
