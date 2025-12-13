// app/(auth)/signup/page.tsx (veya mevcut dosyan)
"use client"

import { useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api-client"              // ✅ TEK KAYNAK
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "lucide-react"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useI18n()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    setIsLoading(true)
    try {
      await api.signup({ email, password, name, gender })
      setSuccess(true)
      // Backend sends verification email to the user's email
    } catch (err: any) {
      setError(err?.message || t("auth.error.signupFailed"))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="mb-8 flex w-full max-w-md items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8 text-indigo-600" />
          <span className="text-2xl font-bold">EtkinLink</span>
        </div>
        <LanguageSwitcher className="w-full sm:w-[240px]" />
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t("auth.createAccount")}</CardTitle>
          <CardDescription>{t("auth.signUpDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fullName")}</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <p className="text-xs text-muted-foreground">Use your university email (e.g., @itu.edu.tr)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.password")}</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <RadioGroup value={gender} onValueChange={(value) => setGender(value as "MALE" | "FEMALE")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MALE" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FEMALE" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                </div>
              </RadioGroup>
            </div>

            {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

            {success && (
              <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">Registration successful!</p>
                <p>Please check your email <strong>{email}</strong> to verify your account.</p>
                <p className="mt-2 text-xs">The verification link will expire in 30 minutes.</p>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? t("auth.signingUp") : t("auth.signUp")}
            </Button>

            <div className="mt-4 text-center text-sm">
              {t("auth.haveAccount")}{" "}
              <Link href="/auth/login" className="text-indigo-600 hover:underline">{t("auth.signIn")}</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
