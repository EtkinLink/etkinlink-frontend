"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateEventPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [eventTypes, setEventTypes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    explanation: "",
    price: "0",
    starts_at: "",
    ends_at: "",
    location_name: "",
    user_limit: "",
    type_id: "",
    latitude: "",
    longitude: "",
  })

  useEffect(() => {
    if (!user) {
      router.push("/auth/login")
      return
    }
    fetchEventTypes()
  }, [user])

  const fetchEventTypes = async () => {
    try {
      const types = await api.getEventTypes()
      setEventTypes(types)
    } catch (error) {
      console.error("Failed to fetch event types:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const payload: any = {
        title: formData.title,
        explanation: formData.explanation,
        price: Number.parseFloat(formData.price),
        starts_at: new Date(formData.starts_at).toISOString(),
        status: "FUTURE",
      }

      if (formData.ends_at) payload.ends_at = new Date(formData.ends_at).toISOString()
      if (formData.location_name) payload.location_name = formData.location_name
      if (formData.user_limit) payload.user_limit = Number.parseInt(formData.user_limit)
      if (formData.type_id) payload.type_id = Number.parseInt(formData.type_id)
      if (formData.latitude) payload.latitude = Number.parseFloat(formData.latitude)
      if (formData.longitude) payload.longitude = Number.parseFloat(formData.longitude)

      const response = await api.createEvent(payload)
      router.push(`/events/${response.id}`)
    } catch (error: any) {
      alert(error.message || "Failed to create event")
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container py-8">
        <Link href="/events">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>

        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>Create New Event</CardTitle>
            <CardDescription>Fill in the details to create your event</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Event Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  required
                  placeholder="Enter event title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="explanation">Description *</Label>
                <Textarea
                  id="explanation"
                  value={formData.explanation}
                  onChange={(e) => handleChange("explanation", e.target.value)}
                  required
                  placeholder="Describe your event"
                  rows={4}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="type_id">Event Type</Label>
                  <Select value={formData.type_id} onValueChange={(value) => handleChange("type_id", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id.toString()}>
                          {type.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Start Date & Time *</Label>
                  <Input
                    id="starts_at"
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => handleChange("starts_at", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ends_at">End Date & Time</Label>
                  <Input
                    id="ends_at"
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => handleChange("ends_at", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_name">Location</Label>
                <Input
                  id="location_name"
                  value={formData.location_name}
                  onChange={(e) => handleChange("location_name", e.target.value)}
                  placeholder="Event location"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="user_limit">Participant Limit</Label>
                  <Input
                    id="user_limit"
                    type="number"
                    min="1"
                    value={formData.user_limit}
                    onChange={(e) => handleChange("user_limit", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => handleChange("latitude", e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => handleChange("longitude", e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={isLoading} className="flex-1">
                  {isLoading ? "Creating..." : "Create Event"}
                </Button>
                <Link href="/events" className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
