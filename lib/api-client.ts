"use client"

// Yeni backend base adresi
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://165.22.91.113:5000"

// Token saklama anahtarı
const TOKEN_KEY = "access_token"

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: any,
  ) {
    super(message)
    this.name = "APIError"
  }
}

// Global 401 handler
let onUnauthorized: ((resp?: Response) => void) | null = null
export function setUnauthorizedHandler(fn: ((resp?: Response) => void) | null) {
  onUnauthorized = fn
}

// --- Token Helpers ---
export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
}
export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

function decodeJwtPayload(token: string | null) {
  if (!token) return null
  try {
    const [, payload] = token.split(".")
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")))
    return decoded
  } catch {
    return null
  }
}

function getUserIdFromToken(): number | null {
  const payload = decodeJwtPayload(getToken())
  return payload?.userId ?? null
}

// --- Ana Fetch Fonksiyonu ---
async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}, withAuth = true): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    ...(options.body && !(options.body instanceof FormData) && !new Headers(options.headers || {}).has("Content-Type")
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  }

  const token = withAuth ? getToken() : null
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401 && onUnauthorized) {
    try { onUnauthorized(response) } catch {}
  }

  if (!response.ok) {
    const fallback = { error: { message: "An error occurred" } }
    const payload = await response.json().catch(() => fallback)
    const msg =
      payload?.error?.message ||
      payload?.message ||
      (Array.isArray(payload?.errors) ? payload.errors.join(", ") : undefined) ||
      `HTTP ${response.status}`
    throw new APIError(msg, response.status, payload?.error?.code, payload?.error?.details)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

// Helper: paginated response'u UI'nin beklediği formata çevir
function mapPaginatedResponse(resp: any) {
  if (resp && typeof resp === "object" && "data" in resp) {
    return {
      items: resp.data,
      pagination: resp.pagination,
    }
  }
  return { items: Array.isArray(resp) ? resp : [], pagination: null }
}

// --- API Endpoint'leri ---
export const api = {
  // ---------- Auth ----------
  loginWithPassword: async (email: string, password: string) => {
    const data = await fetchAPI<{ access_token: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    )
    setToken(data.access_token)
    return data
  },
  signup: (payload: { email: string; password: string; name: string; username?: string }) =>
    fetchAPI<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        username: payload.username,
      }),
    }, false),
  logout: () => setToken(null),
  forgotPassword: (email: string) =>
    fetchAPI("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email })
    }, false),
  resetPassword: (data: { token: string; new_password: string }) =>
    fetchAPI("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data)
    }, false),

  // ---------- User & Profile ----------
  getProfile: async () => {
    const profile = await fetchAPI<any>("/users/me")
    const userId = getUserIdFromToken()
    return {
      id: userId ?? null,
      attendance_rate: profile?.attendance_rate ?? -1,
      ...profile,
    }
  },
  updateProfile: (data: any) => {
    const payload: Record<string, any> = {}
    if (data.username) payload.username = data.username
    return fetchAPI("/users/me", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },
  getUserEvents: async (userId: number) => {
    const resp = await fetchAPI<any>(`/users/${userId}/events`)
    const items = mapPaginatedResponse(resp).items ?? []
    return items.filter((item: any) => item.participation_status !== "APPLIED")
  },
  getMyBadges: async () => [],
  getAllBadges: async () => [],
  getMyClubs: async () => {
    const resp = await fetchAPI<any>("/users/me/organizations")
    const mapped = mapPaginatedResponse(resp).items ?? []
    const items = Array.isArray(mapped) ? mapped : []
    return items
      .filter((item: any) => (item.relation || item.role) !== "APPLIED")
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        role: item.role || item.relation || null,
        member_count: item.member_count ?? null,
      }))
  },
  // Eski adıyla alias (gerekirse kullanıcıya özel listeye dönmek için)
  getMyOrganizations: async () => api.getMyClubs(),

  // ---------- Dictionaries ----------
  getUniversities: () => fetchAPI("/universities"),
  getEventTypes: () => fetchAPI("/event_types"),
  
  // ---------- Events ----------
  getEvents: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : ""
    return fetchAPI(`/events${query}`).then(mapPaginatedResponse)
  },
  getEvent: (id: number) => fetchAPI(`/events/${id}`),
  createEvent: (data: any) =>
    fetchAPI("/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvent: (id: number, data: any) =>
    fetchAPI(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: number) =>
    fetchAPI(`/events/${id}`, { method: "DELETE" }),
  updateEventStatus: async () => ({ message: "Not supported in current backend" }),
  filterEvents: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : ""
    return fetchAPI(`/events/filter${query}`).then(mapPaginatedResponse)
  },
  getNearbyEvents: (lat: number, lng: number, radiusKm = 10, params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : ""
    return fetchAPI(`/events${query}`).then(mapPaginatedResponse)
  },

  // ---------- Participation ----------
  joinEvent: (eventId: number) =>
    fetchAPI(`/events/${eventId}/register`, { method: "POST" }),
  leaveEvent: async (eventId: number) => {
    const userId = getUserIdFromToken()
    if (!userId) throw new APIError("User id missing from token", 400)
    return fetchAPI(`/events/${eventId}/participants/${userId}`, { method: "DELETE" })
  },
    
  // ---------- Attendance ----------
  getAttendance: async (eventId: number) => {
    const resp = await fetchAPI(`/events/${eventId}/attendance`)
    // Backend may return either an array or an object with an "attendance" field
    return Array.isArray(resp) ? resp : resp?.attendance ?? []
  },
  setAttendance: async (eventId: number, userId: number, status: "ATTENDED" | "NO_SHOW") =>
    fetchAPI(`/events/${eventId}/attendance/${userId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // ---------- Event Applications ----------
  createApplication: (eventId: number, whyMe?: string) =>
    fetchAPI(`/events/${eventId}/apply`, {
      method: "POST",
      body: JSON.stringify({ why_me: whyMe }),
    }),
  getApplications: async (eventId: number) => {
    const resp = await fetchAPI(`/events/${eventId}/applications`)
    return mapPaginatedResponse(resp).items
  },
  patchApplication: (applicationId: number, status: "APPROVED" | "REJECTED") =>
    fetchAPI(`/applications/${applicationId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),

  // ---------- Ratings ----------
  getRatings: (eventId: number) => fetchAPI(`/events/${eventId}/ratings`),
  createRating: (eventId: number, rating: number, comment?: string) =>
    fetchAPI(`/events/${eventId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),

  // ---------- Organizations (Clubs placeholder) ----------
  getClubs: async (universityId?: number) => {
    const resp = await fetchAPI("/organizations")
    const items = mapPaginatedResponse(resp).items ?? []
    const filtered = typeof universityId === "number"
      ? items.filter((item: any) => item.university_id === universityId)
      : items
    return filtered.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      university_name: "",
      member_count: item.member_count ?? 0,
      status: item.status,
      photo_url: item.photo_url,
      owner_username: item.owner_username,
    })) ?? []
  },
  getClub: async (id: number) => {
    const data = await fetchAPI<any>(`/organizations/${id}`)
    const joinMethod: "OPEN" | "APPLICATION_ONLY" =
      data?.join_method === "OPEN" ? "OPEN" : "APPLICATION_ONLY"
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      owner_user_id: null,
      owner_username: data.owner_username,
      university_name: "",
      member_count: Array.isArray(data.members) ? data.members.length : 0,
      join_method: joinMethod,
      status: data.status,
      photo_url: data.photo_url,
      events: Array.isArray(data.events)
        ? data.events.map((ev: any) => ({
            id: ev.id,
            title: ev.title,
            starts_at: ev.starts_at,
            ends_at: ev.ends_at,
            status: ev.status,
            event_type: ev.event_type,
          }))
        : [],
      members: Array.isArray(data.members)
        ? data.members.map((m: any) => ({
            id: m.id,
            username: m.username,
            role: m.role,
            joined_at: m.joined_at,
            name: m.name,
          }))
        : [],
    }
  },
  createClub: (data: { name: string; description?: string }) =>
    fetchAPI("/organizations", { method: "POST", body: JSON.stringify(data) }),
  joinClub: async (clubId: number) =>
    fetchAPI(`/organizations/${clubId}/apply`, { method: "POST", body: JSON.stringify({ motivation: "" }) }),
  leaveClub: async (clubId: number) => {
    const userId = getUserIdFromToken()
    if (!userId) throw new APIError("User id missing from token", 400)
    return fetchAPI(`/organizations/${clubId}/members/${userId}`, { method: "DELETE" })
  },
  getMyClubApplicationStatus: async (clubId: number) => {
    const tokenUserId = getUserIdFromToken()
    let status: "MEMBER" | "ADMIN" | "PENDING" | null = null

    // 1) Üyelik kontrolü (detay endpoint)
    try {
      const data = await fetchAPI<any>(`/organizations/${clubId}`)
      const members = Array.isArray(data?.members) ? data.members : []
      if (tokenUserId) {
        const me = members.find((m: any) => m.id === tokenUserId)
        if (me) {
          status = me.role === "ADMIN" ? "ADMIN" : "MEMBER"
        }
      }
    } catch {
      // ignore, try next check
    }

    if (status) return { status }

    // 2) Başvuru kontrolü (kullanıcının org listesi; relation=APPLIED)
    try {
      const resp = await fetchAPI<any>("/users/me/organizations")
      const entry = mapPaginatedResponse(resp).items?.find((o: any) => o.id === clubId)
      if (entry && entry.relation === "APPLIED") {
        status = "PENDING"
      }
    } catch {
      // ignore
    }

    return { status }
  },
  createClubApplication: (clubId: number, whyMe?: string) =>
    fetchAPI(`/organizations/${clubId}/apply`, {
      method: "POST",
      body: JSON.stringify({ motivation: whyMe }),
    }),
  getClubApplications: async (clubId: number) => {
    const resp = await fetchAPI(`/organizations/${clubId}/applications`)
    return mapPaginatedResponse(resp).items?.map((item: any) => ({
      ...item,
      why_me: item.why_me ?? item.motivation ?? null,
    }))
  },
  patchClubApplication: (clubId: number, applicationId: number, status: "APPROVED" | "REJECTED") => {
    const path =
      status === "APPROVED"
        ? `/organizations/${clubId}/applications/${applicationId}/approve`
        : `/organizations/${clubId}/applications/${applicationId}/reject`
    return fetchAPI(path, { method: "POST" })
  },
  getClubMembers: async (clubId: number) => {
    const data = await fetchAPI<any>(`/organizations/${clubId}`)
    return data.members ?? []
  },
  rejectClubApplication: (clubId: number, applicationId: number) =>
    fetchAPI(`/organizations/${clubId}/applications/${applicationId}/reject`, {
      method: "POST",
    }),
    
  // ---------- Notifications (not available) ----------
  getNotifications: async () => [],
  markNotificationsRead: async () => ({ message: "Not supported" }),
}
