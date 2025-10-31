"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Users, Calendar, University, User, Info } from "lucide-react"

// --- ARAYÜZLER (TYPES) ---

// Kulübün kendi etkinlikleri (api.getClub'dan gelir)
interface ClubEvent {
  id: number
  title: string
  starts_at: string
}

// Kulüp detay verisi (api.getClub'dan gelir)
interface ClubDetail {
  id: number
  name: string
  description: string | null
  owner_user_id: number
  owner_username: string
  university_name: string
  member_count: number
  events: ClubEvent[]
}

// Kullanıcının üye olduğu kulüp (api.getMyClubs'dan gelir)
interface MyClub {
  id: number
  name: string
  role: 'ADMIN' | 'MEMBER'
}

// Tarih formatlayıcı
function formatEventDate(iso: string | null) {
  if (!iso) return "N/A"
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso))
}

export default function ClubDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams() // URL'den parametreleri al
  const clubId = params.id ? Number(params.id) : null

  const [club, setClub] = useState<ClubDetail | null>(null)
  const [myClubs, setMyClubs] = useState<MyClub[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isJoining, setIsJoining] = useState(false) // Katıl/Ayrıl butonu için
  const [isMounted, setIsMounted] = useState(false)

  // 1. Hydration için
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 2. Ana veri yükleme effect'i
  useEffect(() => {
    // Sadece istemcide ve ID varsa çalış
    if (!isMounted || !clubId) return

    const fetchClubData = async () => {
      setIsLoading(true)
      try {
        const clubData = await api.getClub(clubId)
        setClub(clubData)
      } catch (err) {
        console.error("Failed to fetch club data:", err)
        // Kulüp bulunamazsa (404) veya hata olursa kulüpler sayfasına geri dön
        router.push("/clubs")
      } finally {
        setIsLoading(false)
      }
    }

    const fetchMyMembership = async () => {
      if (!user) return // Kullanıcı giriş yapmamışsa üyelik durumunu kontrol etme
      try {
        const clubs = await api.getMyClubs()
        setMyClubs(clubs)
      } catch (err) {
        console.error("Failed to fetch user's clubs:", err)
      }
    }

    fetchClubData()
    fetchMyMembership()
    
  }, [isMounted, clubId, user, router]) // 'user' değiştiğinde de (login/logout) üyelik durumunu yenile

  
  // --- EVENT HANDLERS ---

  const handleJoin = async () => {
    if (!user) {
      router.push("/auth/login") // Giriş yapmamışsa login'e yönlendir
      return
    }
    if (!clubId) return

    setIsJoining(true)
    try {
      await api.joinClub(clubId)
      // Durumu anında güncellemek için 'myClubs' listesine manuel ekle
      setMyClubs([...myClubs, { id: clubId, name: club!.name, role: 'MEMBER' }])
      // Üye sayısını da anında artır
      setClub(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null)
    } catch (err) {
      console.error("Failed to join club:", err)
    } finally {
      setIsJoining(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !clubId) return

    setIsJoining(true)
    try {
      await api.leaveClub(clubId)
      // Durumu anında güncellemek için 'myClubs' listesinden çıkar
      setMyClubs(myClubs.filter(c => c.id !== clubId))
      // Üye sayısını da anında azalt
      setClub(prev => prev ? { ...prev, member_count: prev.member_count - 1 } : null)
    } catch (err) {
      console.error("Failed to leave club:", err)
    } finally {
      setIsJoining(false)
    }
  }

  // --- RENDER ---

  // Kullanıcının bu kulübe üye olup olmadığını kontrol et
  const isMember = myClubs.some(c => c.id === clubId)

  if (isLoading || !club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading club...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        {/* Geri Dön Butonu */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/clubs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Link>
        </Button>

        {/* Ana Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Sol Sütun: Kulüp Bilgisi */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-2xl">{club.name}</CardTitle>
                  <CardDescription>{club.university_name}</CardDescription>
                </div>
                {isMember ? (
                  <Button 
                    variant="outline" 
                    onClick={handleLeave} 
                    disabled={isJoining}
                  >
                    {isJoining ? "Leaving..." : "Leave Club"}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleJoin} 
                    disabled={isJoining}
                  >
                    {isJoining ? "Joining..." : "Join Club"}
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{club.member_count} members</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Owner: {club.owner_username}</span>
                </div>
                <div className="flex items-start gap-2 text-muted-foreground">
                  <Info className="h-4 w-4 flex-shrink-0 mt-1" />
                  <p className="text-sm">
                    {club.description || "No description provided."}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Sütun: Kulüp Etkinlikleri */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Club Events</CardTitle>
                <CardDescription>Events organized by {club.name}</CardDescription>
              </CardHeader>
              <CardContent>
                {club.events.length === 0 ? (
                  <p className="text-center text-muted-foreground">No events found for this club.</p>
                ) : (
                  <div className="space-y-4">
                    {club.events.map((event) => (
                      <Link key={event.id} href={`/events/${event.id}`}>
                        <Card className="transition-shadow hover:shadow-md">
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold">{event.title}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                <span>{formatEventDate(event.starts_at)}</span>
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
