// hooks/useHandleAvailability.ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useHandleAvailability(handle: string) {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    if (!handle || handle.length < 3) {
      setAvailable(null)
      return
    }

    setChecking(true)
    const timeout = setTimeout(() => {
      supabase
        .from('profiles')
        .select('id')
        .ilike('handle', handle)
        .maybeSingle()
        .then(({ data }) => {
          setAvailable(!data)
          setChecking(false)
        })
    }, 400) // debounce

    return () => clearTimeout(timeout)
  }, [handle])

  return { available, checking }
}