// hooks/useRanks.ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRanks(userId: string | null | undefined) {
  const [overallRank, setOverallRank] = useState<number | null>(null)
  const [collegeRank, setCollegeRank] = useState<number | null>(null)
  const [totalPoints, setTotalPoints] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRank = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase.rpc('get_user_rank', {
      target_user_id: userId,
    })
    if (error) {
      setError(error.message)
    } else if (data && data.length > 0) {
      setOverallRank(data[0].overall_rank)
      setCollegeRank(data[0].college_rank)
      setTotalPoints(data[0].total_points)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchRank()
  }, [fetchRank])

  return { overallRank, collegeRank, totalPoints, loading, error, refetch: fetchRank }
}