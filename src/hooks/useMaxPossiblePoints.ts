// hooks/useMaxPossiblePoints.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useMaxPossiblePoints() {
  const [maxPoints, setMaxPoints] = useState(0);

  useEffect(() => {
    supabase.rpc("get_max_possible_points").then(({ data, error }) => {
      if (error) {
        console.error("get_max_possible_points failed:", error.message);
        return;
      }
      setMaxPoints(Number(data ?? 0));
    });
  }, []);

  return { maxPoints };
}