// hooks/useCollegeAvgDone.ts
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCollegeAvgDone(collegeId?: number) {
  const [avgDone, setAvgDone] = useState(0);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (!collegeId) return;
    supabase
      .rpc("get_college_avg_done", { college_id_param: collegeId })
      .then(({ data, error }) => {
        if (error) {
          console.error("get_college_avg_done failed:", error.message);
        }
        if (!error && data?.[0]) {
          setAvgDone(Number(data[0].avg_done));
          setMemberCount(data[0].member_count);
        }
      });
  }, [collegeId]);

  return { avgDone, memberCount };
}
