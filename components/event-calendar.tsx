"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Badge } from "@/components/ui/badge"

const DayPicker = dynamic(async () => (await import("react-day-picker")).DayPicker, {
  ssr: false,
})

const loadCalendarStyles = () => {
  if (typeof window === "undefined") return
  const existing = document.querySelector<HTMLLinkElement>('link[data-daypicker="css"]')
  if (existing) return
  const link = document.createElement("link")
  link.rel = "stylesheet"
  link.href = "https://unpkg.com/react-day-picker@9.0.7/dist/style.css"
  link.setAttribute("data-daypicker", "css")
  document.head.appendChild(link)
}

type CalendarEvent = {
  id: number
  title: string
  starts_at: string
  event_type?: string
}

export function EventCalendar({ events }: { events: CalendarEvent[] }) {
  const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined)

  useEffect(() => {
    loadCalendarStyles()
  }, [])

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    events.forEach((event) => {
      if (!event.starts_at) return
      const date = new Date(event.starts_at)
      if (Number.isNaN(date.getTime())) return
      const key = date.toDateString()
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.get(key)!.push(event)
    })
    return map
  }, [events])

  const eventDates = useMemo(() => Array.from(eventsByDate.keys()).map((key) => new Date(key)), [eventsByDate])

  useEffect(() => {
    if (!selectedDay && eventDates.length > 0) {
      setSelectedDay(eventDates[0])
    }
  }, [eventDates, selectedDay])

  const selectedKey = selectedDay ? selectedDay.toDateString() : null
  const dayEvents = selectedKey ? eventsByDate.get(selectedKey) ?? [] : []

  return (
    <div className="space-y-4">
      <DayPicker
        mode="single"
        selected={selectedDay}
        onSelect={setSelectedDay}
        modifiers={{ eventDay: eventDates }}
        modifiersStyles={{
          eventDay: {
            backgroundColor: "rgba(99, 102, 241, 0.15)",
            color: "rgb(55, 48, 163)",
            borderRadius: "50%",
          },
        }}
        styles={{
          caption: { color: "rgb(17 24 39)", fontWeight: 600 },
        }}
      />
      <div>
        <p className="mb-2 text-sm font-medium text-muted-foreground">
          {selectedDay
            ? `Events on ${selectedDay.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}`
            : "Select a date to view events"}
        </p>
        {dayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events scheduled for this day.</p>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <div key={event.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold leading-tight">{event.title}</p>
                  {event.event_type && <Badge variant="secondary">{event.event_type}</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(event.starts_at).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
