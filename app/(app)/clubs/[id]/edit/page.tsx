"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { useI18n } from "@/lib/i18n"
import { api, APIError } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, AlertCircle, Trash2 } from "lucide-react"

interface ClubFormData {
  name: string
  description: string
}

export default function EditClubPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { t } = useI18n()
  const [clubId, setClubId] = useState<number | null>(null)

  const [club, setClub] = useState<any>(null)
  const [formData, setFormData] = useState<ClubFormData>({
    name: "",
    description: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isMounted || authLoading) return

    const fetchClub = async () => {
      try {
        const { id } = await params
        const cid = Number(id)
        setClubId(cid)

        const clubData = await api.getClub(cid)
        setClub(clubData)
        setFormData({
          name: clubData.name || "",
          description: clubData.description || "",
        })
      } catch (err) {
        setError(t("clubs.edit.error.loadFailed"))
        setTimeout(() => router.push("/clubs"), 2000)
      }
    }

    if (user) {
      fetchClub()
    } else if (!authLoading) {
      router.replace("/auth/login")
    }
  }, [isMounted, user, authLoading, router, params, t])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    try {
      if (!formData.name.trim()) {
        throw new Error(t("clubs.edit.error.nameMissing"))
      }

      if (!clubId) throw new Error(t("clubs.edit.error.idMissing"))

      await api.updateClub(clubId, {
        description: formData.description,
      })

      setSuccess(t("clubs.edit.success.updated"))
      setTimeout(() => router.push(`/clubs/${clubId}`), 1500)
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError(t("clubs.edit.error.updateFailed"))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(t("clubs.edit.confirm.delete"))) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      if (!clubId) throw new Error(t("clubs.edit.error.idMissing"))

      await api.deleteClub(clubId)

      setSuccess(t("clubs.edit.success.deleted"))
      setTimeout(() => router.push("/clubs"), 1500)
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError(t("clubs.edit.error.deleteFailed"))
      }
      setIsDeleting(false)
    }
  }

  if (!isMounted || authLoading || !club) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={`/clubs/${clubId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Geri Dön
          </Link>
        </Button>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Kulübü Düzenle</CardTitle>
            <CardDescription>{club.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Kulüp Adı (Düzenlenemez)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Kulüp adı değiştirilemez</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Kulübü açıklayın..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Siliniyor..." : "Sil"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
