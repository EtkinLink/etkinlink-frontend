"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
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
// ✅ Katılım yöntemi seçimi için
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// İkonlar
import { ArrowLeft, AlertCircle } from "lucide-react"

// Üniversite tipi
interface University {
  id: number
  name: string
}

// Form verisi için tip
interface ClubFormData {
  name: string
  description: string
  university_id: string // Select'in value'su string olmalı
  join_method: "OPEN" | "APPLICATION_ONLY" // ✅ YENİ ALAN
}

export default function CreateClubPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [universities, setUniversities] = useState<University[]>([])
  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    description: "",
    university_id: "",
    join_method: "OPEN", // ✅ Varsayılan
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false) // Form gönderme state'i
  const [error, setError] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // 1. Mount state'ini ayarla
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 2. Auth kontrolü yap ve üniversiteleri çek
  useEffect(() => {
    if (!isMounted) return

    if (!authLoading && !user) {
      router.replace("/auth/login")
      return
    }

    // Kullanıcı giriş yapmışsa üniversiteleri çek
    const fetchUniversities = async () => {
      try {
        const unis = await api.getUniversities()
        setUniversities(unis)
        
        // Kullanıcının kendi üniversitesini formda önceden seç
        if (user && user.university_id) {
          setFormData(prev => ({
            ...prev,
            university_id: user.university_id!.toString()
          }))
        }
        
      } catch (err) {
        console.error("Failed to fetch universities:", err)
        setError("Universities could not be loaded.")
      }
    }
    
    if(user) {
      fetchUniversities()
    }
    
  }, [isMounted, user, authLoading, router])

  // Form inputlarını state'e bağla
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // Select (üniversite) değişimini state'e bağla
  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, university_id: value }))
  }
  
  // ✅ YENİ: RadioGroup değişimini state'e bağla
  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, join_method: value as "OPEN" | "APPLICATION_ONLY" }))
  }

  // Formu gönder
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    // Basit validasyon
    if (!formData.name) {
      setError("Club name is required.")
      setIsSubmitting(false)
      return
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
      }
      
      await api.createClub(payload)
      
      // Başarılı! Kulüpler sayfasına yönlendir.
      router.push(`/clubs`)
      
    } catch (err) {
      if (err instanceof APIError) {
        // 401 ise token geçersiz, giriş sayfasına yönlendir
        if (err.status === 401) {
          setError("Your session has expired. Please log in again.")
          setTimeout(() => {
            window.location.href = "/auth/login"
          }, 2000)
        } else {
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred. Please try again.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Auth yükleniyorsa veya mount olmadıysa bekle
  if (!isMounted || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        <div className="mb-6 max-w-2xl mx-auto">
          {/* Geri dön linki (Kulüpler sayfasına) */}
          <Button asChild variant="ghost">
            <Link href="/clubs">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clubs
            </Link>
          </Button>
        </div>

        {/* Ana Form Kartı */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Create a New Club</CardTitle>
            <CardDescription>
              Fill out the details below to register your student club.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Kulüp Adı */}
              <div className="space-y-2">
                <Label htmlFor="name">Club Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. ITU AI/ML Club"
                  required
                />
              </div>

              {/* Üniversite Seçimi */}
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Select
                  value={formData.university_id}
                  onValueChange={handleSelectChange}
                  required
                >
                  <SelectTrigger id="university">
                    <SelectValue placeholder="Select the club's university" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a university</SelectItem>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id.toString()}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* ✅ YENİ: Katılım Yöntemi (RadioGroup) */}
              <div className="space-y-3 rounded-md border p-4">
                <Label>Join Method</Label>
                <RadioGroup
                  value={formData.join_method}
                  onValueChange={handleRadioChange}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="OPEN" id="r_open" />
                    <Label htmlFor="r_open">Open</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="APPLICATION_ONLY" id="r_app" />
                    <Label htmlFor="r_app">Application Only</Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  {formData.join_method === 'OPEN'
                    ? "Anyone can join this club directly."
                    : "Users must apply and be approved by an admin."}
                </p>
              </div>

              {/* Açıklama */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="What is this club about?"
                  rows={4}
                />
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
                  {isSubmitting ? "Creating..." : "Create Club"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        
      </div>
    </div>
  )
}
