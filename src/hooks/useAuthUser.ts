import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuthUser() {
  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { userId, authLoading }
}