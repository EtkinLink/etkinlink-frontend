"use client"

import { useEffect, useState } from "react"
// ✅ DÜZELTME: next/navigation yerine window.location.href kullanılacak
// import { useParams, useRouter } from "next/navigation"
// import Link from "next/link"

// ✅ DÜZELTME: @/ alias'ları göreceli yollara çevrildi
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"

// Bileşenler
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// İkonlar
import { ArrowLeft, Check, X } from "lucide-react"

interface Application {
  id: number
  user_id: number
  username: string
  why_me: string | null
  status: "PENDING" | "APPROVED" | string // Backend'de sadece PENDING/APPROVED var
}

export default function ApplicationsPage() {
  // ✅ DÜZELTME: useRouter ve useParams yerine URL'den ID alınıyor
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [eventId, setEventId] = useState<number | null>(null)
  
  // URL'den ID'yi çekme
  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== "undefined") {
      try {
        const pathSegments = window.location.pathname.split('/')
        // URL /events/[id]/applications şeklinde olmalı
        const idSegment = pathSegments[pathSegments.length - 2]
        const id = Number(idSegment)
        if (!isNaN(id)) {
          setEventId(id)
        } else {
          window.location.href = "/events"
        }
      } catch (e) {
        window.location.href = "/events"
      }
    }
  }, [])


  // Veri çekme effect'i
  useEffect(() => {
    // Sadece ID ve kullanıcı bilgisi hazır olduğunda çek
    if (!eventId || !user) return

    fetchApplications()
  }, [eventId, user])

  const fetchApplications = async () => {
    setIsLoading(true) 
    try {
      const data = await api.getApplications(eventId!)
      setApplications(data)
    } catch (error: any) {
      console.error("Failed to fetch applications:", error)
      if (error.status === 403) {
        alert("Only event owners/club admins can view applications")
        // ✅ DÜZELTME: router.push -> window.location.href
        window.location.href = `/events/${eventId}`
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Başvuru durumunu güncelleme (Onayla/Askıya Al)
  const handleUpdateStatus = async (applicationId: number, status: "PENDING" | "APPROVED") => {
    setProcessingId(applicationId)
    try {
      // ✅ DÜZELTME: TypeScript tipini garanti eden atama (Artık Vercel'de hata vermez)
      await api.patchApplication(applicationId, status)
      await fetchApplications() // Listeyi yenile
    } catch (error: any) {
      alert(error.message || "Failed to update application")
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading || !eventId || !isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    )
  }

  const pendingApplications = applications.filter((a) => a.status === "PENDING")
  const approvedApplications = applications.filter((a) => a.status === "APPROVED")

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* Geri Dön Butonu (Event Detail sayfasına) */}
        <a href={`/events/${eventId}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </a>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Event Applications</h1>
          <p className="text-muted-foreground">Review and manage applications for your event</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pending Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Applications ({pendingApplications.length})</CardTitle>
              <CardDescription>Applications waiting for review</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingApplications.length === 0 ? (
                <p className="text-center text-muted-foreground">No pending applications</p>
              ) : (
                <div className="space-y-4">
                  {pendingApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{application.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="font-semibold">{application.username}</p>
                              <Badge variant="outline">{application.status}</Badge>
                            </div>
                            {application.why_me && (
                              <div className="mb-4 rounded-lg bg-muted p-3">
                                <p className="text-sm text-muted-foreground">{application.why_me}</p>
                              </div>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleUpdateStatus(application.id, "APPROVED")}
                                disabled={processingId === application.id}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(application.id, "PENDING")}
                                disabled={processingId === application.id}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Set to Pending
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

          {/* Approved Applications */}
          <Card>
            <CardHeader>
              <CardTitle>Approved Applications ({approvedApplications.length})</CardTitle>
              <CardDescription>Applications that have been approved</CardDescription>
            </CardHeader>
            <CardContent>
              {approvedApplications.length === 0 ? (
                <p className="text-center text-muted-foreground">No approved applications</p>
              ) : (
                <div className="space-y-4">
                  {approvedApplications.map((application) => (
                    <Card key={application.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{application.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center justify-between">
                              <p className="font-semibold">{application.username}</p>
                              <Badge>{application.status}</Badge>
                            </div>
                            {application.why_me && (
                              <div className="rounded-lg bg-muted p-3">
                                <p className="text-sm text-muted-foreground">{application.why_me}</p>
                              </div>
                            )}
                            {/* Onaylanmış kullanıcılar için "Set to Pending" butonu */}
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(application.id, "PENDING")}
                                disabled={processingId === application.id}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Set to Pending
                              </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}