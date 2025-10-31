"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Star } from "lucide-react"
import Link from "next/link"

interface Rating {
  id: number
  event_id: number
  user_id: number
  username: string | null
  rating: number
  comment: string | null
}

export default function RatingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [ratings, setRatings] = useState<Rating[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [hasRated, setHasRated] = useState(false)

  useEffect(() => {
    fetchRatings()
  }, [params.id])

  const fetchRatings = async () => {
    try {
      const data = await api.getRatings(Number(params.id))
      setRatings(data)
      // Check if current user has rated
      if (user) {
        const existingRating = data.find((r: Rating) => r.username === user.username)
        if (existingRating) {
          setHasRated(true)
          setUserRating(existingRating.rating)
          setUserComment(existingRating.comment || "")
        }
      }
    } catch (error) {
      console.error("Failed to fetch ratings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitRating = async () => {
    if (userRating === 0) {
      alert("Please select a rating")
      return
    }

    setIsSubmitting(true)
    try {
      await api.createRating(Number(params.id), userRating, userComment || undefined)
      await fetchRatings()
    } catch (error: any) {
      alert(error.message || "Failed to submit rating")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading ratings...</p>
        </div>
      </div>
    )
  }

  const averageRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <Link href={`/events/${params.id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Event Ratings</h1>
          <p className="text-muted-foreground">See what participants thought about this event</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Rating Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{hasRated ? "Your Rating" : "Rate This Event"}</CardTitle>
                <CardDescription>
                  {hasRated ? "You've already rated this event" : "Share your experience"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Rating</Label>
                  <div className="mt-2 flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => !hasRated && setUserRating(star)}
                        disabled={hasRated}
                        className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= userRating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea
                    id="comment"
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    rows={4}
                    disabled={hasRated}
                  />
                </div>

                {!hasRated && (
                  <Button onClick={handleSubmitRating} disabled={isSubmitting || userRating === 0} className="w-full">
                    {isSubmitting ? "Submitting..." : "Submit Rating"}
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="mb-2 flex items-center justify-center gap-2">
                    <Star className="h-8 w-8 fill-yellow-400 text-yellow-400" />
                    <p className="text-4xl font-bold">{averageRating.toFixed(1)}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on {ratings.length} rating{ratings.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ratings List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>All Ratings ({ratings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ratings.length === 0 ? (
                  <p className="text-center text-muted-foreground">No ratings yet</p>
                ) : (
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <Card key={rating.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-4">
                            <Avatar>
                              <AvatarFallback>
                                {rating.username ? rating.username[0].toUpperCase() : "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="mb-2 flex items-center justify-between">
                                <p className="font-semibold">{rating.username || "Anonymous"}</p>
                                <div className="flex gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`h-4 w-4 ${
                                        i < rating.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              {rating.comment && (
                                <div className="rounded-lg bg-muted p-3">
                                  <p className="text-sm text-muted-foreground">{rating.comment}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
