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
            position: relative;
            width: 42px;
            height: 52px;
            filter: drop-shadow(0 6px 12px ${isDark ? 'rgba(129, 140, 248, 0.35)' : 'rgba(99, 102, 241, 0.4)'});
          ">
            <div style="
              width: 42px;
              height: 42px;
              background: ${isDark
                ? "linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)"
                : "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)"};
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 3px solid ${isDark ? '#334155' : 'white'};
              box-shadow: inset 0 2px 8px rgba(255, 255, 255, 0.15);
            ">
              <span style="
                transform: rotate(45deg);
                display: block;
                font-size: 20px;
                line-height: 1;
                margin-top: -3px;
                margin-left: -1px;
                filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
              ">📍</span>
            </div>
            <div style="
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 6px;
              height: 10px;
              background: ${isDark ? '#818cf8' : '#6366f1'};
              border-radius: 0 0 3px 3px;
              opacity: 0.7;
            "></div>
          </div>
        `

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "custom-marker-icon",
          iconSize: [42, 52],
          iconAnchor: [21, 52],
          popupAnchor: [0, -52],
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

  // Tüm marker konumlarını içeren bounds hesapla
  const bounds: LatLngBoundsExpression | undefined = useMemo(() => {
    if (markers.length === 0) return undefined

    if (markers.length === 1) {
      // Tek marker varsa, merkez noktası olarak kullan
      return undefined
    }

    // Birden fazla marker varsa, hepsini kapsayan bounds oluştur
    return markers.map((event) => [event.latitude as number, event.longitude as number]) as LatLngTuple[]
  }, [markers])

  const center: LatLngTuple = useMemo(() => {
    if (markers.length === 0) return DEFAULT_CENTER

    if (markers.length === 1) {
      return [markers[0].latitude as number, markers[0].longitude as number]
    }

    // Birden fazla marker varsa, merkez noktasını hesapla
    const avgLat = markers.reduce((sum, m) => sum + (m.latitude as number), 0) / markers.length
    const avgLng = markers.reduce((sum, m) => sum + (m.longitude as number), 0) / markers.length
    return [avgLat, avgLng]
  }, [markers])

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
        boundsOptions={bounds ? { padding: [50, 50] } : undefined}
        zoom={markers.length === 1 ? 15 : zoom}
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
              <DynamicPopup className="custom-popup" maxWidth={280}>
                <div className="p-3 space-y-2 min-w-[220px]">
                  <div className="flex items-start gap-2">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-base">🎉</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                        {event.title}
                      </p>
                    </div>
                  </div>

                  {event.location_name && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                      <span className="text-sm">📍</span>
                      <span className="line-clamp-1">{event.location_name}</span>
                    </div>
                  )}

                  {event.starts_at && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-2.5 py-1.5">
                      <span className="text-sm">🕒</span>
                      <span>
                        {new Date(event.starts_at).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  )}

                  <div className="pt-1 border-t border-border/50">
                    <p className="text-xs text-primary font-medium cursor-pointer hover:underline flex items-center gap-1">
                      <span>View event details</span>
                      <span className="text-base">→</span>
                    </p>
                  </div>
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
