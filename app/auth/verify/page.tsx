"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Calendar, CheckCircle2, Loader2, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useI18n } from "@/lib/i18n"

type Status = "pending" | "success" | "error" | "missing"

export default function VerifyPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useI18n()
  const token = useMemo(() => searchParams.get("token"), [searchParams])
  const [status, setStatus] = useState<Status>(token ? "pending" : "missing")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    if (!token) return

    const verify = async () => {
      setStatus("pending")
      setErrorMessage("")
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api"
        const res = await fetch(
          `${apiBase}/auth/register/verify/${encodeURIComponent(token)}`,
          { method: "GET" }
        )

        if (res.ok) {
          setStatus("success")
          setTimeout(() => router.push("/auth/login"), 2000)
        } else {
          const data = await res.json().catch(() => null)
          const errorText = (data?.error as string | undefined) || t("verify.error.subtitle")
          setErrorMessage(errorText)
          setStatus("error")
        }
      } catch (err) {
        console.error("Email verification failed", err)
        setErrorMessage(t("verify.error.subtitle"))
        setStatus("error")
      }
    }

    verify()
  }, [router, t, token])

  const renderContent = () => {
    switch (status) {
      case "pending":
        return (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <h2 className="text-xl font-semibold">{t("verify.pending.title")}</h2>
            <p className="text-center text-sm text-muted-foreground">{t("verify.pending.subtitle")}</p>
          </>
        )
      case "success":
        return (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <h2 className="text-xl font-semibold">{t("verify.success.title")}</h2>
            <p className="text-center text-sm text-muted-foreground">{t("verify.success.subtitle")}</p>
            <Button onClick={() => router.push("/auth/login")} className="mt-2">
              {t("verify.backToLogin")}
            </Button>
          </>
        )
      case "missing":
        return (
          <>
            <XCircle className="h-10 w-10 text-red-600" />
            <h2 className="text-xl font-semibold">{t("verify.missing.title")}</h2>
            <p className="text-center text-sm text-muted-foreground">{t("verify.missing.subtitle")}</p>
            <Button onClick={() => router.push("/auth/login")} variant="outline" className="mt-2">
              {t("verify.backToLogin")}
            </Button>
          </>
        )
      case "error":
      default:
        return (
          <>
            <XCircle className="h-10 w-10 text-red-600" />
            <h2 className="text-xl font-semibold">{t("verify.error.title")}</h2>
            <p className="text-center text-sm text-muted-foreground">
              {errorMessage || t("verify.error.subtitle")}
            </p>
            <Button onClick={() => router.push("/auth/login")} variant="outline" className="mt-2">
              {t("verify.backToLogin")}
            </Button>
          </>
        )
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

      <Card className="w-full max-w-md bg-white border-gray-200 shadow-lg">
        <CardHeader>
          <CardTitle>{t("verify.title")}</CardTitle>
          <CardDescription>{t("verify.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 py-6">
          {renderContent()}
          {errorMessage && (
            <div className="w-full rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive text-center">
              {errorMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
