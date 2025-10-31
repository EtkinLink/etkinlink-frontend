"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, MapPin, Users, DollarSign, Edit, Trash2, UserPlus, UserMinus, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface EventDetail {
  id: number
  title: string
  explanation: string
  price: number
  starts_at: string
  ends_at: string | null
  location_name: string | null
  status: string
  user_limit: number | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
  owner_username: string
  event_type: string
  participant_count: number
  participants: Array<{
    id: number
    username: string
    status: string
  }>
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasJoined, setHasJoined] = useState(false)

  useEffect(() => {
    fetchEvent()
  }, [params.id])

  const fetchEvent = async () => {
    try {
      const data = await api.getEvent(Number(params.id))
      setEvent(data)
      // Check if current user has joined
      if (user && data.participants) {
        setHasJoined(data.participants.some((p: any) => p.username === user.username))
      }
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!event) return
    setIsJoining(true)
    try {
      await api.joinEvent(event.id)
      await fetchEvent()
    } catch (error: any) {
      alert(error.message || "Failed to join event")
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!event) return
    setIsJoining(true)
    try {
      await api.leaveEvent(event.id)
      await fetchEvent()
    } catch (error: any) {
      alert(error.message || "Failed to leave event")
    } finally {
      setIsJoining(false)
    }
  }

  const handleDelete = async () => {
    if (!event) return
    setIsDeleting(true)
    try {
      await api.deleteEvent(event.id)
      router.push("/events")
    } catch (error: any) {
      alert(error.message || "Failed to delete event")
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading event...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center">Event not found</p>
            <Link href="/events">
              <Button className="mt-4 w-full">Back to Events</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isOwner = user?.username === event.owner_username
  const isFull = event.user_limit && event.participant_count >= event.user_limit

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <Link href="/events">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{event.event_type}</Badge>
                    <Badge variant={event.status === "FUTURE" ? "default" : "outline"}>{event.status}</Badge>
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Link href={`/events/${event.id}/edit`}>
                        <Button size="sm" variant="outline">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </Link>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Event</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this event? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                              {isDeleting ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
                <CardTitle className="text-3xl">{event.title}</CardTitle>
                <CardDescription className="text-base">Organized by {event.owner_username}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="mb-2 font-semibold">About this event</h3>
                  <p className="text-muted-foreground">{event.explanation}</p>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Date & Time</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.starts_at).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.starts_at).toLocaleTimeString("en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {event.ends_at &&
                          ` - ${new Date(event.ends_at).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`}
                      </p>
                    </div>
                  </div>

                  {event.location_name && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{event.location_name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <DollarSign className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Price</p>
                      <p className="text-sm text-muted-foreground">{event.price > 0 ? `$${event.price}` : "Free"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Participants</p>
                      <p className="text-sm text-muted-foreground">
                        {event.participant_count}
                        {event.user_limit && ` / ${event.user_limit}`} joined
                      </p>
                    </div>
                  </div>
                </div>

                {!isOwner && (
                  <>
                    <Separator />
                    <div className="flex gap-2">
                      {hasJoined ? (
                        <Button
                          onClick={handleLeave}
                          disabled={isJoining}
                          variant="outline"
                          className="flex-1 bg-transparent"
                        >
                          <UserMinus className="mr-2 h-4 w-4" />
                          {isJoining ? "Leaving..." : "Leave Event"}
                        </Button>
                      ) : (
                        <Button onClick={handleJoin} disabled={isJoining || isFull} className="flex-1">
                          <UserPlus className="mr-2 h-4 w-4" />
                          {isJoining ? "Joining..." : isFull ? "Event Full" : "Join Event"}
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ratings Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ratings & Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/events/${event.id}/ratings`}>
                  <Button variant="outline" className="w-full bg-transparent">
                    <Star className="mr-2 h-4 w-4" />
                    View All Ratings
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle>Participants ({event.participant_count})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {event.participants && event.participants.length > 0 ? (
                    event.participants.slice(0, 5).map((participant) => (
                      <div key={participant.id} className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{participant.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{participant.username}</p>
                          <p className="text-xs text-muted-foreground">{participant.status}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No participants yet</p>
                  )}
                  {event.participants && event.participants.length > 5 && (
                    <p className="text-sm text-muted-foreground">+{event.participants.length - 5} more participants</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Owner Actions */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle>Manage Event</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link href={`/events/${event.id}/applications`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      View Applications
                    </Button>
                  </Link>
                  <Link href={`/events/${event.id}/attendance`}>
                    <Button variant="outline" className="w-full bg-transparent">
                      Manage Attendance
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
