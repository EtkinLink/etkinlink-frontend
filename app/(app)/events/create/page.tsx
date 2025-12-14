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
import { ArrowLeft, AlertCircle } from "lucide-react"

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

              {/* --- Lokasyon ve Limit --- */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location_name">Location</Label>
                  <Input
                    id="location_name"
                    value={formData.location_name}
                    onChange={(e) => handleChange("location_name", e.target.value)}
                    placeholder="Event location"
                  />
                </div>

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
              </div>

              {/* --- GPS (Optional) --- */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude (Optional)</Label>
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
                  <Label htmlFor="longitude">Longitude (Optional)</Label>
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
