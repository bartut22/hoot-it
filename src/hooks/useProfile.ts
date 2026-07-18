import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export type Post = {
  id: string
  image: string
  points: number
  verified: boolean
  media_type: string
}

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      return;
    }
    setLoading(true)

    Promise.all([
      supabase.from('profiles').select('*, colleges(name)').eq('id', userId).single(),
      supabase
        .from('submissions')
        .select('id, media_url, media_type, verified, challenges(points)')
        .eq('user_id', userId)
        .order('submitted_at', { ascending: false }),
    ])
      .then(([profileRes, postsRes]) => {
        if (profileRes.error) throw profileRes.error
        if (postsRes.error) throw postsRes.error

        const mappedPosts: Post[] = (postsRes.data ?? []).map((row: any) => ({
          id: row.id,
          image: row.media_url,
          points: row.challenges?.points ?? 0,
          verified: row.verified,
          media_type: row.media_type,
        }))

        setProfile({ ...profileRes.data, posts: mappedPosts })
        setPosts(mappedPosts)
        setLoading(false)
      })
      .catch((e) => {
        console.error('Profile fetch failed:', e.message)
        setLoading(false)
      })
  }, [userId])

  return { profile, posts, loading }
}