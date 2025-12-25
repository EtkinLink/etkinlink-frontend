"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"

// ✅ DÜZELTME: @/ alias'ları göreceli yollara çevrildi
import { useAuth } from "@/lib/auth-context"
import { api, APIError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert" // Hata mesajı için
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group" // Yeni bileşen

// İkonlar
import { ArrowLeft, AlertCircle, Search, MapPin, Loader2 } from "lucide-react"

// --- YENİ ARAYÜZLER ---
interface MyClub {
  id: number
  name: string
  role: 'ADMIN' | 'MEMBER'
}

interface EventFormData {
  title: string
  explanation: string
  price: string
  starts_at: string
  ends_at: string
  location_name: string
  user_limit: string
  type_id: string
  latitude: string
  longitude: string
  // ✅ YENİ: Katılım Yöntemi
  club_id: string
  join_method: "DIRECT_JOIN" | "APPLICATION_ONLY"
}

// Nominatim API Response
interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  address?: {
    country?: string
    city?: string
    town?: string
    village?: string
  }
}
// ----------------------

export default function CreateEventPage() {
  const { user, isLoading: authLoading } = useAuth()
  // const router = useRouter() // ✅ DÜZELTME: Kaldırıldı

  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [myClubs, setMyClubs] = useState<MyClub[]>([]) // ✅ YENİ

  // Filter clubs where user is ADMIN
  const adminClubs = myClubs.filter((club) => club.role === 'ADMIN')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null) // Hata mesajı state'i

  // Location search states
  const [locationSearch, setLocationSearch] = useState("")
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    explanation: "",
    price: "0",
    starts_at: "",
    ends_at: "",
    location_name: "",
    user_limit: "",
    type_id: "none", // Varsayılan tip ID; liste geldikten sonra güncellenecek
    latitude: "",
    longitude: "",
    // ✅ YENİ
    club_id: "none",
    join_method: "DIRECT_JOIN",
  })

  const [onlyGirls, setOnlyGirls] = useState(false)

  // Debounce for location search
  useEffect(() => {
    if (!locationSearch || locationSearch.trim().length < 3) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timer = setTimeout(() => {
      searchLocation(locationSearch)
    }, 500) // Wait 500ms after user stops typing

    return () => clearTimeout(timer)
  }, [locationSearch])

  // Veri çekme ve Auth kontrolü
  useEffect(() => {
    // Auth yüklenirken yönlendirme yapma; F5 sonrası token kaybı yaşıyorduk
    if (authLoading) return
    if (!user) {
      window.location.href = "/auth/login"
      return
    }
    fetchDropdownData()
  }, [user, authLoading])

  const fetchDropdownData = async () => {
    // Event type'ları kulüp isteği bozulsa bile çekebilmek için ayrı ayrı yakala
    api.getEventTypes()
      .then((types) => {
        const list = types ?? []
        setEventTypes(list)
        // İlk event tipini otomatik seç
        if (list.length > 0) {
          setFormData((prev) => ({
            ...prev,
            type_id: prev.type_id !== "none" ? prev.type_id : String(list[0].id ?? ""),
          }))
        }
      })
      .catch((err) => console.error("Failed to fetch event types:", err))

    api.getMyClubs()
      .then((clubs) => {
        console.log("🔍 getMyClubs returned:", clubs)
        console.log("🔍 Admin clubs:", clubs?.filter((c) => c.role === 'ADMIN'))
        setMyClubs(clubs ?? [])
      })
      .catch((err) => console.warn("Kulüp listesi alınamadı, kişisel modda devam:", err))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null) // Hata mesajını temizle

    try {
      // Basit validasyon
      if (!formData.title || !formData.explanation || !formData.starts_at) {
        throw new Error("Title, description, and start date are required.")
      }
      if (!formData.type_id || formData.type_id === "none") {
        throw new Error("Event type is required.")
      }

      const requiresApplication = formData.join_method === "APPLICATION_ONLY"

      const formatForBackend = (value: string | null) => {
        if (!value) return null
        // datetime-local'dan gelen değeri (YYYY-MM-DDTHH:mm) doğrudan kullan, saniye ekle
        // Z'li ISO'ya çevirmiyoruz; MySQL DATETIME için 'YYYY-MM-DD HH:mm:ss' yeterli
        const withSpace = value.replace("T", " ")
        return withSpace.length === 16 ? `${withSpace}:00` : withSpace // saniye yoksa ekle
      }

      const payload: any = {
        title: formData.title,
        explanation: formData.explanation,
        price: Number.parseFloat(formData.price) || 0,
        starts_at: formatForBackend(formData.starts_at),
        ends_at: formatForBackend(formData.ends_at),
        location_name: formData.location_name || null,
        user_limit: formData.user_limit ? Number.parseInt(formData.user_limit) : null,
        type_id: formData.type_id && formData.type_id !== "none" ? Number.parseInt(formData.type_id) : undefined,
        latitude: formData.latitude ? Number.parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? Number.parseFloat(formData.longitude) : null,
        owner_type: formData.club_id && formData.club_id !== "none" ? "ORGANIZATION" : "USER",
        organization_id: formData.club_id && formData.club_id !== "none" ? Number.parseInt(formData.club_id) : null,
        has_register: requiresApplication,
        is_participants_private: false,
        only_girls: onlyGirls,
      }

      console.log("Creating event with payload:", payload)
      console.log("Auth token exists:", !!user)

      await api.createEvent(payload)
      window.location.href = `/events`

    } catch (error: any) {
      console.error("Event creation error:", error)
      if (error instanceof APIError) {
        // 401 will be handled by global unauthorized handler
        if (error.status !== 401) {
          setError(error.message)
        }
      } else {
        setError(error.message || "Failed to create event")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: keyof EventFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ✅ YENİ: RadioGroup için handler
  const handleRadioChange = (value: string) => {
    setFormData((prev) => ({ ...prev, join_method: value as "DIRECT_JOIN" | "APPLICATION_ONLY" }))
  }

  // Location search with Nominatim API
  const searchLocation = async (query: string) => {
    setIsSearching(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `q=${encodeURIComponent(query)}&` +
        `format=json&` +
        `addressdetails=1&` +
        `limit=10`, // Increased from 5 to 10, removed country restriction
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'EtkinLink Event Platform' // Required by Nominatim
          }
        }
      )
      const data = await response.json()
      setSearchResults(data)
      setShowResults(true)
    } catch (err) {
      console.error("Location search error:", err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const selectLocation = (result: NominatimResult) => {
    // Only set coordinates, let user write their own location name
    setFormData((prev) => ({
      ...prev,
      latitude: result.lat,
      longitude: result.lon,
    }))
    setLocationSearch("")
    setShowResults(false)
    setSearchResults([])
  }

  if (authLoading) {
    return null
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Geri Dön Butonu */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/events">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Link>
        </Button>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Fill in the details to create your event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* --- Başlık ve Açıklama --- */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Description *</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => handleChange("explanation", e.target.value)}
                  required
                  placeholder="Describe your event"
                  rows={4}
                />
              </div>
              
              {/* --- Tipi, Fiyatı ve Kulübü Yan Yana --- */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="type_id">Event Type</Label>
                  <Select value={formData.type_id} onValueChange={(value) => handleChange("type_id", value)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem> {/* Varsayılan değer */}
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="club_id">Organizing Club</Label>
                  <Select value={formData.club_id} onValueChange={(value) => handleChange("club_id", value)}>
                    <SelectTrigger><SelectValue placeholder="Select club (Admin only)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Personal)</SelectItem>
                      {adminClubs.map((club) => (
                        <SelectItem key={club.id} value={club.id.toString()}>{club.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* ✅ YENİ: Katılım Yöntemi (Tam satır kaplar) */}
              <div className="space-y-3 rounded-md border p-4">
                <Label>Join Method</Label>
                <RadioGroup
                  value={formData.join_method}
                  onValueChange={handleRadioChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="DIRECT_JOIN" id="r_direct" />
                    <Label htmlFor="r_direct">Direct Join</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="APPLICATION_ONLY" id="r_app" />
                    <Label htmlFor="r_app">Application Only</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  {formData.join_method === 'DIRECT_JOIN'
                    ? "Anyone can join until the limit is reached."
                    : "Users must apply and be approved by you."}
                </p>
              </div>

              {/* Only Girls Checkbox */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="only_girls"
                  checked={onlyGirls}
                  onChange={(e) => setOnlyGirls(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="only_girls" className="font-normal cursor-pointer">
                  Only for female participants
                </Label>
              </div>

              <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    required
                  />
                </div>

              {/* --- Tarih ve Zaman --- */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Start Date & Time *</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => handleChange("starts_at", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ends_at">End Date & Time</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => handleChange("ends_at", e.target.value)}
                  />
                </div>
              </div>

              {/* --- Lokasyon Arama --- */}
              <div className="space-y-2">
                <Label htmlFor="location_search">Search Location</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location_search"
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                    onFocus={() => searchResults.length > 0 && setShowResults(true)}
                    placeholder="Search for a location (e.g., İTÜ Ayazağa)"
                    className="pl-9"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showResults && searchResults.length > 0 && (
                  <div className="relative">
                    <div className="absolute z-10 w-full mt-1 bg-card border rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          onClick={() => selectLocation(result)}
                          className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0 flex items-start gap-2"
                        >
                          <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {result.lat}, {result.lon}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showResults && searchResults.length === 0 && locationSearch.length >= 3 && !isSearching && (
                  <p className="text-sm text-muted-foreground">No locations found. Try a different search.</p>
                )}
              </div>

              {/* Selected Location Display */}
              {formData.location_name && (
                <div className="rounded-md bg-primary/5 border border-primary/20 p-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">Selected Location</p>
                      <p className="text-xs text-muted-foreground mt-1">{formData.location_name}</p>
                      {formData.latitude && formData.longitude && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📍 {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setFormData((prev) => ({ ...prev, location_name: "", latitude: "", longitude: "" }))
                        setLocationSearch("")
                        setSearchResults([])
                      }}
                      className="text-xs"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {/* Participant Limit */}
              <div className="space-y-2">
                <Label htmlFor="user_limit">Participant Limit</Label>
                <Input
                  id="user_limit"
                  type="number"
                  min="1"
                  value={formData.user_limit}
                  onChange={(e) => handleChange("user_limit", e.target.value)}
                  placeholder="Optional"
                />
              </div>

              {/* --- Manual GPS (Advanced, Optional) --- */}
              <details className="group">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors list-none flex items-center gap-2">
                  <span>⚙️ Advanced: Manual Coordinates</span>
                  <span className="text-xs">(Optional - use search above instead)</span>
                </summary>
                <div className="grid gap-4 sm:grid-cols-2 mt-3 p-4 border rounded-md bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      value={formData.latitude}
                      onChange={(e) => handleChange("latitude", e.target.value)}
                      placeholder="e.g. 41.085"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      value={formData.longitude}
                      onChange={(e) => handleChange("longitude", e.target.value)}
                      placeholder="e.g. 29.023"
                    />
                  </div>
                </div>
              </details>
              
              {/* --- Hata Mesajı --- */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* --- Butonlar --- */}
              <div className="flex gap-4">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? "Creating..." : "Create Event"}
                </Button>
                <Button asChild type="button" variant="outline" className="flex-1 bg-transparent">
                  <Link href="/events">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
