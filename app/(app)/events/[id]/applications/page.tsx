"use client"

import { useCallback, useEffect, useState } from "react"
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
  status: "PENDING" | "APPROVED" | "REJECTED" | string
  source?: "APPLICATION" | "PARTICIPANT"
}

interface Participant {
  id: number
  username: string
  status: string | null
}

const normalizeStatus = (status: string | null | undefined) => {
  const value = (status ?? "").toString().toUpperCase()
  if (value === "ACCEPTED") return "APPROVED"
  if (value === "JOINED") return "APPROVED"
  if (value === "WAITING" || value === "REQUESTED") return "PENDING"
  return value || "PENDING"
}

const isApprovedStatus = (status: string) => normalizeStatus(status) === "APPROVED"
const isPendingStatus = (status: string) => normalizeStatus(status) === "PENDING"
const isRejectedStatus = (status: string) => normalizeStatus(status) === "REJECTED"

export default function ApplicationsPage() {
  // ✅ DÜZELTME: useRouter ve useParams yerine URL'den ID alınıyor
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
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


  const fetchApplications = useCallback(async () => {
    setIsLoading(true) 
    try {
      console.log("Fetching applications for eventId:", eventId)
      const [applicationsData, eventData] = await Promise.all([
        api.getApplications(eventId!),
        api.getEvent(eventId!)
      ])
      console.log("Applications data received:", applicationsData)
      console.log("Event data received:", eventData)
      
      setApplications(
        applicationsData.map((app: Application) => ({
          ...app,
          status: normalizeStatus(app.status) as Application["status"],
          source: "APPLICATION",
        }))
      )
      setParticipants(
        (eventData?.participants || []).map((participant: any) => ({
          id: participant.id,
          username: participant.username,
          status: participant.status ?? null,
        }))
      )
    } catch (error: any) {
      console.error("Failed to fetch applications:", error)
      console.error("Error status:", error.status)
      console.error("Error message:", error.message)
      if (error.status === 403) {
        alert("Only event owners/club admins can view applications")
        // ✅ DÜZELTME: router.push -> window.location.href
        window.location.href = `/events/${eventId}`
      } else {
        alert(`Error loading applications: ${error.message || 'Unknown error'}`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  // Veri çekme effect'i
  useEffect(() => {
    // Sadece ID ve kullanıcı bilgisi hazır olduğunda çek
    if (!eventId || !user) return

    fetchApplications()
  }, [eventId, user, fetchApplications])

  // Başvuru durumunu güncelleme (Onayla/Reddet)
  const handleUpdateStatus = async (applicationId: number, status: "APPROVED" | "REJECTED") => {
    setProcessingId(applicationId)
    try {
      // ✅ DÜZELTME: TypeScript tipini garanti eden atama (Artık Vercel'de hata vermez)
      await api.patchApplication(applicationId, status)
      await fetchApplications() // Listeyi yenile (katılımcı listesi de güncellensin)
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

  const pendingApplications = applications.filter((a) => isPendingStatus(a.status))
  const participantApprovals = participants
    .map((participant) => ({
      id: Number(participant.id ?? 0),
      user_id: Number(participant.id ?? 0),
      username: participant.username,
      why_me: null,
      status: normalizeStatus(participant.status) as Application["status"],
      source: "PARTICIPANT" as const,
    }))
    .filter((participant) => isApprovedStatus(participant.status))

  const combinedApprovedMap = new Map<string, Application>()
  const buildKey = (entry: Application) =>
    entry.user_id ? `id:${entry.user_id}` : `user:${entry.username}`
  const addToMap = (entry: Application) => {
    const key = buildKey(entry)
    if (!combinedApprovedMap.has(key)) {
      combinedApprovedMap.set(key, entry)
    }
  }

  applications.filter((a) => isApprovedStatus(a.status)).forEach(addToMap)
  participantApprovals.forEach(addToMap)

  const approvedApplications = Array.from(combinedApprovedMap.values()).filter(
    (entry) => !isRejectedStatus(entry.status)
  )

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
                                onClick={() => handleUpdateStatus(application.id, "REJECTED")}
                                disabled={processingId === application.id}
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
                  {approvedApplications.map((application) => {
                    const isParticipantEntry = application.source === "PARTICIPANT"
                    const entryKey = `${application.source ?? "application"}-${application.user_id ?? application.id}`
                    return (
                    <Card key={entryKey}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                          <Avatar>
                            <AvatarFallback>{application.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="font-semibold">{application.username}</p>
                              <div className="flex gap-2">
                                <Badge>{application.status}</Badge>
                                {isParticipantEntry && <Badge variant="outline">Participant</Badge>}
                              </div>
                            </div>
                            {application.why_me && (
                              <div className="rounded-lg bg-muted p-3">
                                <p className="text-sm text-muted-foreground">{application.why_me}</p>
                              </div>
                            )}
                            {!application.why_me && isParticipantEntry && (
                              <p className="text-sm text-muted-foreground">
                                Already part of the event. Manage attendance from the event detail page.
                              </p>
                            )}
                            {!isParticipantEntry && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateStatus(application.id, "REJECTED")}
                                disabled={processingId === application.id}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )})}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
