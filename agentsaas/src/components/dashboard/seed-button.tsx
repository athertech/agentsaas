'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Database, Loader2 } from "lucide-react"
import { seedMockCalls } from "@/lib/actions/seed"
import { useRouter } from "next/navigation"

export function SeedButton() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSeed = async () => {
        setLoading(true)
        try {
            const result = await seedMockCalls()
            if (result.success) {
                router.refresh()
            } else {
                alert(`Failed to seed data: ${result.error}`)
            }
        } catch (error) {
            console.error("Failed to seed data:", error)
            alert("Failed to seed data. Check console for details.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            onClick={handleSeed}
            disabled={loading}
            variant="outline"
            size="sm"
            className="gap-2"
        >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            Seed Mock Data
        </Button>
    )
}
