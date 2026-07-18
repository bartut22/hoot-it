import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useFollowStatus(
  viewerId: string | undefined,
  targetUserId: string | undefined
) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!viewerId || !targetUserId || viewerId === targetUserId) {
        if (active) {
          setIsFollowing(false);
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      const { data, error } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("follower_id", viewerId)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (active) {
        if (error) {
          console.error("useFollowStatus check failed:", error.message);
          setIsFollowing(false);
        } else {
          setIsFollowing(!!data);
        }
        setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [viewerId, targetUserId]);

  async function follow() {
    if (!viewerId || !targetUserId || viewerId === targetUserId) return;

    setIsFollowing(true);

    const { error } = await supabase.from("follows").insert({
      follower_id: viewerId,
      following_id: targetUserId,
    });

    if (error) {
      console.error("follow failed:", error.message);
      setIsFollowing(false);
    }
  }

  async function unfollow() {
    if (!viewerId || !targetUserId || viewerId === targetUserId) return;

    setIsFollowing(false);

    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", viewerId)
      .eq("following_id", targetUserId);

    if (error) {
      console.error("unfollow failed:", error.message);
      setIsFollowing(true);
    }
  }

  return { isFollowing, loading, follow, unfollow };
}