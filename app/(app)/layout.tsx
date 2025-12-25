"use client" // Bu layout, hook'ları (useAuth) kullandığı için client component olmalı

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Calendar, LogOut, Users, User } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

// Bu layout, (app) grubundaki tüm sayfaları sarar
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth()
  const router = useRouter()
  const { t } = useI18n()

  // Sekme değişince sayfa başlığını değiştir
  useEffect(() => {
    const originalTitle = document.title

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Kullanıcı başka sekmeye geçti
        document.title = t("common.comeBack")
      } else {
        // Kullanıcı geri döndü
        document.title = originalTitle
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.title = originalTitle
    }
  }, [t])

  const handleLogout = () => {
    logout()
    localStorage.removeItem("access_token") // auth-context'e taşıyabilirsin
    router.replace("/auth/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      
      {/* === KALICI GLOBAL NAVBAR (HEADER) === */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-2 px-4">

          {/* Logo */}
          <Link href="/events" className="flex items-center gap-2 flex-shrink-0">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600 dark:text-indigo-400" />
            <span className="text-lg sm:text-xl font-bold">EtkinLink</span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-3">
            {!isLoading && user && (
              <nav className="flex items-center gap-0.5 sm:gap-2">
                <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Link href="/events">
                    <span className="hidden md:inline">{t("nav.events")}</span>
                    <Calendar className="h-4 w-4 md:hidden" />
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Link href="/clubs">
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">{t("nav.clubs")}</span>
                  </Link>
                </Button>
                <Button asChild variant="ghost" size="sm" className="px-2 sm:px-3">
                  <Link href="/profile">
                    <User className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">{t("nav.profile")}</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="px-2 sm:px-3">
                  <LogOut className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">{t("nav.signOut")}</span>
                </Button>
              </nav>
            )}
            <ThemeToggle />
            <LanguageSwitcher className="w-[70px] sm:w-[140px] md:w-[180px]" />
          </div>
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
