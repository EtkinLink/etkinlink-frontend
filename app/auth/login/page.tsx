// app/auth/login/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Calendar } from "lucide-react"
import { Turnstile } from "@marsidev/react-turnstile"

import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError(t("auth.error.missingFields"))
      return
    }

    if (!turnstileToken) {
      setError(t("auth.error.verifyHuman"))
      return
    }

    setIsLoading(true)
    try {
      await api.loginWithPassword(email, password)
      window.location.href = "/events" 
    } catch (err: any) {
      setError(err?.message || t("auth.error.loginFailed"))
      setIsLoading(false)
      setTurnstileToken(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4">
      <div className="mb-8 flex w-full max-w-md items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
          <span className="text-2xl font-bold">EtkinLink</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher className="w-full sm:w-[240px]" />
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>{t("auth.welcomeBack")}</CardTitle>
          <CardDescription>{t("auth.signInDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            {/* CLOUDFLARE TURNSTILE */}
            <div className="flex justify-center py-2 min-h-[65px]">
              <Turnstile 
                // ÖNEMLİ DEĞİŞİKLİK: 1x...AA anahtarına geri döndük.
                // Bu anahtar localhost'ta ASLA hata vermez.
                siteKey="1x00000000000000000000AA" 
                
                // GÖRÜNÜM AYARI: Kutucuğu zorla BEYAZ yapar.
                options={{ theme: 'light' }}
                
                onSuccess={(token) => {
                  setTurnstileToken(token)
                  setError("")
                }}
                
                onError={() => {
                  setTurnstileToken(null)
                  setError(t("auth.error.turnstile"))
                }}
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              disabled={isLoading || !turnstileToken}
            >
              {isLoading ? t("auth.signingIn") : t("auth.signIn")}
            </Button>

            <div className="mt-4 text-center text-sm">
              {t("auth.noAccount")}{" "}
              <Link href="/auth/sign-up" className="text-primary hover:underline">
                {t("auth.signUpCta")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
