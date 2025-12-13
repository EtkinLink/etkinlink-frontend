"use client"

// Next.js API route proxy kullan (same-origin, CORS yok)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "/api"
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

let onUnauthorized: ((resp?: Response) => void) | null = null
export function setUnauthorizedHandler(fn: ((resp?: Response) => void) | null) {
  onUnauthorized = fn
}

// --- Token Helpers ---
export function getToken(): string | null {
  if (typeof window === "undefined") return null
  const token = localStorage.getItem(TOKEN_KEY)
  return token
}
export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) {
    localStorage.setItem(TOKEN_KEY, token)
  } else {
    localStorage.removeItem(TOKEN_KEY)
  }
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

function formatToDBDatetime(isoString: string | undefined): string | undefined {
  if (!isoString) return undefined
  return isoString.replace('T', ' ').replace('Z', '')
}

// --- Ana Fetch Fonksiyonu ---
async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}, withAuth = true): Promise<T> {
  // URL'de trailing slash sorunu olmasın diye, endpoint'ı normalize et
  const normalizedEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint
  const url = `${API_BASE_URL}${normalizedEndpoint}`

  // 🔧 Plain object kullan, Headers object yerine
  const headers: Record<string, string> = {}
  
  // options'dan gelen headers'ı kopyala
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value
      })
    } else {
      Object.assign(headers, options.headers as Record<string, string>)
    }
  }
  
  // Content-Type ekle (varsa)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  // Authorization header ekle
  const token = withAuth ? getToken() : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // exclude headers from options, add our complete headers
  const { headers: _, ...restOptions } = options
  const fetchOptions: RequestInit = {
    ...restOptions,
    headers,
  }

  const response = await fetch(url, fetchOptions)

  if (!response.ok) {
    const fallback = { error: { message: "An error occurred" } }
    const payload = await response.json().catch(() => fallback)
    const msg =
      payload?.error?.message ||
      payload?.message ||
      (Array.isArray(payload?.errors) ? payload.errors.join(", ") : undefined) ||
      `HTTP ${response.status}`

    if (response.status === 401 && onUnauthorized) {
      const lower = (msg || "").toLowerCase()
      const looksLikeTokenError =
        lower.includes("token") || lower.includes("expired") || lower.includes("invalid") || lower.includes("jwt")
      if (looksLikeTokenError) {
        try { onUnauthorized(response) } catch {}
      }
    }

    throw new APIError(msg, response.status, payload?.error?.code, payload?.error?.details)
  }

  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

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
    const data = await fetchAPI<any>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    )
    const token = data?.access_token || data?.token
    if (!token) {
      throw new Error('Login response token içermiyor')
    }
    setToken(token)
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
    return items.map((item: any) => ({
      ...item,
      id: item.id ?? item.event_id ?? item.eventId,
      participation_status: item.participation_status ?? item.status ?? null,
    }))
  },
  getMyBadges: async () => [],
  getAllBadges: async () => [],
  getMyClubs: async () => {
    try {
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
    } catch (err) {
      console.error("getMyClubs failed; backend SQL hatası olabilir:", err)
      return []
    }
  },
  getMyOrganizations: async () => api.getMyClubs(),

  // ---------- Dictionaries ----------
  getUniversities: () => fetchAPI("/universities"),
  getEventTypes: async () => {
    const resp = await fetchAPI("/event_types")
    if (Array.isArray(resp)) return resp
    if (resp && Array.isArray((resp as any).data)) return (resp as any).data
    return mapPaginatedResponse(resp).items ?? []
  },
  
  // ---------- Events ----------
  // ✅ DÜZELTME: Trailing slash tutarlılığı - sondaki / YOK
  getEvents: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString()
    const endpoint = `/events${query ? '?' + query : ''}`
    return fetchAPI(endpoint).then(mapPaginatedResponse)
  },
  
  getEvent: (id: number) => fetchAPI(`/events/${id}`),
  
  // ✅ DÜZELTME: Trailing slash tutarlılığı - sondaki / YOK
  createEvent: (data: any) => {
    const payload = {
        ...data,
        starts_at: data.starts_at ? formatToDBDatetime(data.starts_at) : undefined,
        ends_at: data.ends_at ? formatToDBDatetime(data.ends_at) : undefined,
    };

    return fetchAPI("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  
  updateEvent: (id: number, data: any) =>
    fetchAPI(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: number) =>
    fetchAPI(`/events/${id}`, { method: "DELETE" }),
  updateEventStatus: async () => ({ message: "Not supported" }),

  filterEvents: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString()
    return fetchAPI(`/events/filter${query ? '?' + query : ''}`).then(mapPaginatedResponse)
  },
  getNearbyEvents: (lat: number, lng: number, radiusKm = 10, params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString()
    return fetchAPI(`/events${query ? '?' + query : ''}`).then(mapPaginatedResponse)
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
    return Array.isArray(resp) ? resp : resp?.attendance ?? []
  },
  setAttendance: async (eventId: number, userId: number, status: "ATTENDED" | "NO_SHOW") =>
    fetchAPI(`/events/${eventId}/attendance/${userId}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  // ---------- Event Applications ----------
  createApplication: (eventId: number, whyMe?: string) =>
    fetchAPI(`/events/${eventId}/apply`, {
      method: "POST",
      body: JSON.stringify({ why_me: whyMe }),
    }),
  getApplications: async (eventId: number) => {
    try {
      const resp = await fetchAPI(`/events/${eventId}/applications`)
      const items = mapPaginatedResponse(resp).items ?? []
      console.log("Applications raw response:", resp)
      console.log("Applications mapped items:", items)
      // Backend 'application_id' döndürüyor, 'id'ye map et
      const mapped = items.map((item: any) => ({
        ...item,
        id: item.application_id || item.id,
      }))
      console.log("Applications final mapped:", mapped)
      return mapped
    } catch (error: any) {
      console.error("Error fetching applications:", error)
      throw error
    }
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
  
  // ---------- Reports ----------
  createReport: (eventId: number, reason: string) =>
    fetchAPI(`/events/${eventId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getReports: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params as any).toString()
    return fetchAPI(`/events/my-reports${query ? '?' + query : ''}`).then(mapPaginatedResponse)
  },

  // ---------- Organizations ----------
  // ✅ DÜZELTME: Trailing slash tutarlılığı
  getClubs: async (universityId?: number, search?: string) => {
    const resp = await fetchAPI("/organizations")
    const items = mapPaginatedResponse(resp).items ?? []
    let filtered = Array.isArray(items) ? items : []
    return filtered.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      university_name: item.university_name ?? "",
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
      university_name: data.university_name ?? "",
      owner_user_id: null,
      owner_username: data.owner_username,
      member_count: Array.isArray(data.members) ? data.members.length : 0,
      join_method: joinMethod,
      status: data.status,
      photo_url: data.photo_url,
      events: Array.isArray(data.events) ? data.events.map((ev: any) => ({
          id: ev.id, title: ev.title, starts_at: ev.starts_at, ends_at: ev.ends_at,
          status: ev.status, event_type: ev.event_type,
        })) : [],
      members: Array.isArray(data.members) ? data.members.map((m: any) => ({
          id: m.id, username: m.username, role: m.role, joined_at: m.joined_at, name: m.name,
        })) : [],
    }
  },
  
  // ✅ DÜZELTME: Trailing slash tutarlılığı - sondaki / YOK
  createClub: (data: { name: string; description?: string }) =>
    fetchAPI("/organizations", { 
      method: "POST", 
      body: JSON.stringify(data) 
    }),
  
  joinClub: async (clubId: number, motivation?: string) =>
    fetchAPI(`/organizations/${clubId}/apply`, { 
      method: "POST", 
      body: JSON.stringify({ motivation: motivation || "" }) 
    }),
    
  leaveClub: async (clubId: number) => {
    const userId = getUserIdFromToken()
    if (!userId) throw new APIError("User id missing from token", 400)
    return fetchAPI(`/organizations/${clubId}/members/${userId}`, { method: "DELETE" })
  },
  
  getMyClubApplicationStatus: async (clubId: number) => {
    const tokenUserId = getUserIdFromToken()
    let status: "MEMBER" | "ADMIN" | "PENDING" | null = null

    try {
      const data = await fetchAPI<any>(`/organizations/${clubId}`)
      const members = Array.isArray(data?.members) ? data.members : []
      if (tokenUserId) {
        const me = members.find((m: any) => m.id === tokenUserId)
        if (me) { status = me.role === "ADMIN" ? "ADMIN" : "MEMBER" }
      }
    } catch {/* ignore */}
    
    if (!status) {
      try {
        const resp = await fetchAPI<any>("/users/me/organizations")
        const entry = mapPaginatedResponse(resp).items?.find((o: any) => o.id === clubId)
        if (entry && entry.relation === "APPLIED") { status = "PENDING" }
      } catch {/* ignore */}
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
  
  // ✅ YENİ: Organization güncelleme
  updateClub: (clubId: number, data: { description?: string; photo_url?: string; status?: string }) =>
    fetchAPI(`/organizations/${clubId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  
  // ✅ YENİ: Organization silme
  deleteClub: (clubId: number) =>
    fetchAPI(`/organizations/${clubId}`, { method: "DELETE" }),
  
  // ✅ YENİ: Attendance işlemi (status güncelleme)
  setEventAttendanceStatus: (eventId: number, userId: number, status: "ATTENDED" | "NO_SHOW") =>
    fetchAPI(`/events/${eventId}/attendance/${userId}`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  
  // ✅ YENİ: Tüm applications'ı getir
  getAllApplications: async () => {
    const resp = await fetchAPI("/applications")
    return mapPaginatedResponse(resp).items ?? []
  },
  
  // ✅ YENİ: Tüm participants'ı getir
  getAllParticipants: async () => {
    const resp = await fetchAPI("/participants")
    return mapPaginatedResponse(resp).items ?? []
  },
    
  // ---------- Notifications ----------
  getNotifications: async () => [],
  markNotificationsRead: async () => ({ message: "Not supported" }),
}