"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Compass, ArrowLeft, MapPin, Sparkles } from "lucide-react"

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-blue-50 text-slate-900">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-indigo-200 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-80 w-80 rounded-full bg-blue-200 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-3xl space-y-10 rounded-2xl border border-white/60 bg-white/70 p-10 shadow-xl backdrop-blur">
          <div className="flex items-center justify-center gap-3 text-indigo-600">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-[0.2em]">
              Lost in the campus
            </span>
          </div>

          <div className="space-y-6 text-center">
            <div className="inline-flex items-center gap-3 rounded-full bg-indigo-100 px-5 py-2 text-indigo-700 shadow-sm">
              <Compass className="h-5 w-5" />
              <span className="text-sm font-medium">Page not found</span>
            </div>
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Looks like this event trail ends here.
            </h1>
            <p className="text-pretty text-lg text-slate-600 sm:text-xl">
              The page you’re looking for has moved, expired, or never existed. Let’s get you back to
              discovering and organizing what matters on campus.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link href="/" className="sm:col-span-1">
              <Button variant="default" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back home
              </Button>
            </Link>
            <Link href="/events">
              <Button variant="outline" className="w-full gap-2">
                <MapPin className="h-4 w-4" />
                Browse events
              </Button>
            </Link>
            <Link href="/clubs">
              <Button variant="ghost" className="w-full gap-2 text-indigo-700 hover:bg-indigo-50">
                <Sparkles className="h-4 w-4" />
                Explore clubs
              </Button>
            </Link>
          </div>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/80 p-6 text-left shadow-sm">
            <p className="text-sm font-semibold text-indigo-800">Quick tips</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Check the URL for typos or missing parts.</li>
              <li>• If you followed an old link, the event may have been archived.</li>
              <li>• Head back to Events or Clubs to keep exploring.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
