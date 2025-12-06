"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, APIError } from "@/lib/api-client"
import Link from "next/link"

// Bileşenler
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"

// İkonlar
import { ArrowLeft, AlertCircle } from "lucide-react"

// --- ARAYÜZLER (TYPES) ---
interface EventType {
  id: number
  code: string
}

interface MyClub {
  id: number
  name: string
  role: 'ADMIN' | 'MEMBER'
}

// Form verisi için tip
interface EventFormData {
  title: string
  explanation: string
  price: string
  starts_at: string
  location_name: string
  user_limit: string
  type_id: string
  club_id: string
}

// API'dan gelen ISO tarihini (2025-10-31T18:00:00Z)
// <input type="datetime-local"> formatına (2025-10-31T21:00) çevirir
function formatISOToInput(isoString: string | null): string {
  if (!isoString) return ""
  try {
    const date = new Date(isoString)
    // UTC'den lokal saate çevir (input bunu bekler)
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
    // YYYY-MM-DDTHH:MM formatına getir
    return date.toISOString().slice(0, 16)
  } catch {
    return ""
  }
}

export default function EditEventPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const eventId = params.id ? Number(params.id) : null

  // Dropdown verileri
  const [eventTypes, setEventTypes] = useState<EventType[]>([])
  const [myClubs, setMyClubs] = useState<MyClub[]>([])
  
  // Form state'i
  const [formData, setFormData] = useState<EventFormData>({
    title: "",
    explanation: "",
    price: "0",
    starts_at: "",
    location_name: "",
    user_limit: "",
    type_id: "none",
    club_id: "none",
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false) // Form gönderme
  const [isPageLoading, setIsPageLoading] = useState(true) // Sayfa yükleme
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Ana veri yükleme effect'i
  useEffect(() => {
    if (!isMounted || !user || !eventId) return

    // Auth kontrolü
    if (!authLoading && !user) {
      router.replace("/auth/login")
      return
    }

    const loadPageData = async () => {
      setIsPageLoading(true)
      try {
        // 3 isteği aynı anda yap (etkinlik, tipler, kulüpler)
        const [eventData, typesData, clubsData] = await Promise.all([
          api.getEvent(eventId),
          api.getEventTypes(),
          api.getMyClubs(), // Kullanıcının admin olduğu kulüpleri seçmek için
        ])

        // --- Yetki Kontrolü (ÖNEMLİ) ---
        // Kullanıcı, etkinliğin sahibi mi?
        const isOwner = user.id === eventData.owner_user_id
        // Kullanıcı, etkinliğin kulübünde admin mi?
        const isAdmin = clubsData.some(
          (c: MyClub) => c.id === (eventData.owner_organization_id ?? eventData.club_id) && c.role === 'ADMIN'
        )

        // Sahibi veya admin değilse, düzenlemesine izin verme
        if (!isOwner && !isAdmin) {
          alert("You are not authorized to edit this event.")
          router.push(`/events/${eventId}`)
          return
        }

        // --- Formu Doldur ---
        setFormData({
          title: eventData.title,
          explanation: eventData.explanation,
          price: eventData.price.toString(),
          starts_at: formatISOToInput(eventData.starts_at),
          location_name: eventData.location_name || "",
          user_limit: eventData.user_limit?.toString() || "",
          type_id: eventData.type_id?.toString() || "none",
          club_id: (eventData.owner_organization_id ?? eventData.club_id)?.toString() || "none",
        })

        // Dropdown'ları doldur
        setEventTypes(typesData)
        setMyClubs(clubsData)

      } catch (err) {
        console.error("Failed to load event data:", err)
        setError("Failed to load event data. Maybe the event doesn't exist.")
        // Etkinlik bulunamazsa (404) geri yönlendir
        if (err instanceof APIError && err.status === 404) {
          router.push("/events")
        }
      } finally {
        setIsPageLoading(false)
      }
    }
    
    loadPageData()
    
  }, [isMounted, user, authLoading, eventId, router])


  // Form inputlarını state'e bağla
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Select (dropdown) değişimini state'e bağla
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Formu gönder
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!eventId) return
    
    setIsSubmitting(true)
    setError(null)

    try {
      // API'ın beklediği formata geri çevir
      const payload = {
        title: formData.title,
        explanation: formData.explanation,
        price: Number(formData.price) || 0,
        starts_at: new Date(formData.starts_at).toISOString(),
        location_name: formData.location_name || null,
        user_limit: formData.user_limit ? Number(formData.user_limit) : null,
        type_id: formData.type_id !== "none" ? Number(formData.type_id) : null,
      }
      
      // ✅ API'ı ÇAĞIR: Create yerine UPDATE kullan
      await api.updateEvent(eventId, payload)
      
      // Başarılı! Detay sayfasına geri yönlendir.
      router.push(`/events/${eventId}`)
      
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
  
  // Sayfa verisi (etkinlik, tipler, kulüpler) yükleniyorsa...
  if (!isMounted || isPageLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading event data...</p>
        </div>
      </div>
    )
  }

  // Sadece kullanıcının admin olduğu kulüpleri filtrele (etkinliği başka kulübe taşıyamasın)
  const adminClubs = myClubs.filter(c => c.role === 'ADMIN')

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        <div className="mb-6 max-w-2xl mx-auto">
          {/* Geri dön linki (etkinlik detayına) */}
          <Button asChild variant="ghost">
            <Link href={eventId ? `/events/${eventId}` : '/events'}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Event
            </Link>
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Event</CardTitle>
            <CardDescription>
              Update the details for your event.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Etkinlik Adı */}
              <div className="space-y-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>
              
              {/* Etkinlik Tipi (Select) */}
              <div className="space-y-2">
                <Label htmlFor="type_id">Event Type</Label>
                <Select
                  value={formData.type_id}
                  onValueChange={(value) => handleSelectChange("type_id", value)}
                >
                  <SelectTrigger id="type_id">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kulüp (Select) */}
              <div className="space-y-2">
                <Label htmlFor="club_id">Organizing Club (Optional)</Label>
                <Select
                  value={formData.club_id}
                  onValueChange={(value) => handleSelectChange("club_id", value)}
                >
                  <SelectTrigger id="club_id">
                    <SelectValue placeholder="Select a club you manage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Personal Event)</SelectItem>
                    {adminClubs.map((club) => (
                      <SelectItem key={club.id} value={club.id.toString()}>
                        {club.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Açıklama */}
              <div className="space-y-2">
                <Label htmlFor="explanation">Description</Label>
                <Textarea
                  id="explanation"
                  name="explanation"
                  value={formData.explanation}
                  onChange={handleChange}
                  rows={5}
                />
              </div>

              {/* Tarih & Saat */}
              <div className="space-y-2">
                <Label htmlFor="starts_at">Start Date and Time</Label>
                <Input
                  id="starts_at"
                  name="starts_at"
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Lokasyon */}
              <div className="space-y-2">
                <Label htmlFor="location_name">Location</Label>
                <Input
                  id="location_name"
                  name="location_name"
                  value={formData.location_name}
                  onChange={handleChange}
                  placeholder="e.g. SDKM, ITU Ayazaga"
                />
              </div>

              {/* Fiyat ve Limit (Yan yana) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="user_limit">Participant Limit (Optional)</Label>
                  <Input
                    id="user_limit"
                    name="user_limit"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.user_limit}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                  />
                </div>
              </div>

              {/* Hata Mesajı Alanı */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Gönder Butonu */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
