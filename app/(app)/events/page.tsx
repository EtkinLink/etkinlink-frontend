"use client"

import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api-client"
import Link from "next/link"
import { useI18n, getDateLocale } from "@/lib/i18n"
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Map,
  Plus, 
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

// Types
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

// Date formatter
function formatEventDate(iso: string, dateLocale: string) {
  return new Intl.DateTimeFormat(dateLocale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(iso))
}

export default function EventsPage() {
  const PER_PAGE = 6
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const { t, locale } = useI18n()
  const dateLocale = getDateLocale(locale)

  const [events, setEvents] = useState<Event[]>([])
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [showCompletedEvents, setShowCompletedEvents] = useState(false)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"all" | "nearby">("all")
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  const [isMounted, setIsMounted] = useState(false)
  const [locationReady, setLocationReady] = useState(false)

  // --- Mounting Check ---
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // --- Auth Check ---
  useEffect(() => {
    if (isMounted && !authLoading && !user) {
      const token = localStorage.getItem("access_token")
      if (!token) router.replace("/auth/login")
    }
  }, [isMounted, user, authLoading, router])

  // --- Fetch Types & Location ---
  useEffect(() => {
    if (!isMounted || !user) return

    fetchEventTypes()

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationReady(true) 
        },
        () => {
          // Fallback location (Istanbul/ITU)
          setUserLocation({ lat: 41.1050, lng: 29.0250 }) 
          setLocationReady(true) 
        }
      )
    } else {
      setUserLocation({ lat: 41.1050, lng: 29.0250 })
      setLocationReady(true) 
    }
  }, [isMounted, user])

  const fetchEventTypes = async () => {
    try {
      const types = await api.getEventTypes()
      setEventTypes(types)
    } catch (err) {
      console.error("Failed to fetch event types:", err)
    }
  }

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      // Fetch more events to handle client-side filtering with pagination
      const params: any = { page: 1, per_page: 100, sort: "starts_at", order: "desc" }

      // Filtreleme parametrelerini ekle
      if (selectedType !== "all") params.type_id = selectedType
      if (searchQuery) params.q = searchQuery
      if (dateFrom) params.starts_at_from = dateFrom
      if (dateTo) params.starts_at_to = dateTo

      let allEvents: Event[] = []

      if (viewMode === "nearby" && userLocation) {
        const response = await api.getNearbyEvents(userLocation.lat, userLocation.lng, 10, params)
        allEvents = response.items || []
      } else {
        const response = await api.getEvents(params)
        allEvents = response.items || []
      }

      // Client-side status filtering
      const filteredEvents = showCompletedEvents
        ? allEvents.filter((ev: Event) =>
            ev.status === "COMPLETED" || ev.status === "CANCELLED"
          )
        : allEvents.filter((ev: Event) =>
            ev.status !== "COMPLETED" && ev.status !== "CANCELLED"
          )

      // Client-side pagination
      const startIndex = (page - 1) * PER_PAGE
      const endIndex = startIndex + PER_PAGE
      const paginatedEvents = filteredEvents.slice(startIndex, endIndex)

      setEvents(paginatedEvents)
    } catch (err) {
      console.error("Failed to fetch events:", err)
    } finally {
      setIsLoading(false)
    }
  }, [page, viewMode, userLocation, selectedType, searchQuery, dateFrom, dateTo, showCompletedEvents])

  // --- Fetch Events ---
  useEffect(() => {
    if (!isMounted || !user || !locationReady) {
      return
    }
    fetchEvents()
  }, [isMounted, user, locationReady, page, selectedType, viewMode, fetchEvents]) // Dependencies güncellendi

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
    setShowCompletedEvents(false)
    setPage(1)
  }

  if (!isMounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const hasActiveFilters = searchQuery || selectedType !== "all" || dateFrom || dateTo || showCompletedEvents

  return (
    <main className="flex-1 bg-muted/30 min-h-screen">
      <div className="container py-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("events.title")}</h1>
            <p className="text-muted-foreground">{t("events.subtitle")}</p>
          </div>
          <Button asChild>
            <Link href="/events/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("events.create")}
            </Link>
          </Button>
        </div>

        {/* Tabs Section */}
        <Tabs
          value={viewMode}
          onValueChange={(v) => setViewMode(v as "all" | "nearby")}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="all">
              <Search className="mr-2 h-4 w-4" />
              {t("events.tabs.all")}
            </TabsTrigger>
            <TabsTrigger value="nearby" disabled={!locationReady}>
              <Map className="mr-2 h-4 w-4" />
              {t("events.tabs.nearby")} {!userLocation && locationReady && t("events.tabs.enableLocation")}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* MAIN LAYOUT GRID 
            lg:grid-cols-12 kullanarak daha hassas kontrol sağlıyoruz.
            items-start: Sağ tarafın (Sticky) çalışması için kritik.
        */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          
          {/* SOL KOLON (Etkinlik Listesi) 
             Masaüstünde 7 birim yer kaplar.
             Mobilde 'order-2' diyerek Filtrelerden sonra gelmesini sağlayabiliriz (isteğe bağlı).
             Şimdilik standart akışta bırakıyorum.
          */}
          <div className="space-y-6 lg:col-span-7 xl:col-span-8">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                <p className="mt-4 text-muted-foreground">{t("events.loading")}</p>
              </div>
            ) : events.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {t("events.empty")}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2">
                  {events.map((ev) => (
                    <Link key={ev.id} href={`/events/${ev.id}`}>
                      <Card className="h-full transition hover:shadow-md hover:border-indigo-200">
                        <CardHeader>
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary">{ev.event_type}</Badge>
                              {ev.join_method === "APPLICATION_ONLY" && (
                                <Badge variant="outline">{t("events.card.applicationRequired")}</Badge>
                              )}
                            </div>
                            {ev.price > 0 ? (
                              <Badge variant="outline" className="border-green-600 text-green-600">${ev.price}</Badge>
                            ) : (
                              <Badge variant="outline" className="border-blue-600 text-blue-600">{t("common.free")}</Badge>
                            )}
                          </div>
                          <CardTitle className="line-clamp-1">{ev.title}</CardTitle>
                          <CardDescription className="line-clamp-2">{ev.explanation}</CardDescription>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span>{formatEventDate(ev.starts_at, dateLocale)}</span>
                          </div>
                          {ev.location_name && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 shrink-0" />
                              <span className="truncate">{ev.location_name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" />
                            <span>{t("common.participants", { count: ev.participant_count })}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3 pt-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t("common.previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground">{t("common.page", { page })}</span>
                  <Button
                    variant="outline"
                    disabled={events.length < PER_PAGE}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("common.next")}
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* SAĞ KOLON (Filtreler ve Harita)
             Masaüstünde 5 birim yer kaplar.
             Sticky: Kaydırma yaparken sabit kalır.
          */}
          <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 h-fit">
            
            {/* Filter Card */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t("common.filters")}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      className="pl-9"
                      placeholder={t("events.filters.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <Select value={selectedType} onValueChange={(val) => setSelectedType(val)}>
                    <SelectTrigger className="w-full">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue placeholder={t("events.filters.eventType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("events.filters.allTypes")}</SelectItem>
                      {eventTypes.map((t) => (
                        <SelectItem key={t.id} value={t.code}>
                          {t.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t("common.from")}</span>
                      <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">{t("common.to")}</span>
                      <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <input
                      type="checkbox"
                      id="showCompleted"
                      checked={showCompletedEvents}
                      onChange={(e) => setShowCompletedEvents(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="showCompleted" className="text-sm cursor-pointer">
                      Show Only Completed Events
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" className="flex-1">{t("common.applyFilters")}</Button>
                    {hasActiveFilters && (
                      <Button type="button" variant="outline" onClick={clearFilters}>
                        {t("common.clear")}
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Map Card */}
            <Card className="shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5" /> 
                  {t("events.map.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-6 sm:pt-0">
                <EventMap
                  // Sticky modda harita çok uzun olursa ekranı taşabilir, bu yüzden max-height veya sabit height veriyoruz.
                  className="w-full h-[400px] lg:h-[500px] overflow-hidden sm:rounded-md"
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

          </div>
        </div>
      </div>
    </main>
  )
}
