"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import Link from "next/link"
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Map,
  Plus, // "Create Event" butonu için
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EventMap } from "@/components/event-map"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

interface Event {
  id: number
  title: string
  explanation: string
  starts_at: string
  ends_at: string | null
  location_name: string | null
  status: string
  event_type: string
  owner_username: string
  participant_count: number
  price: number
  latitude?: number
  longitude?: number
  distance_km?: number
  join_method?: "DIRECT_JOIN" | "APPLICATION_ONLY"
}

function formatEventDate(iso: string) {
  // SSR ve client farkını önlemek için UTC timezone ile sabit format
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso))
}

export default function EventsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [events, setEvents] = useState<Event[]>([])
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"all" | "nearby">("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  const [isMounted, setIsMounted] = useState(false)
  const [locationReady, setLocationReady] = useState(false)


  // --- Bileşenin yüklendiğini belirt ---
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // --- Giriş kontrolü ---
  useEffect(() => {
    if (isMounted && !authLoading && !user) {
      const token = localStorage.getItem("access_token")
      if (!token) router.replace("/auth/login")
    }
  }, [isMounted, user, authLoading, router])

  // --- Etkinlik türlerini & konumu al ---
  useEffect(() => {
    if (!isMounted || !user) return

    fetchEventTypes()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          // Başarılı: Gerçek konumu ayarla
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationReady(true) 
        },
        () => {
          // ✅ DÜZELTME: Hata durumunda varsayılan (fallback) konumu ayarla (Örn: İstanbul/İTÜ)
          setUserLocation({ lat: 41.1050, lng: 29.0250 }) 
          setLocationReady(true) 
        }
      )
    } else {
      // ✅ Konum servisi yoksa, yine de varsayılan konumu kullan
      setUserLocation({ lat: 41.1050, lng: 29.0250 })
      setLocationReady(true) 
    }
  }, [isMounted, user])

  
  // --- Etkinlikleri al ---
  useEffect(() => {
    if (!isMounted || !user || !locationReady) {
      return
    }
    fetchEvents()
  }, [isMounted, user, locationReady, page, selectedType, viewMode])


  const fetchEventTypes = async () => {
    try {
      const types = await api.getEventTypes()
      setEventTypes(types)
    } catch (err) {
      console.error("Failed to fetch event types:", err)
    }
  }

  const fetchEvents = async () => {
    setIsLoading(true)
    try {
      const params: any = { page, page_size: 12, sort: "starts_at", order: "asc" }

      if (viewMode === "nearby" && userLocation) {
        const response = await api.getNearbyEvents(userLocation.lat, userLocation.lng, 10, params)
        setEvents(response.items || [])
      } else {
        const filterParams: any = { ...params }
        if (selectedType !== "all") filterParams.type = selectedType
        if (searchQuery) filterParams.q = searchQuery
        if (dateFrom) filterParams.from = dateFrom
        if (dateTo) filterParams.to = dateTo

        const response =
          selectedType !== "all" || searchQuery || dateFrom || dateTo
            ? await api.filterEvents(filterParams)
            : await api.getEvents(params)

        setEvents(response.items || [])
      }
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPage(1)
    fetchEvents() 
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedType("all")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  if (!isMounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const hasActiveFilters = searchQuery || selectedType !== "all" || dateFrom || dateTo

  return (
      <main className="flex-1 bg-muted/30">
        <div className="container py-8">
          
          {/* ✅ DEĞİŞİKLİK: Başlık ve Buton bir araya alındı */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Discover Events</h1>
              <p className="text-muted-foreground">Find and join amazing campus events</p>
            </div>
            <Button asChild>
              <Link href="/events/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </div>

          {/* Tabs */}
          <Tabs
            value={viewMode}
            onValueChange={(v) => setViewMode(v as "all" | "nearby")}
            className="mb-6"
          >
            <TabsList>
              <TabsTrigger value="all">
                <Search className="mr-2 h-4 w-4" />
                All Events
              </TabsTrigger>
              <TabsTrigger value="nearby" disabled={!locationReady}>
                <Map className="mr-2 h-4 w-4" />
                Nearby Events {!userLocation && locationReady && "(Enable location)"}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder="Search events..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Select value={selectedType} onValueChange={(val) => setSelectedType(val)}>
                    <SelectTrigger className="w-full sm:w-[200px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {eventTypes.map((t) => (
                        <SelectItem key={t.id} value={t.code}>
                          {t.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row">
                  <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                  <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                  <Button type="submit">Apply</Button>
                  {hasActiveFilters && (
                    <Button type="button" variant="outline" onClick={clearFilters}>
                      Clear
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Map Overview */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Event Map</CardTitle>
              <CardDescription>Discover events across Istanbul at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <EventMap
                className="h-[320px] w-full overflow-hidden rounded-lg"
                events={events.map((event) => ({
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
                }))}
              />
            </CardContent>
          </Card>

          {/* Events */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
              <p className="mt-4 text-muted-foreground">Loading events...</p>
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No events found matching your criteria.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((ev) => (
                <Link key={ev.id} href={`/events/${ev.id}`}>
                  <Card className="h-full transition hover:shadow-md">
                    <CardHeader>
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{ev.event_type}</Badge>
                          {ev.join_method === "APPLICATION_ONLY" && (
                            <Badge variant="outline">Application Required</Badge>
                          )}
                        </div>
                        {ev.price > 0 && <Badge variant="outline">${ev.price}</Badge>}
                      </div>
                      <CardTitle>{ev.title}</CardTitle>
                      <CardDescription>{ev.explanation}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatEventDate(ev.starts_at)}
                      </div>
                      {ev.location_name && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {ev.location_name}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {ev.participant_count} participants
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
  )
}
