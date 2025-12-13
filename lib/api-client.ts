"use client"

// Yeni backend base adresi
const API_BASE_URL =
  typeof window === "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "/api"
    : "/api"

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
  signup: (payload: { email: string; password: string; name: string; gender: "MALE" | "FEMALE" }) =>
    fetchAPI<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: payload.email,
        password: payload.password,
        name: payload.name,
        gender: payload.gender,
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
    // Backend bazen "event_id" döndürüyor; frontend "id" bekliyor.
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
      const userId = getUserIdFromToken()
      if (!userId) return []

      // Get all organizations
      const allOrgsResp = await fetchAPI<any>("/organizations")
      const allOrgs = mapPaginatedResponse(allOrgsResp).items ?? []

      // For each organization, fetch details to get members
      const myClubs: any[] = []

      for (const org of allOrgs) {
        try {
          const orgData = await fetchAPI<any>(`/organizations/${org.id}`)
          const members = Array.isArray(orgData.members) ? orgData.members : []

          // Check if current user is a member OR owner
          let myMembership = members.find((m: any) => m.id === userId)

          // If not in members list, check if user is the owner
          if (!myMembership && orgData.owner_user_id === userId) {
            myMembership = { id: userId, role: 'ADMIN' }
          }

          if (myMembership) {
            myClubs.push({
              id: orgData.id,
              name: orgData.name,
              description: orgData.description,
              role: myMembership.role || 'ADMIN',
              member_count: members.length,
            })
          }
        } catch (err) {
          continue
        }
      }

      return myClubs
    } catch (err) {
      console.error("getMyClubs failed; backend SQL hatası olabilir:", err)
      // Backend UNION collation hatası yüzünden UI'yi kırmamak için boş liste dön.
      return []
    }
  },
  // Eski adıyla alias (gerekirse kullanıcıya özel listeye dönmek için)
  getMyOrganizations: async () => api.getMyClubs(),

  // ---------- Dictionaries ----------
  getUniversities: () => fetchAPI("/universities"),
  getEventTypes: async () => {
    const resp = await fetchAPI("/event_types")
    // Backend farklı şekillerde dönebiliyor, hepsini yakala
    if (Array.isArray(resp)) return resp
    if (resp && Array.isArray((resp as any).data)) return (resp as any).data
    if (resp && Array.isArray((resp as any).items)) return (resp as any).items
    if (resp && Array.isArray((resp as any).event_types)) return (resp as any).event_types
    return mapPaginatedResponse(resp).items ?? []
  },
  
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
      body: JSON.stringify(payload),
    })
  },
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
  joinEvent: (eventId: number, hasRegister?: boolean) => {
    // If event requires application (has_register=true), use apply endpoint
    // Otherwise use direct register endpoint
    const endpoint = hasRegister
      ? `/events/${eventId}/apply`
      : `/events/${eventId}/register`
    return fetchAPI(endpoint, { method: "POST" })
  },
  leaveEvent: async (eventId: number) => {
    const userId = getUserIdFromToken()
    if (!userId) throw new APIError("User id missing from token", 400)
    return fetchAPI(`/events/${eventId}/participants/${userId}`, { method: "DELETE" })
  },

  // ---------- Check-in / Attendance ----------
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
  checkInEvent: async (eventId: number, ticketCode: string) =>
    fetchAPI(`/events/${eventId}/check-in`, {
      method: "POST",
      body: JSON.stringify({ ticket_code: ticketCode }),
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
  /**
   * getClubs - Backend destekli filtreleme ile clubs çek
   * @param params: {
   *   university_id?: number,
   *   q?: string,
   *   status?: string,
   *   owner_username?: string,
   *   page?: number,
   *   per_page?: number
   * }
   */
  getClubs: async (params?: {
    university_id?: number,
    q?: string,
    status?: string,
    owner_username?: string,
    page?: number,
    per_page?: number
    search?: string
  }) => {
    const query = params && Object.keys(params).length > 0
      ? `?${new URLSearchParams(Object.entries(params).reduce((acc, [k, v]) => {
          if (v !== undefined && v !== null && v !== "") acc[k] = String(v)
          return acc
        }, {} as Record<string, string>))}`
      : ""
    const resp = await fetchAPI(`/organizations${query}`)
    const items = mapPaginatedResponse(resp).items ?? []
    return Array.isArray(items) ? items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      university_name: item.university_name ?? "",
      university_id: item.university_id ?? null,
      member_count: item.member_count ?? 0,
      status: item.status,
      photo_url: item.photo_url,
      owner_username: item.owner_username,
    })) : []
  },
  getClub: async (id: number) => {
    const data = await fetchAPI<any>(`/organizations/${id}`)
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      owner_user_id: null,
      owner_username: data.owner_username,
      university_name: "",
      member_count: Array.isArray(data.members) ? data.members.length : 0,
      join_method: data.join_method ?? "OPEN",
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
    
  // ---------- Notifications (not available) ----------
  getNotifications: async () => [],
  markNotificationsRead: async () => ({ message: "Not supported" }),
}
