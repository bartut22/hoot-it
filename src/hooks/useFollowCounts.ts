import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useFollowCounts(userId: string | undefined) {
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!userId) {
        if (active) {
          setFollowers(0);
          setFollowing(0);
        }
        return;
      }

      const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", userId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", userId),
      ]);

      if (active) {
        setFollowers(followersCount ?? 0);
        setFollowing(followingCount ?? 0);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  return { followers, following };
}