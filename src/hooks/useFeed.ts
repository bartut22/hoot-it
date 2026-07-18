import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const FEED_SELECT = `
  id,
  user_id,
  media_url,
  media_type,
  caption,
  submitted_at,
  verified,
  likers,
  profiles!submissions_user_id_fkey(display_name, handle, avatar_url),
  challenges(name, points),
  colleges(name)
`;

export function useFeed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followerIds, setFollowerIds] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;

    async function loadFeed() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const currentUserId = user?.id ?? null;
      if (!mounted) return;

      setUserId(currentUserId);

      const [postsRes, followingRes, followersRes] = await Promise.all([
        supabase
          .from("submissions")
          .select(FEED_SELECT)
          .eq("verified", true)
          .order("submitted_at", { ascending: false })
          .limit(20),

        currentUserId
          ? supabase
              .from("follows")
              .select("following_id")
              .eq("follower_id", currentUserId)
          : Promise.resolve({ data: [], error: null }),

        currentUserId
          ? supabase
              .from("follows")
              .select("follower_id")
              .eq("following_id", currentUserId)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (!mounted) return;

      if (postsRes.error) {
        console.error("Feed fetch failed:", postsRes.error.message);
      }

      if (followingRes.error) {
        console.error("Following fetch failed:", followingRes.error.message);
      }

      if (followersRes.error) {
        console.error("Followers fetch failed:", followersRes.error.message);
      }

      setPosts(postsRes.data ?? []);
      setFollowingIds((followingRes.data ?? []).map((row: any) => row.following_id));
      setFollowerIds((followersRes.data ?? []).map((row: any) => row.follower_id));
      setLoading(false);
    }

    loadFeed();

    const channel = supabase
      .channel("feed-updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "submissions" },
        async (payload) => {
          if (!payload.new?.verified) return;

          const { data, error } = await supabase
            .from("submissions")
            .select(FEED_SELECT)
            .eq("id", payload.new.id)
            .single();

          if (!error && data && mounted) {
            setPosts((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "submissions" },
        async (payload) => {
          if (!payload.new?.verified) {
            if (mounted) {
              setPosts((prev) => prev.filter((p) => p.id !== payload.new.id));
            }
            return;
          }

          const { data, error } = await supabase
            .from("submissions")
            .select(FEED_SELECT)
            .eq("id", payload.new.id)
            .single();

          if (!error && data && mounted) {
            setPosts((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function toggleLike(postId: string) {
    if (!userId) return;

    const previousPosts = posts;

    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const likers = Array.isArray(p.likers) ? p.likers : [];
        const already = likers.includes(userId);

        return {
          ...p,
          likers: already
            ? likers.filter((id: string) => id !== userId)
            : [...likers, userId],
        };
      })
    );

    const { data, error } = await supabase.rpc("toggle_like", {
      submission_id: postId,
    });

    if (error) {
      console.error("Like toggle failed:", error.message);
      setPosts(previousPosts);
      return;
    }

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likers: Array.isArray(data) ? data : p.likers }
          : p
      )
    );
  }

  return {
    posts,
    loading,
    userId,
    followingIds,
    followerIds,
    toggleLike,
  };
}