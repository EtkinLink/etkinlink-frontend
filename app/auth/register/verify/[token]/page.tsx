"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function RegisterVerifyRedirectPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()

  useEffect(() => {
    const token = params?.token
    if (!token) return
    router.replace(`/auth/verify?token=${encodeURIComponent(token)}`)
  }, [params, router])

  return null
}
