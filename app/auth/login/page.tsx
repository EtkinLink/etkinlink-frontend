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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !password) {
      setError("Please enter email and password")
      return
    }

    if (!turnstileToken) {
      setError("Please verify you are human.")
      return
    }

    setIsLoading(true)
    try {
      await api.loginWithPassword(email, password)
      window.location.href = "/events" 
    } catch (err: any) {
      setError(err?.message || "Login failed")
      setIsLoading(false)
      // Hata durumunda token'ı sıfırla
      setTurnstileToken(null)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mb-8 flex items-center gap-2">
        <Calendar className="h-8 w-8 text-indigo-600" />
        <span className="text-2xl font-bold">EtkinLink</span>
      </div>

      <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="bg-white"
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
                  setError("Doğrulama servisine bağlanılamadı.")
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all" 
              disabled={isLoading || !turnstileToken}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>

            <div className="mt-4 text-center text-sm">
              Don’t have an account?{" "}
              <Link href="/auth/sign-up" className="text-indigo-600 hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}