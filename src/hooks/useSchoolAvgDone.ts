// hooks/useSchoolAvgDone.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useSchoolAvgDone() {
  const [avgDone, setAvgDone] = useState(0);

  useEffect(() => {
    supabase.rpc("get_school_avg_done").then(({ data, error }) => {
      if (error) {
        console.error("get_school_avg_done failed:", error.message);
        return;
      }

      if (!error && data?.[0]) setAvgDone(Number(data[0].avg_done));
    });
  }, []);

  return { avgDone };
}
