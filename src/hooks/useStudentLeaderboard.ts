// hooks/useStudentLeaderboard.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type StudentRow = {
  user_id: string
  display_name: string
  handle: string
  avatar_url: string
  college_id: number
  points: number
}

export function useStudentLeaderboard() {
  const [data, setData] = useState<StudentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('student_leaderboard_view')
      .select('*')
      .order('points', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('student_leaderboard_view failed:', error.message)
        setData(data ?? [])
        setLoading(false)
      })
  }, [])

  return { data, loading }
}