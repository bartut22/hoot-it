import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useChallenges() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const [{ data: challengeRows, error: challengesError }, { data: submissionRows, error: submissionsError }] =
        await Promise.all([
          supabase
            .from("challenges")
            .select("*")
            .eq("is_active", true)
            .order("deadline"),
          user
            ? supabase
                .from("submissions")
                .select("id, challenge_id, verified, pending, submitted_at")
                .eq("user_id", user.id)
                .order("submitted_at", { ascending: false })
            : Promise.resolve({ data: [], error: null }),
        ]);

      if (!mounted) return;

      if (challengesError || submissionsError) {
        console.error("useChallenges error", { challengesError, submissionsError });
        setChallenges([]);
        setLoading(false);
        return;
      }

      const latestSubmissionByChallenge = new Map<number, any>();

      for (const submission of submissionRows ?? []) {
        if (!latestSubmissionByChallenge.has(submission.challenge_id)) {
          latestSubmissionByChallenge.set(submission.challenge_id, submission);
        }
      }

      const merged = (challengeRows ?? []).map((challenge) => {
        const submission = latestSubmissionByChallenge.get(challenge.id);

        return {
          ...challenge,
          completed: !!submission,
          submissionId: submission?.id ?? null,
          submissionVerified: submission?.verified ?? false,
          submissionPending: submission?.pending ?? false,
          submittedAt: submission?.submitted_at ?? null,
        };
      });

      setChallenges(merged);
      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return { challenges, loading };
}