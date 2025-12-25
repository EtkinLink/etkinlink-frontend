"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { MapContainerProps } from "react-leaflet"
import type { LatLngTuple, LatLngBoundsExpression, DivIcon } from "leaflet"
import { useTheme } from "@/lib/dark-mode-context"
import "leaflet/dist/leaflet.css"

const DynamicMapContainer = dynamic<MapContainerProps>(
  async () => (await import("react-leaflet")).MapContainer,
  { ssr: false }
)

const DynamicTileLayer = dynamic(
  async () => (await import("react-leaflet")).TileLayer,
  { ssr: false }
)

const DynamicMarker = dynamic(
  async () => (await import("react-leaflet")).Marker,
  { ssr: false }
)

const DynamicPopup = dynamic(
  async () => (await import("react-leaflet")).Popup,
  { ssr: false }
)

const DEFAULT_CENTER: LatLngTuple = [41.0082, 28.9784] // Istanbul

type MapEvent = {
  id: number
  title: string
  latitude: number | null
  longitude: number | null
  location_name?: string | null
  starts_at?: string | null
}

interface EventMapProps {
  events: MapEvent[]
  height?: number
  zoom?: number
  className?: string
  onEventClick?: (eventId: number) => void
}

export function EventMap({ events, height = 320, zoom = 12, className, onEventClick }: EventMapProps) {
  const [isLeafletReady, setIsLeafletReady] = useState(false)
  const [markerIcon, setMarkerIcon] = useState<DivIcon | null>(null)
  const router = useRouter()
  const { theme } = useTheme()

  useEffect(() => {
    let mounted = true

    import("leaflet")
      .then((module) => {
        if (!mounted) return
        const L = module.default ?? module

        const isDark = theme === "dark"
        const iconHtml = `
          <div style="
            width: 40px;
            height: 40px;
            background: ${isDark
              ? "linear-gradient(135deg, #818cf8, #a78bfa)"
              : "linear-gradient(135deg, #6366f1, #8b5cf6)"};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: ${isDark
              ? "0 4px 12px rgba(129, 140, 248, 0.4)"
              : "0 4px 12px rgba(99, 102, 241, 0.5)"};
            border: 3px solid ${isDark ? "#1e293b" : "white"};
            transition: all 0.2s ease;
          ">
            <span style="
              transform: rotate(45deg);
              display: block;
              font-size: 18px;
              margin-top: -4px;
            ">📍</span>
          </div>
        `

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-marker-icon",
          iconSize: [40, 40],
          iconAnchor: [20, 40],
          popupAnchor: [0, -40],
        })

        setMarkerIcon(customIcon)
        setIsLeafletReady(true)
      })
      .catch((error) => {
        console.error("Failed to load leaflet", error)
      })

    return () => {
      mounted = false
    }
  }, [theme])

  const markers = useMemo(
    () =>
      events.filter(
        (ev) =>
          typeof ev.latitude === "number" &&
          !Number.isNaN(ev.latitude) &&
          typeof ev.longitude === "number" &&
          !Number.isNaN(ev.longitude)
      ),
    [events]
  )

  const center: LatLngTuple = markers.length
    ? [markers[0].latitude as number, markers[0].longitude as number]
    : DEFAULT_CENTER

  const bounds: LatLngBoundsExpression | undefined =
    markers.length > 1
      ? (markers.map((event) => [event.latitude as number, event.longitude as number]) as LatLngTuple[])
      : undefined

  const containerClass = className ?? "w-full overflow-hidden rounded-lg border shadow-sm"
  const hasMarkers = markers.length > 0

  if (!isLeafletReady) {
    return (
      <div className={containerClass} style={{ height }}>
        <div className="flex h-full items-center justify-center bg-muted/50">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  const mapKey =
    markers.length > 0
      ? markers.map((event) => `${event.id}-${event.latitude}-${event.longitude}`).join("|")
      : "default"

  return (
    <div className={`${containerClass} relative`} style={{ height }}>
      <DynamicMapContainer
        center={center}
        bounds={bounds}
        zoom={zoom}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
        key={mapKey}
        className={theme === "dark" ? "dark-map" : ""}
      >
        <DynamicTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={
            theme === "dark"
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          }
        />
        {hasMarkers &&
          markers.map((event) => (
            <DynamicMarker
              key={`${event.id}-${event.latitude}-${event.longitude}`}
              position={[event.latitude as number, event.longitude as number]}
              icon={markerIcon ?? undefined}
              eventHandlers={{
                click: () => {
                  if (onEventClick) onEventClick(event.id)
                  else router.push(`/events/${event.id}`)
                },
              }}
            >
              <DynamicPopup className="custom-popup">
                <div className="space-y-1.5 min-w-[180px]">
                  <p className="font-semibold text-foreground text-sm leading-tight">{event.title}</p>
                  {event.location_name && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>📍</span>
                      {event.location_name}
                    </p>
                  )}
                  {event.starts_at && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>🕒</span>
                      {new Date(event.starts_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                  <p className="text-xs text-primary pt-1 cursor-pointer hover:underline">
                    Click to view details →
                  </p>
                </div>
              </DynamicPopup>
            </DynamicMarker>
          ))}
      </DynamicMapContainer>
      {!hasMarkers && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-card/95 backdrop-blur-sm border shadow-lg px-6 py-4 text-center max-w-xs">
            <p className="text-sm font-medium text-foreground mb-1">📍 No locations yet</p>
            <p className="text-xs text-muted-foreground">
              Location details haven&apos;t been shared for these events.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
