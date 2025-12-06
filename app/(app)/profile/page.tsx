"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import Link from "next/link"

// Bileşenler
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EventCalendar } from "@/components/event-calendar"

// İkonlar (ArrowLeft kaldırıldı)
import { Calendar, MapPin, Edit2, Save, X, Award, Users } from "lucide-react"

// --- ARAYÜZLER (TYPES) ---
interface ParticipatedEvent {
  id: number
  title: string
  starts_at: string
  ends_at: string | null
  location_name: string | null
  status: string
  event_type: string
  participation_status: string
}

interface Badge {
  code: string
  name: string
  description: string
  icon_url: string | null
  created_at: string
}

interface Club {
  id: number
  name: string
  role: 'ADMIN' | 'MEMBER'
  member_count: number
}

function formatEventDate(iso: string | null, options: Intl.DateTimeFormatOptions) {
  if (!iso) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(iso))
}


export default function ProfilePage() {
  const { user, isLoading: authLoading, refreshUser } = useAuth()
  const router = useRouter()

  const [isMounted, setIsMounted] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    university_id: "",
    bio: "",
  })
  
  const [universities, setUniversities] = useState<any[]>([])
  const [participatedEvents, setParticipatedEvents] = useState<ParticipatedEvent[]>([])
  const [myBadges, setMyBadges] = useState<Badge[]>([])
  const [myClubs, setMyClubs] = useState<Club[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted) return
    if (!authLoading && !user) {
      router.push("/auth/login")
    } 
    else if (user) {
      setFormData({
        username: user.username,
        name: user.name,
        university_id: (user as any).university_id?.toString() || "none", 
        bio: (user as any).bio ?? "",
      })
      
      fetchUniversities()
      if (user.id) {
        fetchParticipatedEvents(user.id) 
      }
      fetchMyBadges()
      fetchMyClubs()
    }
  }, [user, authLoading, isMounted, router])

  const fetchUniversities = async () => {
    try {
      const unis = await api.getUniversities()
      setUniversities(unis)
    } catch (error) {
      console.error("Failed to fetch universities:", error)
    }
  }

  const fetchParticipatedEvents = async (userId: number) => {
    try {
      const events = await api.getUserEvents(userId)
      setParticipatedEvents(events)
    } catch (error) {
      console.error("Failed to fetch participated events:", error)
    }
  }

  const fetchMyBadges = async () => {
    try {
      const badges = await api.getMyBadges()
      setMyBadges(badges)
    } catch (error) {
      console.error("Failed to fetch badges:", error)
    }
  }
  
  const fetchMyClubs = async () => {
    try {
      const clubs = await api.getMyClubs()
      setMyClubs(clubs)
    } catch (error) {
      console.error("Failed to fetch clubs:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const payload: any = {
        username: formData.username,
        name: formData.name,
        bio: formData.bio.trim() ? formData.bio : null,
      }
      
      if (formData.university_id && formData.university_id !== "none") {
        payload.university_id = Number.parseInt(formData.university_id)
      } else {
        payload.university_id = null
      }
      
      await api.updateProfile(payload)
      setIsEditing(false)
      
      if (refreshUser) {
        await refreshUser()
      }
      
    } catch (error: any) {
      alert(error.message || "Failed to update profile")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isMounted || authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const upcomingEvents = participatedEvents.filter((e) => new Date(e.starts_at) > new Date())
  const pastEvents = participatedEvents.filter((e) => new Date(e.starts_at) <= new Date())
  const calendarEvents = participatedEvents.map((event) => ({
    id: event.id,
    title: event.title,
    starts_at: event.starts_at,
    event_type: event.event_type,
  }))

  return (
    // ✅ Wrapper <div> kaldırıldı, layout hallediyor
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* ✅ Geri Dön Butonu SİLİNDİ */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Sol Sütun */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Profil Kartı */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Profile</CardTitle>
                  {!isEditing ? (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setFormData({
                            username: user.username,
                            name: user.name,
                            university_id: user.university_id?.toString() || "none",
                            bio: user.bio ?? "",
                          })
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col items-center">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl">
                      {user.name?.[0]?.toUpperCase() ?? 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">About Me</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        placeholder="Share a short bio..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="university">University</Label>
                      <Select
                        value={formData.university_id}
                        onValueChange={(value) => setFormData({ ...formData, university_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select university" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem> 
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
                      <p className="text-sm text-muted-foreground">Username</p>
                      <p className="font-medium">{user.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Full Name</p>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    {/* ✅ YENİ: Bio Gösterimi */}
                    <div>
                      <p className="text-sm text-muted-foreground">About Me</p>
                      <p className="text-sm">{user.bio || "No bio set yet."}</p>
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

                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Attendance Rate</p>
                  <div className="flex items-center gap-2">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-indigo-600"
                        style={{
                          width: `${user.attendance_rate === -1 ? 0 : user.attendance_rate}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {user.attendance_rate === -1 ? "N/A" : `${user.attendance_rate}%`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 rounded-lg bg-muted p-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{participatedEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Events Joined</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{upcomingEvents.length}</p>
                    <p className="text-sm text-muted-foreground">Upcoming</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Badges ({myBadges.length})</CardTitle>
                <CardDescription>Your collected achievements</CardDescription>
              </CardHeader>
              <CardContent>
                {myBadges.length === 0 ? (
                  <p className="text-center text-muted-foreground">No badges yet</p>
                ) : (
                  <div className="space-y-4">
                    {myBadges.map((badge) => (
                      <div key={badge.code} className="flex items-center gap-4">
                        <Avatar className="h-12 w-12 rounded-md">
                          <AvatarFallback className="rounded-md bg-indigo-100">
                            <Award className="h-6 w-6 text-indigo-600" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{badge.name}</p>
                          <p className="text-sm text-muted-foreground">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>

          {/* Sağ Sütun */}
          <div className="space-y-6 lg:col-span-2">

            <Card>
              <CardHeader>
                <CardTitle>My Event Calendar</CardTitle>
                <CardDescription>Keep track of upcoming and past events</CardDescription>
              </CardHeader>
              <CardContent>
                <EventCalendar events={calendarEvents} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>My Clubs ({myClubs.length})</CardTitle>
                <CardDescription>Clubs you are a member of</CardDescription>
              </CardHeader>
              <CardContent>
                {myClubs.length === 0 ? (
                  <p className="text-center text-muted-foreground">You haven't joined any clubs</p>
                ) : (
                  <div className="space-y-4">
                    {myClubs.map((club) => (
                      <Link key={club.id} href={`/clubs/${club.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold">{club.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Users className="h-4 w-4" />
                                  {club.member_count} members
                                </div>
                              </div>
                              <Badge variant={club.role === 'ADMIN' ? 'default' : 'outline'}>
                                {club.role}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Events ({upcomingEvents.length})</CardTitle>
                <CardDescription>Events you're participating in</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground">No upcoming events</p>
                ) : (
                  <div className="space-y-4">
                    {upcomingEvents.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge variant="secondary">{event.event_type}</Badge>
                                  <Badge variant="outline">{event.participation_status}</Badge>
                                </div>
                                <h3 className="mb-2 font-semibold">{event.title}</h3>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {formatEventDate(event.starts_at, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                  {event.location_name && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      <span>{event.location_name}</span>
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

            <Card>
              <CardHeader>
                <CardTitle>Past Events ({pastEvents.length})</CardTitle>
                <CardDescription>Events you've attended</CardDescription>
              </CardHeader>
              <CardContent>
                {pastEvents.length === 0 ? (
                  <p className="text-center text-muted-foreground">No past events</p>
                ) : (
                  <div className="space-y-4">
                    {pastEvents.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="mb-2 flex items-center gap-2">
                                  <Badge variant="secondary">{event.event_type}</Badge>
                                  <Badge variant={event.participation_status === "ATTENDED" ? "default" : "outline"}>
                                    {event.participation_status}
                                  </Badge>
                                </div>
                                <h3 className="mb-2 font-semibold">{event.title}</h3>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                      {formatEventDate(event.starts_at, {
                                        month: "short",
                                        day: "numeric",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
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
            
          </div>
        </div>
      </div>
    </div>
  )
}
