// hooks/useChallengesDone.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useChallengesDone(userId: string | null | undefined) {
  const [done, setDone] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDone = useCallback(async () => {
    if (!userId) {
      setDone(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('get_challenges_done', {
      target_user_id: userId,
    })
    if (error) setError(error.message)
    else setDone(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchDone()
  }, [fetchDone])

  return { done, loading, error, refetch: fetchDone }
}