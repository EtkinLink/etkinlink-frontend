"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// ✅ YENİ: İkonlar eklendi
import { ArrowLeft, Users, Calendar, University, User, Info, UserPlus, UserMinus, FileText, Clock, Check, Settings, Edit2, X, Flag } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ShareButton } from "@/components/share-button"

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
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()

  const clubId = params.id ? Number(params.id) : null
  
  const [club, setClub] = useState<ClubDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false) // Bütün butonlar için
  const [isMounted, setIsMounted] = useState(false)
  const [membershipStatus, setMembershipStatus] = useState<ApplicationStatus>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showApplicationDialog, setShowApplicationDialog] = useState(false)
  const [applicationMotivation, setApplicationMotivation] = useState("")

  // Report state
  const [reportReason, setReportReason] = useState("")
  const [isReporting, setIsReporting] = useState(false)

  // 1. Hydration check
  useEffect(() => {
    setIsMounted(true)

    // Validate club ID
    if (!clubId || isNaN(clubId)) {
      console.error("Invalid Club ID from URL")
      router.push("/clubs")
    }
  }, [clubId, router])

  // 2. Ana kulüp verisini çek
  useEffect(() => {
    if (!isMounted || !clubId) return

    const fetchClubData = async () => {
      setIsLoading(true)
      try {
        const clubData = await api.getClub(clubId)
        console.log("🔍 Club join_method from backend:", clubData.join_method)
        setClub(clubData)
      } catch (err) {
        console.error("Failed to fetch club data:", err)
        toast({
          title: "Club Not Found",
          description: "The requested club could not be found.",
          variant: "destructive",
        })
        router.push("/clubs")
      } finally {
        setIsLoading(false)
      }
    }
    fetchClubData()

  }, [isMounted, clubId, router, toast])

  // 3. Kullanıcı veya Kulüp değiştiğinde, üyelik/başvuru durumunu çek
  useEffect(() => {
    if (!isMounted || !clubId || !user || !club) {
      if (!user) setMembershipStatus(null) // Kullanıcı giriş yapmamışsa durumu sıfırla
      return
    }

    const fetchMembershipStatus = async () => {
      try {
        // ✅ GÜNCELLEME: Backend'e eklediğimiz yeni endpoint'i çağır
        const statusData = await api.getMyClubApplicationStatus(clubId)
        console.log("🔍 Club membership status from backend:", statusData)
        let status: ApplicationStatus = statusData.status
        // Owner isen otomatik ADMIN kabul et
        if (club.owner_username === user.username) {
          status = "ADMIN"
        }
        console.log("✅ Setting membershipStatus to:", status)
        setMembershipStatus(status)
      } catch (err) {
        console.error("Failed to fetch membership status:", err)
      }
    }

    fetchMembershipStatus()

  }, [isMounted, clubId, user, club])

  
  // --- EVENT HANDLERS ---

  const handleJoin = async () => {
    if (!user) { router.push("/auth/login"); return }
    if (!clubId) return

    setIsActionLoading(true)
    try {
      await api.joinClub(clubId)

      // Check join method to determine new status
      if (club?.join_method === 'OPEN') {
        setMembershipStatus('MEMBER')
        setClub(prev => prev ? { ...prev, member_count: prev.member_count + 1 } : null)
        toast({
          title: "Joined Successfully",
          description: "You are now a member of this club!",
          variant: "success",
        })
      } else {
        setMembershipStatus('PENDING')
        toast({
          title: "Application Submitted",
          description: "Your application has been submitted. Please wait for approval.",
          variant: "default",
        })
      }
    } catch (err: any) {
      // Check if already a member (409 Conflict)
      if (err.status === 409 || err.message?.includes("already")) {
        // Refresh membership status from server
        try {
          const statusData = await api.getMyClubApplicationStatus(clubId)
          setMembershipStatus(statusData.status)
        } catch {}
        toast({
          title: "Already a Member",
          description: "You are already a member of this club.",
          variant: "default",
        })
      } else {
        toast({
          title: "Join Failed",
          description: err.message || "Failed to join club",
          variant: "destructive",
        })
      }
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleLeave = async () => {
    if (!user || !clubId) return

    setIsActionLoading(true)
    try {
      await api.leaveClub(clubId)
      setMembershipStatus(null)
      setClub(prev => prev ? { ...prev, member_count: prev.member_count - 1 } : null)
      toast({
        title: "Left Club",
        description: "You have left the club.",
        variant: "default",
      })
    } catch (err: any) {
      toast({
        title: "Leave Failed",
        description: err.message || "Failed to leave club",
        variant: "destructive",
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) { router.push("/auth/login"); return }
    if (!clubId) return

    setIsActionLoading(true)
    try {
      await api.createClubApplication(clubId, applicationMotivation)
      setMembershipStatus("PENDING")
      setShowApplicationDialog(false)
      setApplicationMotivation("")
      toast({
        title: "Application Submitted",
        description: "Your application has been submitted. Please wait for approval.",
        variant: "success",
      })
    } catch (err: any) {
      if (err?.status === 409) {
        setMembershipStatus("PENDING")
        setShowApplicationDialog(false)
        toast({
          title: "Already Applied",
          description: "You already have a pending application.",
          variant: "default",
        })
      } else {
        toast({
          title: "Application Failed",
          description: err.message || "Failed to submit application",
          variant: "destructive",
        })
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
      toast({
        title: "Club Deleted",
        description: "The club has been successfully deleted.",
        variant: "success",
      })
      setTimeout(() => router.push("/clubs"), 1000)
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete club",
        variant: "destructive",
      })
      setIsDeleting(false)
    }
  }

  const handleReport = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    if (!clubId || !reportReason.trim()) return
    if (reportReason.trim().length < 10) {
      toast({
        title: "Invalid Report",
        description: "Reason must be at least 10 characters",
        variant: "destructive",
      })
      return
    }

    setIsReporting(true)
    try {
      await api.reportClub(clubId, reportReason.trim())
      toast({
        title: "Report Submitted",
        description: "Thank you for your report. We will review it soon.",
      })
      setReportReason("")
    } catch (error: any) {
      toast({
        title: "Report Failed",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      })
    } finally {
      setIsReporting(false)
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
          <Button onClick={() => setShowApplicationDialog(true)} disabled={isActionLoading} className="w-full">
            <FileText className="mr-2 h-4 w-4" />
            Apply to Join
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

                {/* Share and Report Buttons */}
                <div className="pt-4 border-t space-y-2">
                  <ShareButton
                    title={club.name}
                    description={club.description || `Join ${club.name} at ${club.university_name}`}
                    variant="outline"
                    className="w-full"
                  />

                  {/* Report Button - Show only if not admin */}
                  {membershipStatus !== 'ADMIN' && user && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="w-full">
                          <Flag className="mr-2 h-4 w-4" />
                          Report Club
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Report Club</AlertDialogTitle>
                          <AlertDialogDescription>
                            Please provide a reason for reporting this club (minimum 10 characters).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <Textarea
                          placeholder="Describe why you are reporting this club..."
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="min-h-[100px]"
                        />
                        <AlertDialogFooter>
                          <AlertDialogCancel onClick={() => setReportReason("")}>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleReport} disabled={isReporting || reportReason.trim().length < 10}>
                            {isReporting ? "Submitting..." : "Submit Report"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
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

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Join {club.name}</DialogTitle>
            <DialogDescription>
              Please provide a brief message explaining why you want to join this club.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="motivation">Your Message *</Label>
              <Textarea
                id="motivation"
                placeholder="Tell us why you want to join this club..."
                value={applicationMotivation}
                onChange={(e) => setApplicationMotivation(e.target.value)}
                rows={4}
                required
              />
              <p className="text-xs text-muted-foreground">* Required: Explain why you want to join this organization</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleApply}
              disabled={isActionLoading || !applicationMotivation.trim()}
            >
              {isActionLoading ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
