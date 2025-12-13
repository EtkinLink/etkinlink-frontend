"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// ✅ YENİ: İkonlar eklendi
import { ArrowLeft, Users, Calendar, University, User, Info, UserPlus, UserMinus, FileText, Clock, Check, Settings, Edit2, X } from "lucide-react"
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

// --- ARAYÜZLER (TYPES) ---

interface ClubEvent {
  id: number
  title: string
  starts_at: string
}

interface ClubDetail {
  id: number
  name: string
  description: string | null
  owner_user_id: number | null // Backend şu an owner id göndermediği için null gelebilir
  owner_username: string
  university_name: string
  member_count: number
  join_method: "OPEN" | "APPLICATION_ONLY" // ✅ YENİ ALAN
  events: ClubEvent[]
}

// ✅ GÜNCELLEME: Backend'e uygun statü tipi
type ApplicationStatus = 'MEMBER' | 'ADMIN' | 'PENDING' | null

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
  // const router = useRouter() // ✅ DÜZELTME
  // const params = useParams() // ✅ DÜZELTME
  
  // ✅ DÜZELTME: ID'yi URL'den almak için state eklendi
  const [clubId, setClubId] = useState<number | null>(null)
  
  const [club, setClub] = useState<ClubDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false) // Bütün butonlar için
  const [isMounted, setIsMounted] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<ApplicationStatus>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // 1. Hydration ve URL'den ID'yi çekme
  useEffect(() => {
    setIsMounted(true)
    // ✅ DÜZELTME: useParams() yerine window.location kullan
    try {
      // (örn: "/clubs/123")
      const pathSegments = window.location.pathname.split('/')
      const idStr = pathSegments[pathSegments.length - 1]
      const id = Number(idStr)
      if (id && !isNaN(id)) {
        setClubId(id)
      } else {
        console.error("Invalid Club ID from URL")
        window.location.href = "/clubs" // Hatalı ID ise kulüpler sayfasına at
      }
    } catch (e) {
      console.error(e)
      window.location.href = "/clubs"
    }
  }, []) // Sadece mount anında çalışır

  // 2. Ana kulüp verisini çek
  useEffect(() => {
    if (!isMounted || !clubId) return

    const fetchClubData = async () => {
      setIsLoading(true)
      try {
        const clubData = await api.getClub(clubId)
        setClub(clubData)
      } catch (err) {
        console.error("Failed to fetch club data:", err)
        window.location.href = "/clubs" // Kulüp bulunamazsa (404)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClubData()
    
  }, [isMounted, clubId])

  // 3. Kullanıcı veya Kulüp değiştiğinde, üyelik/başvuru durumunu çek
  useEffect(() => {
    if (!isMounted || !clubId || !user) {
      setMembershipStatus(null) // Kullanıcı giriş yapmamışsa durumu sıfırla
      return
    }

    const fetchMembershipStatus = async () => {
      try {
        // ✅ GÜNCELLEME: Backend'e eklediğimiz yeni endpoint'i çağır
        const statusData = await api.getMyClubApplicationStatus(clubId)
        let status: ApplicationStatus = statusData.status
        // Owner isen otomatik ADMIN kabul et
        if (club && club.owner_username && club.owner_username === user.username) {
          status = "ADMIN"
        }
        setMembershipStatus(status)
      } catch (err) {
        console.error("Failed to fetch membership status:", err)
      }
    }
    
    fetchMembershipStatus()

  }, [isMounted, clubId, user, club])

  
  // --- EVENT HANDLERS ---

  const handleJoin = async () => {
    if (!user) { window.location.href = "/auth/login"; return } 
    if (!clubId) return

    setIsActionLoading(true)
    try {
      await api.joinClub(clubId)
      setMembershipStatus('MEMBER') // Durumu anında güncelle
      setClub(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null)
    } catch (err: any) {
      alert(err.message || "Failed to join club")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !clubId) return

    setIsActionLoading(true)
    try {
      await api.leaveClub(clubId)
      setMembershipStatus(null) // Durumu anında güncelle
      setClub(prev => prev ? { ...prev, member_count: prev.member_count - 1 } : null)
    } catch (err: any) {
      alert(err.message || "Failed to leave club")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) { window.location.href = "/auth/login"; return }
    if (!clubId) return

    setIsActionLoading(true)
    try {
      // Not: "why_me" (neden ben?) alanı için bir modal/popup açılabilir
      await api.createClubApplication(clubId)
      alert("Application submitted! Please wait for approval.")
      setMembershipStatus("PENDING")
    } catch (err: any) {
      // Eğer backend "Already applied" ile 409 dönerse durumu beklemede göster
      if (err?.status === 409) {
        setMembershipStatus("PENDING")
        alert("You already have a pending application.")
      } else {
        alert(err.message || "Failed to submit application")
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!clubId) return
    setIsDeleting(true)
    try {
      await api.deleteClub(clubId)
      window.location.href = "/clubs"
    } catch (error: any) {
      alert(error.message || "Failed to delete club")
      setIsDeleting(false)
    }
  }


  // --- Katıl/Ayrıl Butonunu Render Et ---
  const renderJoinButton = () => {
    // 1. Durum: Giriş yapmamış
    if (!user) {
      return (
        <Button onClick={() => window.location.href = "/auth/login"} className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          Login to Join or Apply
        </Button>
      )
    }
    
    // 2. Durum: Kullanıcı ADMIN (veya Sahip)
    // ✅ DÜZELTME: Backend'den 'ADMIN' rolü geliyorsa Yönet ve Edit butonlarını göster
    if (membershipStatus === 'ADMIN') {
      return (
        <div className="space-y-2">
          <Button asChild className="w-full" variant="secondary">
            <a href={`/clubs/${clubId}/manage`}> 
              <Settings className="mr-2 h-4 w-4" />
              Manage Club
            </a>
          </Button>
          <Button asChild className="w-full" variant="outline">
            <a href={`/clubs/${clubId}/edit`}> 
               Edit Club
            </a>
          </Button>
        </div>
      )
    }

    // 3. Durum: Kullanıcı normal MEMBER (Üye)
    if (membershipStatus === 'MEMBER') {
      return (
        <Button 
          variant="outline" 
          onClick={handleLeave} 
          disabled={isActionLoading}
          className="w-full"
        >
          <UserMinus className="mr-2 h-4 w-4" />
          {isActionLoading ? "Leaving..." : "Leave Club"}
        </Button>
      )
    }

    // 4. Durum: Kulüp Sadece Başvuruyla alıyor
    if (club?.join_method === 'APPLICATION_ONLY') {
      // 4a: Başvurusu beklemede
      if (membershipStatus === 'PENDING') {
        return (
          <Button disabled className="w-full" variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Application Pending
          </Button>
        )
      } 
      // 4b: Henüz başvurmamış
      else {
        return (
          <Button onClick={handleApply} disabled={isActionLoading} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            {isActionLoading ? "Applying..." : "Apply to Join"}
          </Button>
        )
      }
    }

    // 5. Durum: Kulüp Açık Katılımlı (ve kullanıcı henüz üye değil)
    if (club?.join_method === 'OPEN') {
      return (
        <Button onClick={handleJoin} disabled={isActionLoading} className="w-full">
          <UserPlus className="mr-2 h-4 w-4" />
          {isActionLoading ? "Joining..." : "Join Club"}
        </Button>
      )
    }
    
    // Diğer tüm durumlar (örn: Kulüp yüklenirken)
    return null
  }


  // --- RENDER ---
  if (!isMounted || isLoading || !club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        <p className="ml-4 text-muted-foreground">Loading club...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* ✅ DÜZELTME: Link -> a (Geri butonu) */}
        <Button asChild variant="ghost" className="mb-6">
          <Link href="/clubs">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Clubs
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Sol Sütun: Kulüp Bilgisi */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{club.name}</CardTitle>
                <CardDescription>{club.university_name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                
                {/* ✅ GÜNCELLEME: Dinamik buton render ediliyor */}
                <div className="pt-2">
                  {renderJoinButton()}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{club.member_count} members</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Owner: {club.owner_username}</span>
                </div>
                
                {/* ✅ YENİ: Katılım Yöntemi Bilgisi */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  {club.join_method === 'OPEN' ? (
                     <UserPlus className="h-4 w-4 text-green-600" />
                  ) : (
                     <FileText className="h-4 w-4 text-blue-600" />
                  )}
                  <span className={club.join_method === 'OPEN' ? 'text-green-600' : 'text-blue-600'}>
                    {club.join_method === 'OPEN' ? "Open to all" : "Application only"}
                  </span>
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
                      <a key={event.id} href={`/events/${event.id}`}> {/* ✅ DÜZELTME: Link -> a */}
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
                      </a>
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
