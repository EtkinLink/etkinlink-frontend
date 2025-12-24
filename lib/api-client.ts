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

// Check if token is expired
export function isTokenExpired(token: string | null): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload || !payload.exp) return true

  // JWT exp is in seconds, Date.now() is in milliseconds
  const expirationTime = payload.exp * 1000
  const now = Date.now()

  return now >= expirationTime
}

function getUserIdFromToken(): number | null {
  const payload = decodeJwtPayload(getToken())
  return payload?.userId ?? null
}

function formatToDBDatetime(isoString: string | undefined): string | undefined {
  if (!isoString) return undefined
  return isoString.replace("T", " ").replace("Z", "")
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

    // Debug: Check if token is expired
    if (isTokenExpired(token)) {
      console.warn(`⚠️ Token is expired for ${endpoint}`)
    }
  } else if (withAuth) {
    console.warn(`⚠️ No token found for authenticated request to ${endpoint}`)
  }

  const response = await fetch(url, { ...options, headers })

  if (response.status === 401 && onUnauthorized) {
    console.error(`🔒 401 Unauthorized on ${endpoint}. Token will be cleared.`)
    try { onUnauthorized(response) } catch {}
  }

  if (!response.ok) {
    const fallback = { error: { message: "An error occurred" } }
    const payload = await response.json().catch(() => fallback)
    const msg =
      payload?.error?.message ||
      (typeof payload?.error === 'string' ? payload.error : undefined) ||
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
  updateProfile: async (data: any) => {
    const payload: Record<string, any> = {}
    if (data.username) payload.username = data.username
    if (data.name) payload.name = data.name
    if (data.university_id !== undefined) payload.university_id = data.university_id
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
      const token = getToken()
      const username = decodeJwtPayload(token)?.username
      if (!userId) return []

      // Get all organizations to check ownership
      const allOrgsResp = await fetchAPI<any>("/organizations")
      const allOrgs = mapPaginatedResponse(allOrgsResp).items ?? []

      // Also get user's member organizations
      let memberOrgs: any[] = []
      try {
        const resp = await fetchAPI<any>("/users/me/organizations")
        memberOrgs = mapPaginatedResponse(resp).items ?? []
      } catch (err) {
        console.log("Could not fetch member organizations:", err)
      }

      // Find organizations where user is owner or member
      const myClubsMap = new Map<number, any>()

      // Add organizations where user is owner
      allOrgs.forEach((org: any) => {
        if (org.owner_username === username) {
          myClubsMap.set(org.id, {
            id: org.id,
            name: org.name,
            description: org.description,
            role: 'ADMIN',
            member_count: org.member_count ?? 0,
          })
        }
      })

      // Add organizations where user is a member
      memberOrgs.forEach((org: any) => {
        if (!myClubsMap.has(org.id)) {
          myClubsMap.set(org.id, {
            id: org.id,
            name: org.name,
            description: org.description,
            role: org.role || (org.relation === 'ADMIN' ? 'ADMIN' : 'MEMBER'),
            member_count: org.member_count ?? 0,
          })
        }
      })

      return Array.from(myClubsMap.values())
    } catch (err) {
      console.error("getMyClubs failed:", err)
      return []
    }
  },
  // Eski adıyla alias (gerekirse kullanıcıya özel listeye dönmek için)
  getMyOrganizations: async () => api.getMyClubs(),

  // ---------- Dictionaries ----------
  getUniversities: () => fetchAPI("/universities", {}, false),
  getEventTypes: async () => {
    const resp = await fetchAPI("/event_types", {}, false)
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
  getMyEvents: async (opts?: { userId?: number; username?: string; perPage?: number }) => {
    // Use /users/me/events endpoint which returns user's participated events
    const params: Record<string, any> = {
      page: 1,
      per_page: opts?.perPage ?? 50,
    }
    const query = new URLSearchParams(params as any).toString()
    const resp = await fetchAPI(`/users/me/events${query ? '?' + query : ''}`)
    const items = mapPaginatedResponse(resp).items ?? []
    return items.map((item: any) => ({
      ...item,
      id: item.event_id ?? item.id,
      title: item.event_title ?? item.title,
      participation_status: item.participation_status ?? item.status ?? null,
    }))
  },

  getMyOwnedEvents: async (opts?: { perPage?: number }) => {
    const userId = getUserIdFromToken()
    if (!userId) return []

    const params: Record<string, any> = {
      page: 1,
      per_page: opts?.perPage ?? 50,
    }

    const query = new URLSearchParams(params as any).toString()

    const resp = await fetchAPI(`/users/${userId}/events${query ? "?" + query : ""}`)
    const items = mapPaginatedResponse(resp).items ?? []

    return items
      .filter((item: any) => (item.participation_status ?? item.status) === "OWNER")
      .map((item: any) => ({
        ...item,
        id: item.event_id ?? item.id,
        title: item.event_title ?? item.title,
        participation_status: item.participation_status ?? item.status ?? null,
      }))
  },

  
  createEvent: (data: any) => {
    const payload: Record<string, any> = {
      title: data.title,
      explanation: data.explanation,
      type_id: data.type_id ?? data.typeId,
      owner_type: data.owner_type ?? "USER",
      price: data.price ?? 0,
      starts_at: data.starts_at ? formatToDBDatetime(data.starts_at) : undefined,
      ends_at: data.ends_at ? formatToDBDatetime(data.ends_at) : undefined,
      location_name: data.location_name ?? data.locationName,
      has_register: data.has_register ?? false,
      user_limit: data.user_limit ?? data.userLimit,
      is_participants_private: data.is_participants_private ?? false,
      only_girls: data.only_girls ?? false,
    }

    // Optional fields
    if (data.organization_id) payload.organization_id = data.organization_id
    if (data.photo_url) payload.photo_url = data.photo_url
    if (data.latitude !== undefined) payload.latitude = data.latitude
    if (data.longitude !== undefined) payload.longitude = data.longitude

    return fetchAPI("/events", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  updateEvent: (id: number, data: any) => {
    const payload: Record<string, any> = {}

    // Only include fields that are provided
    if (data.title !== undefined) payload.title = data.title
    if (data.explanation !== undefined) payload.explanation = data.explanation
    if (data.type_id !== undefined) payload.type_id = data.type_id
    if (data.price !== undefined) payload.price = data.price
    if (data.starts_at) payload.starts_at = formatToDBDatetime(data.starts_at)
    if (data.ends_at) payload.ends_at = formatToDBDatetime(data.ends_at)
    if (data.location_name !== undefined) payload.location_name = data.location_name
    if (data.photo_url !== undefined) payload.photo_url = data.photo_url
    if (data.status !== undefined) payload.status = data.status
    if (data.user_limit !== undefined) payload.user_limit = data.user_limit
    if (data.latitude !== undefined) payload.latitude = data.latitude
    if (data.longitude !== undefined) payload.longitude = data.longitude
    if (data.has_register !== undefined) payload.has_register = data.has_register
    if (data.is_participants_private !== undefined) payload.is_participants_private = data.is_participants_private
    if (data.only_girls !== undefined) payload.only_girls = data.only_girls

    return fetchAPI(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },
  deleteEvent: (id: number) => {
    return fetchAPI(`/events/${id}`, { method: "DELETE" })
  },
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
  manualCheckIn: async (eventId: number, idValue: number) =>
    fetchAPI(`/events/${eventId}/manual-check-in`, {
      method: "POST",
      body: JSON.stringify({ participant_id: idValue }),
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
  patchApplication: (applicationId: number, status: "APPROVED" | "REJECTED") => {
    return fetchAPI(`/applications/${applicationId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status })
    })
  },

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
    university_id?: number
    q?: string
    status?: string
    owner_username?: string
    page?: number
    per_page?: number
    search?: string
  }) => {
    const hasFilters =
      !!(params?.q && params.q.trim()) ||
      params?.university_id !== undefined ||
      !!(params?.search && params.search.trim())

    const mapped: Record<string, string> = {}

    const q = (params?.q ?? params?.search ?? "").trim()
    if (q) mapped.q = q

    if (params?.university_id !== undefined && params?.university_id !== null) {
      mapped.university = String(params.university_id) // backend: /organizations/filter expects "university"
    }

    if (params?.page) mapped.page = String(params.page)
    if (params?.per_page) mapped.per_page = String(params.per_page)

    const query = Object.keys(mapped).length ? `?${new URLSearchParams(mapped)}` : ""

    const endpoint = hasFilters ? `/organizations/filter${query}` : `/organizations${query}`

    const resp = await fetchAPI(endpoint)
    const items = mapPaginatedResponse(resp).items ?? []

    return Array.isArray(items)
      ? items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          university_name: item.university_name ?? "",
          university_id: item.university_id ?? null,
          member_count: item.member_count ?? 0,
          status: item.status,
          photo_url: item.photo_url,
          owner_username: item.owner_username,
        }))
      : []
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
      join_method: data.join_method ?? "APPLICATION_ONLY", // Default APPLICATION_ONLY
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
  createClub: (data: { name: string; description?: string; join_method?: "OPEN" | "APPLICATION_ONLY" }) =>
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
    
  // ---------- Reports ----------
  reportEvent: (eventId: number, reason: string) =>
    fetchAPI(`/events/${eventId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  reportClub: (clubId: number, reason: string) =>
    fetchAPI(`/organizations/${clubId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  getMyReports: async () => {
    const resp = await fetchAPI("/events/my-reports")
    return mapPaginatedResponse(resp).items ?? []
  },

  // ---------- Notifications (not available) ----------
  getNotifications: async () => [],
  markNotificationsRead: async () => ({ message: "Not supported" }),
}
