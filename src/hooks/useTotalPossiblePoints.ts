// hooks/useTotalPossiblePoints.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useTotalPossiblePoints() {
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from("challenges")
      .select("points")
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }
        const sum = (data ?? []).reduce((acc, row: any) => acc + (row.points ?? 0), 0);
        setTotal(sum);
        setLoading(false);
      });
  }, []);

  return { total, loading, error };
}