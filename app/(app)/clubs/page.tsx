"use client"

import { useEffect, useState } from "react"
import { api } from "@/lib/api-client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Plus, University } from "lucide-react"
import { useI18n } from "@/lib/i18n"

// API'dan dönen kulüp listesi tipi
interface Club {
  id: number
  name: string
  description: string | null
  university_name: string
  university_id?: number | null
  member_count: number
}

// Filtre için üniversite tipi
interface University {
  id: number
  name: string
}

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [universities, setUniversities] = useState<University[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all") // "all" = filtre yok
  const [search, setSearch] = useState("") // İsim filtresi
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useI18n()

  // 1. Filtre dropdown'ı için üniversiteleri çek
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const unis = await api.getUniversities()
        setUniversities(unis)
      } catch (err) {
        console.error("Failed to fetch universities:", err)
      }
    }
    fetchUniversities()
  }, []) // Sadece bir kez çalışır

  // 2. Kulüpleri çek (veya filtre değiştiğinde tekrar çek)
  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoading(true)
      try {
        // API'dan ham listeyi çek
        const clubsData = await api.getClubs()

        // Search filtresi uygula
        let filtered = clubsData
        if (search.trim()) {
          filtered = filtered.filter((c: any) =>
            c.name?.toLowerCase().includes(search.toLowerCase()) ||
            c.description?.toLowerCase().includes(search.toLowerCase())
          )
        }

        // University filtresi uygula
        if (selectedUniversity !== "all") {
          filtered = filtered.filter((c: any) =>
            c.university_id?.toString() === selectedUniversity
          )
        }

        setClubs(filtered)
      } catch (err) {
        console.error("Failed to fetch clubs:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchClubs()
  }, [search, selectedUniversity]) 

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        
        {/* Sayfa Başlığı ve Navigasyon */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("clubs.title")}</h1>
            <p className="text-muted-foreground">{t("clubs.subtitle")}</p>
          </div>
          {/* TODO: /clubs/create sayfası oluşturulunca bu buton işlevsel hale gelir */}
          <Button asChild>
            <Link href="/clubs/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("clubs.create")}
            </Link>
          </Button>
        </div>

        {/* Filtreleme Kartı */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <University className="h-5 w-5 text-muted-foreground shrink-0" />
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder={t("clubs.filter.placeholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("clubs.filter.all")}</SelectItem>
                    {universities.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id.toString()}>
                        {uni.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full sm:w-[280px]">
                <input
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder={t("clubs.searchPlaceholder")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kulüp Listesi */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
            <p className="mt-4 text-muted-foreground">{t("clubs.loading")}</p>
          </div>
        ) : clubs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {t("clubs.empty")}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {clubs.map((club) => (
              <Link key={club.id} href={`/clubs/${club.id}`} className="flex">
                <Card className="flex flex-col h-full w-full transition hover:shadow-md">
                  <CardHeader>
                    <CardTitle>{club.name}</CardTitle>
                    <CardDescription>{club.university_name}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-grow justify-between">
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {club.description || t("clubs.noDescription")}
                    </p>
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4" />
                      <span>{t("clubs.members", { count: club.member_count })}</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
