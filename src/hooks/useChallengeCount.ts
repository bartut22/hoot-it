// hooks/useChallengeCount.ts
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useChallengeCount() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from("challenges")
      .select("*", { count: "exact", head: true })
      .then(({ count, error }) => {
        if (error) console.error(error);
        else setCount(count);
      });
  }, []);

  return { count };
}