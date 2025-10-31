"use client" // Bu layout, hook'ları (useAuth) kullandığı için client component olmalı

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, Plus, LogOut, Users, User } from "lucide-react"

// Bu layout, (app) grubundaki tüm sayfaları sarar
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    localStorage.removeItem("access_token") // auth-context'e taşıyabilirsin
    router.replace("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      
      {/* === KALICI GLOBAL NAVBAR (HEADER) === */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          
          {/* Logo */}
          <Link href="/events" className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">EtkinLink</span>
          </Link>
          
          {/* Navigasyon Linkleri (Sadece 'user' varken veya yüklenmiyoken göster) */}
          {!isLoading && user && (
            <nav className="flex items-center gap-1 sm:gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/events">Events</Link>
              </Button>
              
              {/* ✅ YENİ: KULÜPLER LİNKİ EKLENDİ */}
              <Button asChild variant="ghost" size="sm">
                <Link href="/clubs">
                  <Users className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Clubs</span>
                </Link>
              </Button>

              <Button asChild variant="ghost" size="sm">
                <Link href="/profile">
                  <User className="mr-0 sm:mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Profile</span>
                </Link>
              </Button>


              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </nav>
          )}
        </div>
      </header>
      
      {/* === SAYFA İÇERİĞİ === */}
      {/* Burası, /events, /profile veya /clubs sayfalarının render edileceği yerdir */}
      <main className="flex-1">
        {children}
      </main>

    </div>
  )
}