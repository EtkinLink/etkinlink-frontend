import { Button } from "@/components/ui/button"
import { Calendar, Users, Sparkles, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function HomePage() {
  const { t } = useI18n()

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold">EtkinLink</span>
          </div>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher className="w-[220px]" />
            <Link href="/auth/login">
              <Button variant="ghost">{t("nav.signIn")}</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>{t("nav.getStarted")}</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container flex flex-col items-center justify-center gap-8 py-24 text-center">
          <div className="flex items-center gap-2 rounded-full bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
            <Sparkles className="h-4 w-4" />
            <span>{t("landing.badge")}</span>
          </div>

          <h1 className="max-w-4xl text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            {t("landing.heroTitle")} <span className="text-indigo-600">{t("landing.heroHighlight")}</span>
          </h1>

          <p className="max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
            {t("landing.heroDescription")}
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/auth/sign-up">
              <Button size="lg" className="gap-2">
                {t("landing.primaryCta")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline">
                {t("landing.secondaryCta")}
              </Button>
            </Link>
          </div>

          {/* Feature Cards */}
          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 text-left">
              <Calendar className="mb-4 h-10 w-10 text-indigo-600" />
              <h3 className="mb-2 font-semibold">{t("landing.feature.discover.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("landing.feature.discover.desc")}</p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
              <Users className="mb-4 h-10 w-10 text-indigo-600" />
              <h3 className="mb-2 font-semibold">{t("landing.feature.communities.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("landing.feature.communities.desc")}</p>
            </div>
            <div className="rounded-lg border bg-card p-6 text-left">
              <Sparkles className="mb-4 h-10 w-10 text-indigo-600" />
              <h3 className="mb-2 font-semibold">{t("landing.feature.organize.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("landing.feature.organize.desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t("landing.footer")}</p>
        </div>
      </footer>
    </div>
  )
}
