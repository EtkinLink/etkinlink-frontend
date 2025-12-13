"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, APIError } from "@/lib/api-client"
import Link from "next/link"

// Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Icons
import { ArrowLeft, AlertCircle } from "lucide-react"

// Form data type
interface ClubFormData {
  name: string
  description: string
}

export default function EditClubPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [clubId, setClubId] = useState<number | null>(null)
  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    description: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // 1. Mount state
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 2. Get club ID from URL
  useEffect(() => {
    if (!isMounted) return

    try {
      const pathSegments = window.location.pathname.split('/')
      const idIndex = pathSegments.findIndex(seg => seg === 'clubs') + 1
      const id = Number(pathSegments[idIndex])

      if (id && !isNaN(id)) {
        setClubId(id)
      } else {
        console.error("Invalid Club ID from URL")
        router.push("/clubs")
      }
    } catch (e) {
      console.error(e)
      router.push("/clubs")
    }
  }, [isMounted, router])

  // 3. Auth check and fetch club data
  useEffect(() => {
    if (!isMounted || !clubId) return

    if (!authLoading && !user) {
      router.replace("/auth/login")
      return
    }

    const fetchClubData = async () => {
      setIsLoading(true)
      try {
        const clubData = await api.getClub(clubId)

        // Check if user is admin/owner
        if (clubData.owner_username !== user?.username) {
          // TODO: Also check if user is ADMIN member
          setError("You don't have permission to edit this club")
          setTimeout(() => router.push(`/clubs/${clubId}`), 2000)
          return
        }

        setFormData({
          name: clubData.name,
          description: clubData.description || "",
        })
      } catch (err) {
        console.error("Failed to fetch club data:", err)
        setError("Failed to load club data")
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchClubData()
    }

  }, [isMounted, clubId, user, authLoading, router])

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Submit form
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!clubId) return

    setIsSubmitting(true)
    setError(null)

    if (!formData.name) {
      setError("Club name is required.")
      setIsSubmitting(false)
      return
    }

    try {
      await api.updateClub(clubId, {
        name: formData.name,
        description: formData.description,
      })

      // Success! Redirect to club detail page
      router.push(`/clubs/${clubId}`)

    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Loading state
  if (!isMounted || authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">

        <div className="mb-6 max-w-2xl mx-auto">
          <Button asChild variant="ghost">
            <Link href={`/clubs/${clubId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Club
            </Link>
          </Button>
        </div>

        {/* Main Form Card */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Club</CardTitle>
            <CardDescription>
              Update your club&apos;s information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Club Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. ITU AI/ML Club"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is this club about?"
                  rows={4}
                />
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/clubs/${clubId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
