"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// ✅ ArrowLeft ve Link importları kaldırıldı (Global layout var)
import { CheckCircle2, XCircle } from "lucide-react"

interface AttendanceRecord {
  user_id: number
  username: string
  // ✅ DÜZELTME (İyi pratik): 'status' tipini 'string' yerine daha spesifik hale getirdik
  status: "ATTENDED" | "NO_SHOW"
}

export default function AttendancePage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null)

  const fetchAttendance = useCallback(async () => {
    try {
      const data = await api.getAttendance(Number(params.id))
      setAttendance(data)
    } catch (error: any) {
      console.error("Failed to fetch attendance:", error)
      if (error.status === 403) {
        alert("Only event owners/club admins can manage attendance")
        router.push(`/events/${params.id}`)
      }
    } finally {
      setIsLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    // ✅ 'user' objesi gelene kadar bekleyelim (403 hatasını önler)
    if (!user || !params.id) return
    
    fetchAttendance()
  }, [params.id, user, fetchAttendance]) // ✅ 'user' bağımlılıklara eklendi

  const handleUpdateStatus = async (userId: number, status: string) => {
    setUpdatingUserId(userId)
    try {
      // ✅ DÜZELTME (Vercel Build Hatası):
      // TypeScript'e bu 'status' string'inin "ATTENDED" veya "NO_SHOW" olduğunu garanti et.
      await api.setAttendance(Number(params.id), userId, status as "ATTENDED" | "NO_SHOW")
      
      // Sayfayı yenilemek yerine state'i anında güncelle (daha hızlı UI)
      setAttendance(prevList => 
        prevList.map(p => 
          p.user_id === userId ? { ...p, status: status as "ATTENDED" | "NO_SHOW" } : p
        )
      )
    } catch (error: any) {
      alert(error.message || "Failed to update attendance")
    } finally {
      setUpdatingUserId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading attendance...</p>
        </div>
      </div>
    )
  }

  const attendedCount = attendance.filter((a) => a.status === "ATTENDED").length
  const noShowCount = attendance.filter((a) => a.status === "NO_SHOW").length

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* ✅ DÜZELTME: Global layout'ta zaten navigasyon olduğu için "Geri Dön" butonu kaldırıldı. */}

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground">Track and manage participant attendance</p>
        </div>

        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{attendance.length}</p>
                <p className="text-sm text-muted-foreground">Total Participants</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{attendedCount}</p>
                <p className="text-sm text-muted-foreground">Attended</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{noShowCount}</p>
                <p className="text-sm text-muted-foreground">No Show</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle>Participant List</CardTitle>
            <CardDescription>Mark attendance for each participant</CardDescription>
          </CardHeader>
          <CardContent>
            {attendance.length === 0 ? (
              <p className="text-center text-muted-foreground">No participants yet</p>
            ) : (
              <div className="space-y-4">
                {attendance.map((record) => (
                  <Card key={record.user_id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{record.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">{record.username}</p>
                            <div className="mt-1">
                              {record.status === "ATTENDED" ? (
                                <Badge className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle2 className="mr-1 h-3 w-3" />
                                  Attended
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="border-red-600 text-red-600">
                                  <XCircle className="mr-1 h-3 w-3" />
                                  No Show
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Select
                          value={record.status}
                          onValueChange={(value) => handleUpdateStatus(record.user_id, value)}
                          disabled={updatingUserId === record.user_id}
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ATTENDED">Attended</SelectItem>
                            <SelectItem value="NO_SHOW">No Show</SelectItem>
                          </SelectContent>
                        </Select>
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
  )
}
