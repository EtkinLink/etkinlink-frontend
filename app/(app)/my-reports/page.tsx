"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"

interface Report {
  id: number
  event_id: number
  event_title: string
  reason: string
  status: "PENDING" | "REVIEWED" | "RESOLVED" | "DISMISSED"
  admin_notes: string | null
  created_at: string
  updated_at: string | null
}

const getStatusVariant = (status: string) => {
  switch (status) {
    case "PENDING":
      return "secondary"
    case "REVIEWED":
      return "default"
    case "RESOLVED":
      return "default"
    case "DISMISSED":
      return "outline"
    default:
      return "secondary"
  }
}

export default function MyReportsPage() {
  const { user } = useAuth()
  const [reports, setReports] = useState<Report[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchReports = async () => {
      try {
        const data = await api.getMyReports()
        setReports(data)
      } catch (error: any) {
        console.error("Failed to fetch reports:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchReports()
  }, [user])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">My Reports</h1>
          <p className="text-muted-foreground">Track your submitted reports</p>
        </div>

        {reports.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No reports submitted yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <a
                          href={`/events/${report.event_id}`}
                          className="hover:underline"
                        >
                          {report.event_title}
                        </a>
                      </CardTitle>
                      <CardDescription>
                        Reported {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(report.status)}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Reason</p>
                      <p className="text-sm">{report.reason}</p>
                    </div>
                    {report.admin_notes && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Admin Notes</p>
                        <p className="text-sm text-muted-foreground">{report.admin_notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
