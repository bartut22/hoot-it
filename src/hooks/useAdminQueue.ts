import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useAdminQueue() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const { data, error } = await supabase
      .from("submissions")
      .select(`
        id, caption, media_url, media_type, submitted_at,
        profiles!submissions_user_id_fkey(display_name, handle),
        challenges(name, points),
        colleges(name)
      `)
      .eq("pending", true)
      .order("submitted_at", { ascending: false });

    if (error) {
      console.error("Admin queue fetch failed:", error.message);
      setQueue([]);
      setLoading(false);
      return;
    }

    const mapped = (data ?? []).map((row: any) => ({
      id: row.id,
      image: row.media_url,
      type: row.media_type,
      user: row.profiles?.display_name ?? "Unknown",
      college: row.colleges?.name ?? "—",
      challenge: row.challenges?.name ?? "Challenge",
      points: row.challenges?.points ?? 0,
      caption: row.caption,
      submitted: new Date(row.submitted_at).toLocaleDateString(),
    }));

    setQueue(mapped);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  return { queue, loading, refresh };
}