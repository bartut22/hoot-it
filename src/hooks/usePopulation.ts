import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function usePopulation() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('profiles').select('*').then(({ data, error }) => {
      if (!error) setData(data ?? [])
      setLoading(false)
    })
  }, [])

  return { data, loading }
}