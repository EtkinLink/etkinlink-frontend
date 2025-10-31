"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Check, X } from "lucide-react"
import Link from "next/link"

interface Application {
  id: number
  user_id: number
  username: string
  why_me: string | null
  status: string
}

export default function ApplicationsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<number | null>(null)

  useEffect(() => {
    fetchApplications()
  }, [params.id])

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications(Number(params.id))
      setApplications(data)
    } catch (error: any) {
      if (error.status === 403) {
        alert("Only event owners can view applications")
        router.push(`/events/${params.id}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateStatus = async (applicationId: number, status: string) => {
    setProcessingId(applicationId)
    try {
      await api.updateApplication(applicationId, status)
      await fetchApplications()
    } catch (error: any) {
      alert(error.message || "Failed to update application")
    } finally {
      setProcessingId(null)
    }
  }

  if (isLoading) {
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
        <Link href={`/events/${params.id}`}>
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Event
          </Button>
        </Link>

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
