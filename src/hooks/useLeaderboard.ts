import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export type LeaderboardRow = {
  college: string
  points: number
  completed: number
  members: number
}

export function useLeaderboard() {
  const [data, setData] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('points', { ascending: false })

    if (error) {
      setError(error.message)
    } else {
      setData(data ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchLeaderboard()
  }, [fetchLeaderboard])

  return { data, loading, error, refetch: fetchLeaderboard }
}