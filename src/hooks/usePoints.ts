// hooks/usePoints.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePoints(userId: string | null | undefined) {
  const [points, setPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPoints = useCallback(async () => {
    if (!userId) {
      setPoints(null)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('get_user_points', {
      target_user_id: userId,
    })
    if (error) setError(error.message)
    else setPoints(data)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchPoints()
  }, [fetchPoints])

  return { points, loading, error, refetch: fetchPoints }
}