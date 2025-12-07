"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Edit,
  Trash2,
  UserPlus,
  UserMinus,
  Star,
  ArrowLeft,
  ExternalLink,
  Clock, // İkon eklendi
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { EventMap } from "@/components/event-map"
import { AddToCalendarButton } from "@/components/add-to-calendar-button"

// Types
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
  owner_user_id: number
  type_id: number | null
  club_id: number | null
  join_method?: "DIRECT_JOIN" | "APPLICATION_ONLY"
  has_register?: boolean
  my_application_status?: "PENDING" | "APPROVED" | string | null
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
  const [isMounted, setIsMounted] = useState(false)
  
  // Başvuru durumu için state
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [applicationReason, setApplicationReason] = useState("")
  const [isApplying, setIsApplying] = useState(false)

  // Maps URL Calculation
  const mapsUrl = useMemo(() => {
    if (!event) return null
    const lat =
      typeof event.latitude === "number"
        ? event.latitude
        : event.latitude
          ? Number(event.latitude)
          : null
    const lng =
      typeof event.longitude === "number"
        ? event.longitude
        : event.longitude
          ? Number(event.longitude)
          : null
    if (lat !== null && lng !== null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
      return `http://maps.google.com/?q=${lat},${lng}`
    }
    if (event?.location_name) {
      return `http://maps.google.com/?q=${encodeURIComponent(event.location_name)}`
    }
    return null
  }, [event])

  const fetchEvent = useCallback(async () => {
    try {
      const data = await api.getEvent(Number(params.id))
      setEvent(data)
    } catch (error) {
      console.error("Failed to fetch event:", error)
    } finally {
      setIsLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    setIsMounted(true)
    fetchEvent()
  }, [params.id, fetchEvent])

  useEffect(() => {
    const checkStatus = async () => {
      // User.id kontrolünü en başa ekledik
      if (!user || !user.id || !event) return

      // 1. Backend event detayında statü dönüyorsa onu al
      if (event.my_application_status) {
        setApplicationStatus(event.my_application_status)
      }

      // 2. Katılımcı listesinde var mı?
      let foundInParticipants = false
      if (event.participants) {
        const participant = event.participants.find((p: any) => p.username === user.username)
        if (participant) {
          foundInParticipants = true
          const status = participant.status?.toString().toUpperCase()
          
          if (["PENDING", "APPLIED"].includes(status)) {
            setApplicationStatus("PENDING")
            setHasJoined(false)
          } else {
            // APPROVED, JOINED, ATTENDED
            setHasJoined(true)
            setApplicationStatus(status)
          }
        }
      }

      // 3. Eğer katılımcı listesinde yoksa...
      if (!foundInParticipants) {
        try {
          // BURADAKİ HATA DÜZELTİLDİ: (user.id ?? -1)
          // Eğer user.id null ise -1 gönderiyoruz ki typescript kızmasın.
          const myEvents = await api.getUserEvents(user.id ?? -1)
          const found = myEvents.find((ev: any) => ev.id === Number(params.id))
          
          if (found) {
            const status = (found.participation_status || found.status || "").toString().toUpperCase()
            if (["PENDING", "APPLIED"].includes(status)) {
              setApplicationStatus("PENDING")
              setHasJoined(false)
            } else if (["APPROVED", "JOINED", "ATTENDED"].includes(status)) {
              setHasJoined(true)
              setApplicationStatus("APPROVED")
            }
          }
        } catch (err) {
          console.error("Failed to check user events status", err)
        }
      }
    }

    checkStatus()
  }, [user, event, params.id])

  const handleApply = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    if (!event) return
    setIsApplying(true)
    try {
      const reason = applicationReason.trim()
      await api.createApplication(event.id, reason ? reason : undefined)
      
      // Başarılı olursa durumu PENDING'e çek ve formu kilitle
      setApplicationStatus("PENDING")
      setApplicationReason("")
      await fetchEvent() // Verileri tazelemek için
    } catch (error: any) {
      // Eğer backend 409 (Conflict - Zaten başvurmuş) dönüyorsa, UI'ı PENDING yap
      if (error?.status === 409 || error?.message?.toLowerCase().includes("already")) {
        setApplicationStatus("PENDING")
      } else {
        alert(error.message || "Failed to submit application")
      }
    } finally {
      setIsApplying(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    if (!event) return
    setIsJoining(true)
    try {
      await api.joinEvent(event.id)
      await fetchEvent()
      setHasJoined(true)
    } catch (error: any) {
      alert(error.message || "Failed to join event")
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    if (!event) return
    setIsJoining(true)
    try {
      await api.leaveEvent(event.id)
      await fetchEvent()
      setHasJoined(false)
      setApplicationStatus(null)
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

  if (!isMounted || isLoading) {
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
  const isFull = event.user_limit !== null && event.participant_count >= event.user_limit
  const requiresApplication = event.join_method === "APPLICATION_ONLY" || event.has_register
  
  const normalizedApplicationStatus = applicationStatus ? applicationStatus.toUpperCase() : null
  
  // Pending kontrolü: Statü PENDING/APPLIED ise VE henüz içeride değilse
  const isApplicationPending = normalizedApplicationStatus
    ? ["PENDING", "APPLIED"].includes(normalizedApplicationStatus) && !hasJoined
    : false
    
  const isApplicationApproved = normalizedApplicationStatus === "APPROVED"

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* Back Button */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* ======================= */}
          {/* SOL TARAF (ANA İÇERİK)  */}
          {/* ======================= */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{event.event_type}</Badge>
                    <Badge variant={event.status === "FUTURE" ? "default" : "outline"}>{event.status}</Badge>
                    {requiresApplication && (
                      <Badge variant="outline">Application Required</Badge>
                    )}
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
                      {isMounted && (
                        <>
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
                        </>
                      )}
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
                    {requiresApplication ? (
                      <div className="space-y-4">
                        {/* 1. Durum: Zaten Kabul Edilmiş / Katılmış */}
                        {hasJoined ? (
                          <div className="space-y-3">
                            <div className="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200 text-center font-medium">
                               You have joined this event!
                            </div>
                            <Button
                              onClick={handleLeave}
                              disabled={isJoining}
                              variant="outline"
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/5"
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              {isJoining ? "Leaving..." : "Leave Event"}
                            </Button>
                          </div>
                        ) : isApplicationPending ? (
                          /* 2. Durum: Başvuru Beklemede (Kilitli Durum) */
                          <div className="space-y-3">
                            <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-700 border border-yellow-200 flex items-center justify-center gap-2">
                               <Clock className="h-4 w-4" />
                               Your application is currently pending approval.
                            </div>
                            <Button disabled className="w-full bg-muted text-muted-foreground border-dashed border cursor-not-allowed">
                              Application Pending
                            </Button>
                          </div>
                        ) : isApplicationApproved ? (
                          /* 3. Durum: Onaylanmış ama son tıklama eksik (Nadir) */
                          <Button onClick={handleJoin} disabled={isJoining || isFull} className="w-full bg-green-600 hover:bg-green-700">
                            <UserPlus className="mr-2 h-4 w-4" />
                            {isJoining ? "Joining..." : isFull ? "Event Full" : "Join Event Now"}
                          </Button>
                        ) : (
                          /* 4. Durum: Henüz başvurmamış -> Formu göster */
                          <div className="space-y-3">
                            <div className="rounded-md border border-dashed border-muted-foreground/40 p-4 text-sm text-muted-foreground">
                              This event requires an application. Please explain why you want to join.
                            </div>
                            <Textarea
                              placeholder="Message to the organizer (why do you want to join?)"
                              value={applicationReason}
                              onChange={(e) => setApplicationReason(e.target.value)}
                              disabled={isApplying}
                              className="min-h-[100px]"
                            />
                            <Button
                              onClick={handleApply}
                              disabled={isApplying || isFull}
                              className="w-full"
                            >
                              {isApplying ? "Submitting..." : isFull ? "Event Full" : "Submit Application"}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Başvuru GEREKTİRMEYEN (Direct Join) Eventler */
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
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Ratings Section */}
            <Card>
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

          {/* ======================= */}
          {/* SAĞ TARAF (SIDEBAR)     */}
          {/* ======================= */}
          <div className="flex h-fit flex-col gap-6">
            
            {/* 1. MAP CARD */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Location Map</CardTitle>
                <CardDescription>Event location</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <EventMap
                  height={300}
                  className="w-full"
                  events={[
                    {
                      id: event.id,
                      title: event.title,
                      latitude:
                        typeof event.latitude === "number"
                          ? event.latitude
                          : event.latitude
                            ? Number(event.latitude)
                            : null,
                      longitude:
                        typeof event.longitude === "number"
                          ? event.longitude
                          : event.longitude
                            ? Number(event.longitude)
                            : null,
                      location_name: event.location_name,
                      starts_at: event.starts_at,
                    },
                  ]}
                />
              </CardContent>
            </Card>

            {/* 2. Participants Card */}
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

            {/* 3. Calendar & Links Card */}
            <Card>
              <CardHeader>
                <CardTitle>Calendar & Links</CardTitle>
                <CardDescription>Save this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <AddToCalendarButton
                  event={{
                    id: event.id,
                    title: event.title,
                    starts_at: event.starts_at,
                    ends_at: event.ends_at,
                    location_name: event.location_name,
                    explanation: event.explanation,
                  }}
                />
                {mapsUrl && (
                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open in Maps
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* 4. Owner Actions */}
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
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}