"use client"

// ✅ API_BASE_URL'nizi buradan kontrol edebilirsiniz.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://etkinlink.oa.r.appspot.com"

// Token'ı saklamak için kullandığımız anahtar (auth-context ile aynı olmalı)
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

// Global 401 (Yetki Yok) hatası durumunda bu fonksiyon çağrılır
let onUnauthorized: ((resp?: Response) => void) | null = null
export function setUnauthorizedHandler(fn: ((resp?: Response) => void) | null) {
  onUnauthorized = fn
}

// --- Token Yardımcıları ---
export function getToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null
}
export function setToken(token: string | null) {
  if (typeof window === "undefined") return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

// --- Ana Fetch Fonksiyonu ---
async function fetchAPI<T = any>(endpoint: string, options: RequestInit = {}, withAuth = true): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`

  const headers: HeadersInit = {
    // Body varsa ve FormData değilse JSON olarak ayarla
    ...(options.body && !(options.body instanceof FormData) && !new Headers(options.headers || {}).has("Content-Type")
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
  }

  // Token'ı al ve auth header'ına ekle
  const token = withAuth ? getToken() : null
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })

  // 401 ise global handler'ı tetikle (örn. auth-context'teki logout)
  if (response.status === 401 && onUnauthorized) {
    try { onUnauthorized(response) } catch {}
  }

  // Hata ise APIError fırlat
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

  // 204 No Content (içerik yok) ise
  if (response.status === 204) return undefined as T

  return response.json() as Promise<T>
}

// --- API Endpoint'leri ---
export const api = {
  // ---------- Auth ----------
  loginWithPassword: async (email: string, password: string) => {
    const data = await fetchAPI<{ access_token: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false // Bu endpoint token gerektirmez
    )
    setToken(data.access_token) // Token'ı kaydet
    return data
  },

  signup: (payload: { email: string; password: string; name: string; username: string }) =>
    fetchAPI<{ message: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    }, false),

  logout: () => setToken(null),
  
  // ✅ YENİ: Şifre Sıfırlama
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
  // (GET /users/me artık id, university_id, university_name vb. döndürüyor)
  getProfile: () => fetchAPI("/users/me"),
  
  updateProfile: (data: any) =>
    fetchAPI("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
    
  getUserEvents: (userId: number) => fetchAPI(`/users/${userId}/events`),

  // ✅ YENİ: Rozetler (Profil sayfası için)
  getMyBadges: () => fetchAPI("/users/me/badges"),
  getAllBadges: () => fetchAPI("/badges"),
  
  // ✅ YENİ: Kullanıcının Kulüpleri (Profil sayfası için)
  getMyClubs: () => fetchAPI("/users/me/clubs"),


  // ---------- Dictionaries ----------
  getUniversities: () => fetchAPI("/universities"),
  getEventTypes: () => fetchAPI("/event_types"),

  
  // ---------- Events ----------
  getEvents: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : ""
    return fetchAPI(`/events${query}`)
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
    
  updateEventStatus: (id: number, status: string) =>
    fetchAPI(`/events/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
    
  filterEvents: (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : ""
    return fetchAPI(`/events/filter${query}`)
  },
  
  getNearbyEvents: (lat: number, lng: number, radiusKm = 10, params?: Record<string, any>) => {
    const query = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius_km: String(radiusKm),
      ...(params || {}),
    }).toString()
    return fetchAPI(`/events/nearby?${query}`)
  },

  
  // ---------- Participation ----------
  joinEvent: (eventId: number) =>
    fetchAPI(`/events/${eventId}/join`, { method: "POST" }),
    
  leaveEvent: (eventId: number) =>
    fetchAPI(`/events/${eventId}/leave`, { method: "POST" }),

    
  // ---------- Attendance ----------
  getAttendance: (eventId: number) => fetchAPI(`/events/${eventId}/attendance`),
  
  setAttendance: (eventId: number, userId: number, status: "ATTENDED" | "NO_SHOW") =>
    fetchAPI(`/events/${eventId}/attendance`, {
      method: "POST",
      body: JSON.stringify({ user_id: userId, status }),
    }),


  // ---------- Applications ----------
  createApplication: (eventId: number, whyMe?: string) =>
    fetchAPI(`/events/${eventId}/applications`, {
      method: "POST",
      body: JSON.stringify({ why_me: whyMe }),
    }),
    
  getApplications: (eventId: number) => fetchAPI(`/events/${eventId}/applications`),
  
  updateApplication: (applicationId: number, status: "PENDING" | "APPROVED") =>
    fetchAPI(`/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),


  // ---------- Ratings ----------
  getRatings: (eventId: number) => fetchAPI(`/events/${eventId}/ratings`),
  
  createRating: (eventId: number, rating: number, comment?: string) =>
    fetchAPI(`/events/${eventId}/ratings`, {
      method: "POST",
      body: JSON.stringify({ rating, comment }),
    }),
  // ... (updateRating, deleteRating eklenebilir) ...


  // ✅ YENİ: Kulüpler (Clubs)
  getClubs: (universityId?: number) => {
    const params = universityId ? { university_id: universityId } : {}
    const query = new URLSearchParams(params as any).toString()
    return fetchAPI(`/clubs?${query}`)
  },
  
  getClub: (id: number) => fetchAPI(`/clubs/${id}`),
  
  createClub: (data: { name: string, description?: string, university_id: number }) =>
    fetchAPI("/clubs", { method: "POST", body: JSON.stringify(data) }),
    
  joinClub: (clubId: number) =>
    fetchAPI(`/clubs/${clubId}/join`, { method: "POST" }),
    
  leaveClub: (clubId: number) =>
    fetchAPI(`/clubs/${clubId}/leave`, { method: "POST" }),


  // ✅ YENİ: Bildirimler (Notifications)
  getNotifications: () => fetchAPI("/notifications"),
  
  markNotificationsRead: (data: { ids?: number[]; all?: boolean }) =>
    fetchAPI("/notifications/mark-read", {
      method: "POST",
      body: JSON.stringify(data)
    }),
}