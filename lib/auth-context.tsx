"use client"

import { createContext, useContext, useState, useEffect, type ReactNode }from "react"
// ✅ api-client'ten doğru getToken/setToken fonksiyonlarını alıyoruz
import { api, getToken, setToken, setUnauthorizedHandler } from "./api-client"

// ✅ GÜNCELLEME: User arayüzü, app.py'deki GET /users/me ile eşleşiyor
interface User {
  id: number | null // JWT payload'dan geliyor
  username: string
  name: string
  email: string
  attendance_rate: number
  university_id?: number | null
  university_name?: string | null
  bio?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  logout: () => void
  isLoading: boolean
  // ✅ YENİ: Profil sayfasının, düzenleme sonrası kullanıcıyı yenilemesi için
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setTokenState] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // ✅ DÜZELTME: "auth_token" yerine api-client'teki "access_token"i kullanan fonksiyon
    const storedToken = getToken()
    
    if (storedToken) {
      setTokenState(storedToken)
      fetchProfile()
    } else {
      setIsLoading(false)
    }

    // ✅ YENİ: API'dan 401 hatası (token geçersiz vb.) gelirse otomatik logout yap
    setUnauthorizedHandler(() => {
      logout()
    })
    
    // Component kaldırıldığında handler'ı temizle
    return () => {
      setUnauthorizedHandler(null)
    }
  }, []) // Bu useEffect sadece bir kez (mount) anında çalışır

  const fetchProfile = async () => {
    try {
      // ✅ GÜNCELLEME: Artık tam User objesini (id, university_id vb. ile) alıyor
      const profile: User = await api.getProfile()
      setUser(profile)
    } catch (error) {
      console.error("Failed to fetch profile:", error)
      logout() // Profil alınamazsa (örn. token geçersizse) logout yap
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null) // ✅ api-client'teki setToken(null) çağrılır (localStorage'ı temizler)
    setTokenState(null)
    setUser(null)
  }

  // ✅ YENİ: Profil sayfasının çağırması için
  const refreshUser = async () => {
    setIsLoading(true) // Yeniden yükleniyor...
    await fetchProfile()
  }

  return (
    <AuthContext.Provider 
      value={{ user, token, logout, isLoading, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
