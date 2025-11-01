"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { MapContainerProps } from "react-leaflet"
import type { LatLngTuple, LatLngBoundsExpression, DivIcon } from "leaflet"
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

  useEffect(() => {
    let mounted = true

    import("leaflet")
      .then((module) => {
        if (!mounted) return
        const L = module.default ?? module

        const iconHtml = `
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 18px 18px 18px 4px;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 18px rgba(99, 102, 241, 0.35);
            color: white;
            font-weight: 600;
            font-size: 14px;
          ">
            <span style="transform: rotate(45deg); display:block;">★</span>
          </div>
        `

        const customIcon = L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [36, 36],
          iconAnchor: [18, 28],
          popupAnchor: [0, -24],
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
  }, [])

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
        <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
          Loading map...
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
      >
        <DynamicTileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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
              <DynamicPopup>
                <div className="space-y-1">
                  <p className="font-semibold">{event.title}</p>
                  {event.location_name && <p className="text-xs text-muted-foreground">{event.location_name}</p>}
                  {event.starts_at && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.starts_at).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  )}
                </div>
              </DynamicPopup>
            </DynamicMarker>
          ))}
      </DynamicMapContainer>
      {!hasMarkers && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mb-4 flex justify-center">
          <div className="rounded-full bg-background/90 px-4 py-2 text-xs text-muted-foreground shadow-md">
            Location details haven’t been shared yet.
          </div>
        </div>
      )}
    </div>
  )
}
