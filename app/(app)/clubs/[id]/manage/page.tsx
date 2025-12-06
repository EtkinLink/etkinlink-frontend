"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api, APIError } from "@/lib/api-client"
import Link from "next/link"

// Bileşenler
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Alert, AlertDescription } from "@/components/ui/alert"
// ✅ YENİ: Sekmeler için Tabs bileşeni
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// İkonlar
import { ArrowLeft, Check, X, Users, UserCheck, AlertCircle } from "lucide-react"

// --- ARAYÜZLER (TYPES) ---

interface ClubApplication {
  id: number
  user_id: number
  username: string
  why_me: string | null
  status: string // PENDING
}

interface ClubMember {
  id: number
  username: string
  name: string
  role: 'ADMIN' | 'MEMBER'
  joined_at: string
}

interface ClubInfo {
  id: number
  name: string
}

export default function ManageClubPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const clubId = params.id ? Number(params.id) : null

  const [club, setClub] = useState<ClubInfo | null>(null)
  const [applications, setApplications] = useState<ClubApplication[]>([])
  const [members, setMembers] = useState<ClubMember[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null) // Buton kilidi
  const [isMounted, setIsMounted] = useState(false)

  // 1. Mount
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // 2. Ana veri yükleme (Başvurular, Üyeler, Kulüp Bilgisi)
  useEffect(() => {
    if (!isMounted || !clubId || !user) return

    // Sadece giriş yapan kullanıcılar bu sayfayı görebilir
    if (!user) {
      router.push("/auth/login")
      return
    }

    fetchManagementData()
    
  }, [isMounted, clubId, user, router])


  // Veri çekme fonksiyonu
  const fetchManagementData = async () => {
    if (!clubId) return
    setIsLoading(true)
    setError(null)
    
    try {
      // 3 API isteğini aynı anda yap
      const [clubData, applicationsData, membersData] = await Promise.all([
        api.getClub(clubId),
        api.getClubApplications(clubId),
        api.getClubMembers(clubId)
      ])
      
      setClub(clubData)
      // Sadece 'PENDING' olanları filtrele (backend zaten yapıyor olabilir ama garanti olsun)
      setApplications(applicationsData.filter((app: ClubApplication) => app.status === 'PENDING'))
      setMembers(membersData)

    } catch (err: any) {
      if (err instanceof APIError && err.status === 403) {
        // Kullanıcı bu kulübün admini değilse
        setError("You are not authorized to manage this club.")
        alert("You are not authorized to manage this club.")
        router.push(`/clubs/${clubId}`)
      } else {
        setError("Failed to load club management data.")
      }
    } finally {
      setIsLoading(false)
    }
  }


  // --- EVENT HANDLERS (Başvuru Yönetimi) ---

  // Başvuruyu Onayla
  const handleApprove = async (applicationId: number) => {
    setProcessingId(applicationId)
    try {
      if (!clubId) return
      await api.patchClubApplication(clubId, applicationId, "APPROVED")
      // Listeyi yenilemek için verileri tekrar çek
      await fetchManagementData()
    } catch (err: any) {
      alert(err.message || "Failed to approve application")
    } finally {
      setProcessingId(null)
    }
  }

  // Başvuruyu Reddet (Sil)
  const handleReject = async (applicationId: number) => {
    setProcessingId(applicationId)
    try {
      if (!clubId) return
      await api.patchClubApplication(clubId, applicationId, "REJECTED")
      // Listeyi yenilemek için verileri tekrar çek
      await fetchManagementData()
    } catch (err: any) {
      alert(err.message || "Failed to reject application")
    } finally {
      setProcessingId(null)
    }
  }

  // --- RENDER ---
  
  if (!isMounted || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading management panel...</p>
        </div>
      </div>
    )
  }

  // Yetkisiz veya hata durumu
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button asChild variant="link" className="mt-4">
          <Link href={`/clubs/${clubId}`}>
            Back to Club Page
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* Geri Dön Butonu */}
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link href={`/clubs/${clubId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Club Page
            </Link>
          </Button>
        </div>
        
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Manage: {club?.name}</h1>
          <p className="text-muted-foreground">Manage applications and members for your club.</p>
        </div>

        {/* Sekmeler (Tabs) */}
        <Tabs defaultValue="applications" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications">
              <UserCheck className="mr-2 h-4 w-4" />
              Pending Applications ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="members">
              <Users className="mr-2 h-4 w-4" />
              All Members ({members.length})
            </TabsTrigger>
          </TabsList>

          {/* Sekme 1: Başvurular */}
          <TabsContent value="applications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Applications</CardTitle>
                <CardDescription>Review users who want to join your club.</CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <p className="text-center text-muted-foreground">No pending applications.</p>
                ) : (
                  <div className="space-y-4">
                    {applications.map((app) => (
                      <Card key={app.id}>
                        <CardContent className="pt-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                            <Avatar className="mb-2 sm:mb-0">
                              <AvatarFallback>{app.username[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="font-semibold">{app.username}</p>
                              {app.why_me && (
                                <div className="mt-2 mb-4 rounded-lg bg-muted p-3">
                                  <p className="text-sm text-muted-foreground">{app.why_me}</p>
                                </div>
                              )}
                              <div className="flex gap-2 mt-4">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprove(app.id)}
                                  disabled={processingId === app.id}
                                >
                                  <Check className="mr-2 h-4 w-4" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleReject(app.id)}
                                  disabled={processingId === app.id}
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
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

          {/* Sekme 2: Üyeler */}
          <TabsContent value="members" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Members</CardTitle>
                <CardDescription>List of all current club members.</CardDescription>
              </CardHeader>
              <CardContent>
                {members.length === 0 ? (
                  <p className="text-center text-muted-foreground">No members found.</p>
                ) : (
                  <div className="space-y-4">
                    {members.map((member) => (
                      <Card key={member.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">{member.name || member.username}</p>
                                <p className="text-sm text-muted-foreground">@{member.username}</p>
                              </div>
                            </div>
                            <Badge variant={member.role === 'ADMIN' ? 'default' : 'outline'}>
                              {member.role}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  )
}
