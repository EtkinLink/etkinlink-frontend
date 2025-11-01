"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarPlus } from "lucide-react"

type CalendarEvent = {
  id: number
  title: string
  starts_at: string
  ends_at?: string | null
  location_name?: string | null
  explanation?: string | null
}

const toICSDate = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(
    date.getUTCHours()
  )}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
}

const buildICS = (event: CalendarEvent) => {
  const start = new Date(event.starts_at)
  const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 60 * 60 * 1000)
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EtkinLink//Event Calendar//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:event-${event.id}@etkinlink`,
    `DTSTAMP:${toICSDate(new Date())}`,
    `DTSTART:${toICSDate(start)}`,
    `DTEND:${toICSDate(end)}`,
    `SUMMARY:${event.title}`,
    event.location_name ? `LOCATION:${event.location_name}` : "",
    event.explanation ? `DESCRIPTION:${event.explanation.replace(/\r?\n/g, "\\n")}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n")
  return lines
}

export function AddToCalendarButton({ event }: { event: CalendarEvent }) {
  const [isSaving, setIsSaving] = useState(false)

  const handleClick = () => {
    setIsSaving(true)
    try {
      const icsContent = buildICS(event)
      const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${event.title.replace(/\s+/g, "_")}.ics`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Button variant="outline" className="w-full bg-transparent" onClick={handleClick} disabled={isSaving}>
      <CalendarPlus className="mr-2 h-4 w-4" />
      {isSaving ? "Preparing..." : "Add to Calendar"}
    </Button>
  )
}
