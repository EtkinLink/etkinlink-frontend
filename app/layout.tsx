import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Suspense } from "react"
import { AuthProvider } from "@/lib/auth-context"
import { I18nProvider } from "@/lib/i18n"
import { Toaster } from "@/components/ui/toaster"
import { cookies } from "next/headers"

export const metadata: Metadata = {
  title: "EtkinLink - Student Event Platform",
  description: "Discover and join amazing campus events",
  generator: "v0.app",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get("preferred_language")?.value ?? null
  const initialLocale =
    cookieLocale && ["en", "tr", "ar", "bs", "de", "fi", "da", "ru"].includes(cookieLocale)
      ? (cookieLocale as "en")
      : "en"

  return (
    <html lang={initialLocale}>
      <body className="font-sans">
        <I18nProvider initialLocale={initialLocale}>
          <AuthProvider>
            <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
            <Toaster />
          </AuthProvider>
        </I18nProvider>
        <Analytics />
      </body>
    </html>
  )
}
