"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { useToast } from "@/hooks/use-toast"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import {
  Calendar,
  MapPin,
  Edit2,
  Save,
  X,
  Award,
  Users,
  TrendingUp,
  Clock,
  CheckCircle2,
  Building2,
  Flag
} from "lucide-react"

interface UserEvent {
  id: number
  event_id?: number
  title: string
  event_title?: string
  starts_at: string
  ends_at: string | null
  location_name: string | null
  status: string
  event_type: string
  participation_status: string
  ticket_code?: string
}

interface Club {
  id: number
  name: string
  description?: string
  role: string
  member_count: number
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const router = useRouter()
  const { t } = useI18n()
  const { toast } = useToast()

  const [isMounted, setIsMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    university_id: "",
  })
  const [universities, setUniversities] = useState<any[]>([])

  const [myEvents, setMyEvents] = useState<UserEvent[]>([])
  const [myOwnedEvents, setMyOwnedEvents] = useState<any[]>([])
  const [myClubs, setMyClubs] = useState<Club[]>([])
  const [myReports, setMyReports] = useState<any[]>([])
  const [isLoadingEvents, setIsLoadingEvents] = useState(true)
  const [isLoadingOwnedEvents, setIsLoadingOwnedEvents] = useState(true)
  const [isLoadingClubs, setIsLoadingClubs] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchMyEvents = async () => {
    setIsLoadingEvents(true)
    try {
      const events = await api.getMyEvents()
      setMyEvents(events || [])
    } catch (error) {
      console.error("Failed to fetch my events:", error)
      setMyEvents([])
    } finally {
      setIsLoadingEvents(false)
    }
  }

  const fetchMyOwnedEvents = async () => {
    setIsLoadingOwnedEvents(true)
    try {
      const events = await api.getMyOwnedEvents()
      setMyOwnedEvents(events || [])
    } catch (error) {
      console.error("Failed to fetch owned events:", error)
      setMyOwnedEvents([])
    } finally {
      setIsLoadingOwnedEvents(false)
    }
  }

  const fetchMyClubs = async () => {
    setIsLoadingClubs(true)
    try {
      const clubs = await api.getMyClubs()
      setMyClubs(clubs || [])
    } catch (error) {
      console.error("Failed to fetch clubs:", error)
      setMyClubs([])
    } finally {
      setIsLoadingClubs(false)
    }
  }

  const fetchMyReports = async () => {
    try {
      const reports = await api.getMyReports()
      setMyReports(reports || [])
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      setMyReports([])
    }
  }

  const fetchUniversities = useCallback(async () => {
    try {
      const unis = await api.getUniversities()
      setUniversities(unis || [])
    } catch (error) {
      console.error("Failed to fetch universities:", error)
      setUniversities([])
    }
  }, [])

  useEffect(() => {
    if (!isMounted) return
    if (!authLoading && !user) {
      router.push("/auth/login")
    } else if (user) {
      fetchMyEvents()
      fetchMyOwnedEvents()
      fetchMyClubs()
      fetchMyReports()
      fetchUniversities()
    }
  }, [isMounted, authLoading, user, router, fetchUniversities])

  // Separate useEffect to update formData when user changes
  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        username: user.username,
        name: user.name,
        university_id: (user as any).university_id?.toString() || "none",
      })
    }
  }, [user, isEditing])

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      await api.deleteEvent(eventId)
      await fetchMyOwnedEvents()
    } catch (error: any) {
      alert(error?.message || "Failed to delete event")
    }
  }

  const handleDeleteClub = async (clubId: number) => {
    if (!confirm("Are you sure you want to delete this organization?")) return

    try {
      await api.deleteClub(clubId)
      await fetchMyClubs()
    } catch (error: any) {
      alert(error?.message || "Failed to delete organization")
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: any = {
        username: formData.username,
        name: formData.name,
      }

      if (formData.university_id && formData.university_id !== "none") {
        payload.university_id = Number.parseInt(formData.university_id)
      } else {
        payload.university_id = null
      }

      await api.updateProfile(payload)

      // Refresh user data from backend
      if (refreshUser) {
        await refreshUser()
      }

      setIsEditing(false)

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully!",
        variant: "default",
      })
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isMounted || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Separate events - exclude owned events from myEvents
  const participantEvents = myEvents.filter(e => e.participation_status !== 'OWNER')
  const upcomingEvents = participantEvents.filter(e => new Date(e.starts_at) > new Date())
  const pastEvents = participantEvents.filter(e => new Date(e.starts_at) <= new Date())

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/30 to-background">
      <div className="container py-8">

        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Profile</h1>
          <p className="text-muted-foreground">Manage your account and view your activity</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile Info</CardTitle>
                  {!isEditing ? (
                    <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            username: user.username,
                            name: user.name,
                            university_id: user.university_id?.toString() || "none",
                          })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        <Save className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarFallback className="text-3xl bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white">
                      {user.name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <h2 className="mt-4 text-xl font-bold">{user.name}</h2>
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                </div>

                <Separator />

                {/* Edit Form / Display Info */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="your-username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">{t("profile.university")}</Label>
                      <Select
                        value={formData.university_id}
                        onValueChange={(value) => setFormData({ ...formData, university_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t("profile.university")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t("profile.none")}</SelectItem> 
                          {universities.map((uni) => (
                            <SelectItem key={uni.id} value={uni.id.toString()}>
                              {uni.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    {user.university_name && (
                      <div>
                        <p className="text-sm text-muted-foreground">University</p>
                        <p className="font-medium">{user.university_name}</p>
                      </div>
                    )}
                  </div>
                )}

                <Separator />

                {/* Stats */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">Attendance Rate</p>
                      <span className="text-sm font-bold">
                        {user.attendance_rate === -1 ? "N/A" : `${user.attendance_rate}%`}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                        style={{
                          width: `${user.attendance_rate === -1 ? 0 : user.attendance_rate}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-none">
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{participantEvents.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Joined</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30 border-none">
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{myOwnedEvents.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Created</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-none">
                      <CardContent className="pt-4 pb-4 text-center">
                        <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{myClubs.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Clubs</p>
                      </CardContent>
                    </Card>
                    <Link href="/my-reports" className="block">
                      <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-none hover:shadow-md transition-all cursor-pointer">
                        <CardContent className="pt-4 pb-4 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Flag className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{myReports.length}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Reports</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="events" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="events">
                  <Calendar className="mr-2 h-4 w-4" />
                  Events ({participantEvents.length})
                </TabsTrigger>
                <TabsTrigger value="clubs">
                  <Building2 className="mr-2 h-4 w-4" />
                  Clubs ({myClubs.length})
                </TabsTrigger>
                <TabsTrigger value="achievements">
                  <Award className="mr-2 h-4 w-4" />
                  Achievements
                </TabsTrigger>
              </TabsList>

              {/* Events Tab */}
              <TabsContent value="events" className="space-y-6">
                {/* Upcoming Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      Upcoming Events ({upcomingEvents.length})
                    </CardTitle>
                    <CardDescription>Events you&apos;re registered for</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingEvents ? (
                      <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : upcomingEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No upcoming events</p>
                        <Link href="/events">
                          <Button variant="outline" className="mt-4">Browse Events</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {upcomingEvents.map((event) => (
                          <Link key={event.id || event.event_id} href={`/events/${event.id || event.event_id}`}>
                            <Card className="transition-all hover:shadow-md hover:border-indigo-200">
                              <CardContent className="pt-6">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                                        {event.event_type}
                                      </Badge>
                                      <Badge variant="outline">
                                        {event.participation_status}
                                      </Badge>
                                    </div>
                                    <h3 className="font-semibold mb-2 truncate">
                                      {event.title || event.event_title}
                                    </h3>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{new Date(event.starts_at).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}</span>
                                      </div>
                                      {event.location_name && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3.5 w-3.5" />
                                          <span className="truncate">{event.location_name}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Past Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Past Events ({pastEvents.length})
                    </CardTitle>
                    <CardDescription>Events you&apos;ve attended</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingEvents ? (
                      <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : pastEvents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No past events</p>
                    ) : (
                      <div className="space-y-3">
                        {pastEvents.slice(0, 5).map((event) => (
                          <Link key={event.id || event.event_id} href={`/events/${event.id || event.event_id}`}>
                            <Card className="transition-all hover:shadow-md">
                              <CardContent className="pt-6">
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Badge variant="secondary">{event.event_type}</Badge>
                                      <Badge variant={event.participation_status === "ATTENDED" ? "default" : "outline"}>
                                        {event.participation_status}
                                      </Badge>
                                    </div>
                                    <h3 className="font-semibold truncate">{event.title || event.event_title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {new Date(event.starts_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* My Created Events */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                      My Created Events ({myOwnedEvents.length})
                    </CardTitle>
                    <CardDescription>Events you&apos;ve created</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingOwnedEvents ? (
                      <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : myOwnedEvents.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">You haven&apos;t created any events yet</p>
                        <Link href="/events/create">
                          <Button variant="outline" className="mt-4">Create Event</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myOwnedEvents.map((event) => (
                          <Card key={event.id} className="transition-all hover:shadow-md hover:border-emerald-200">
                            <CardContent className="pt-6">
                              <div className="flex items-start justify-between gap-4">
                                <Link href={`/events/${event.id}`} className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                                      {event.event_type || 'EVENT'}
                                    </Badge>
                                    <Badge variant="outline">
                                      {event.status}
                                    </Badge>
                                  </div>
                                  <h3 className="font-semibold mb-2 truncate">{event.title}</h3>
                                  <div className="space-y-1 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-3.5 w-3.5" />
                                      <span>{new Date(event.starts_at).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}</span>
                                    </div>
                                    {event.location_name && (
                                      <div className="flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" />
                                        <span className="truncate">{event.location_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="flex gap-2">
                                  <Link href={`/events/${event.id}/edit`}>
                                    <Button size="sm" variant="outline">
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                  </Link>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteEvent(event.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Clubs Tab */}
              <TabsContent value="clubs" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      My Organizations
                    </CardTitle>
                    <CardDescription>Clubs and organizations you&apos;re part of</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingClubs ? (
                      <p className="text-center text-muted-foreground py-8">Loading...</p>
                    ) : myClubs.length === 0 ? (
                      <div className="text-center py-12">
                        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">You&apos;re not part of any clubs yet</p>
                        <Link href="/clubs">
                          <Button variant="outline" className="mt-4">Browse Clubs</Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myClubs.map((club) => {
                          const isAdmin = club.role?.toUpperCase() === 'ADMIN' || club.role?.toUpperCase() === 'OWNER'

                          return (
                            <Card key={club.id} className="transition-all hover:shadow-md hover:border-purple-200">
                              <CardContent className="pt-6">
                                <Link href={`/clubs/${club.id}`} className="block">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h3 className="font-semibold truncate">{club.name}</h3>
                                    <Badge
                                      variant={isAdmin ? 'default' : 'secondary'}
                                      className={isAdmin ? 'bg-purple-600' : ''}
                                    >
                                      {club.role}
                                    </Badge>
                                  </div>
                                  {club.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                      {club.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                                    <Users className="h-4 w-4" />
                                    <span>{club.member_count} members</span>
                                  </div>
                                </Link>
                                {isAdmin && (
                                  <div className="flex gap-2 pt-3 border-t">
                                    <Link href={`/clubs/${club.id}/edit`} className="flex-1">
                                      <Button size="sm" variant="outline" className="w-full">
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Edit
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        handleDeleteClub(club.id)
                                      }}
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Delete
                                    </Button>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Achievements Tab */}
              <TabsContent value="achievements" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Achievements & Badges
                    </CardTitle>
                    <CardDescription>Your accomplishments and rewards</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">No achievements yet</p>
                      <p className="text-sm text-muted-foreground">
                        Attend events and participate in activities to earn badges!
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Your Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{participantEvents.length}</p>
                        <p className="text-sm text-muted-foreground">Events Joined</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">
                          {pastEvents.filter(e => e.participation_status === "ATTENDED").length}
                        </p>
                        <p className="text-sm text-muted-foreground">Attended</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">{myClubs.length}</p>
                        <p className="text-sm text-muted-foreground">Clubs</p>
                      </div>
                      <div className="text-center p-4 rounded-lg bg-muted/50">
                        <p className="text-2xl font-bold">
                          {user.attendance_rate === -1 ? "N/A" : `${user.attendance_rate}%`}
                        </p>
                        <p className="text-sm text-muted-foreground">Attendance</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
