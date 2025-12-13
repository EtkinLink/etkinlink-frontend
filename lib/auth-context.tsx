"use client"

import { createContext, useCallback, useContext, useState, useEffect, type ReactNode } from "react"
// ✅ api-client'ten doğru getToken/setToken fonksiyonlarını alıyoruz
import { api, getToken, setToken, setUnauthorizedHandler, isTokenExpired } from "./api-client"
import { toast } from "@/hooks/use-toast"

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

  const logout = useCallback(() => {
    setToken(null) // ✅ api-client'teki setToken(null) çağrılır (localStorage'ı temizler)
    setTokenState(null)
    setUser(null)
  }, [])

  const fetchProfile = useCallback(async () => {
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
  }, [logout])

  useEffect(() => {
    // ✅ DÜZELTME: "auth_token" yerine api-client'teki "access_token"i kullanan fonksiyon
    const storedToken = getToken()

    if (storedToken) {
      // Check if token is expired before using it
      if (isTokenExpired(storedToken)) {
        console.warn("Token is expired on mount, logging out")
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        })
        logout()
        setIsLoading(false)
      } else {
        setTokenState(storedToken)
        fetchProfile()
      }
    } else {
      setIsLoading(false)
    }

    // ✅ YENİ: API'dan 401 hatası (token geçersiz vb.) gelirse token'ı temizle
    // Form sayfaları bunu catch edip giriş yönlendirmesini yapacak
    setUnauthorizedHandler(() => {
      toast({
        title: "Session Expired",
        description: "Your session has expired. Please log in again.",
        variant: "destructive",
      })
      setToken(null)
      setTokenState(null)
      setUser(null)

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = "/auth/login"
      }, 1500)
    })

    // Component kaldırıldığında handler'ı temizle
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [fetchProfile, logout]) // Bu useEffect sadece bir kez (mount) anında çalışır

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
