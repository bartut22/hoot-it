import { useProfile } from "@/hooks/useProfile";
import { usePoints } from "@/hooks/usePoints";
import { useChallengesDone } from "@/hooks/useChallengesDone";
import { useChallengeCount } from "@/hooks/useChallengeCount";
import { useRanks } from "@/hooks/useRanks";
import { useCollegeAvgDone } from "@/hooks/useCollegeAvgDone";
import { useSchoolAvgDone } from "@/hooks/useSchoolAvgDone";
import { getCollegeName } from "@/lib/colleges";
import { useMaxPossiblePoints } from "@/hooks/useMaxPossiblePoints";

const RANKS = [
  { name: "Bronze", emoji: "🥉", min: 0, max: 499, color: "#CD7F32", bg: "rgba(205,127,50,0.12)", border: "rgba(205,127,50,0.25)" },
  { name: "Silver", emoji: "🥈", min: 500, max: 999, color: "#94A3B8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.25)" },
  { name: "Gold", emoji: "🥇", min: 1000, max: 2499, color: "#F5A623", bg: "rgba(245,166,35,0.12)", border: "rgba(245,166,35,0.25)" },
  { name: "Diamond", emoji: "💎", min: 2500, max: Infinity, color: "#67E8F9", bg: "rgba(103,232,249,0.12)", border: "rgba(103,232,249,0.25)" },
];

function ProgressBar({ value, max, color, label, sublabel }: { value: number; max: number; color: string; label: string; sublabel: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F0FF", fontFamily: "Outfit, sans-serif" }}>{label}</span>
        <span style={{ fontSize: 13, color: "#9999CC", fontFamily: "DM Sans, sans-serif" }}>{sublabel}</span>
      </div>
      <div style={{ height: 10, background: "#131328", borderRadius: 10, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: 10, transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: color, fontWeight: 700, fontFamily: "Outfit, sans-serif" }}>{Math.round(pct)}%</span>
        <span style={{ fontSize: 12, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>{value} of {max}</span>
      </div>
    </div>
  );
}

export default function ProgressScreen({ userId = undefined }: { userId?: string }) {
  const { profile, loading } = useProfile(userId);
  const { points: myPoints } = usePoints(userId);
  const { done: myDone } = useChallengesDone(userId);
  const { count: totalChallenges } = useChallengeCount();
  const { overallRank, collegeRank } = useRanks(userId);
  const { avgDone: collegeAvgDone, memberCount: collegeMemberCount } = useCollegeAvgDone(profile?.college_id);
  const { avgDone: schoolAvgDone } = useSchoolAvgDone();

  const points = myPoints ?? 0;
  const done = myDone ?? 0;
  const total = totalChallenges ?? 0;
  const collegeName = getCollegeName(profile?.college_id ?? -1);

  const currentRank = RANKS.find((r) => points >= r.min && points <= r.max) ?? RANKS[0];
  const nextRank = RANKS[RANKS.indexOf(currentRank) + 1];
  const rankProgress = nextRank
    ? ((points - currentRank.min) / (nextRank.min - currentRank.min)) * 100
    : 100;

    const { maxPoints } = useMaxPossiblePoints();
    const maxPossiblePoints = maxPoints || 1;
  if (loading || !profile) {
    return <div className="screen" style={{ padding: 24 }}><p style={{ color: "#6666AA" }}>Loading...</p></div>;
  }


  return (
    <div className="screen">
      <div style={{ padding: "56px 24px 20px", background: "linear-gradient(180deg, #0C0C1E 0%, #04040E 100%)" }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F0F0FF", letterSpacing: "-0.02em", marginBottom: 4 }}>
          Your Progress
        </h1>
        <p style={{ fontSize: 13, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>
          Hoot-It 2026 · {collegeName}
        </p>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{ background: currentRank.bg, border: `1px solid ${currentRank.border}`, borderRadius: 20, padding: "24px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
            <div style={{ fontSize: 48 }}>{currentRank.emoji}</div>
            <div>
              <div style={{ fontSize: 13, color: currentRank.color, fontWeight: 600, fontFamily: "Outfit, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>
                Current Rank
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#F0F0FF", fontFamily: "Outfit, sans-serif", letterSpacing: "-0.02em" }}>
                {currentRank.name}
              </div>
              <div style={{ fontSize: 14, color: "#9999CC", fontFamily: "DM Sans, sans-serif" }}>
                {points.toLocaleString()} points
              </div>
            </div>
          </div>

          {nextRank && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>
                  {points - currentRank.min} / {nextRank.min - currentRank.min} pts to {nextRank.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: nextRank.color, fontFamily: "Outfit, sans-serif" }}>
                  {nextRank.emoji} {nextRank.name}
                </span>
              </div>
              <div style={{ height: 8, background: "rgba(0,0,0,0.25)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${rankProgress}%`, background: `linear-gradient(90deg, ${currentRank.color}, ${nextRank.color})`, borderRadius: 8 }} />
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {RANKS.map((r) => {
            const achieved = points >= r.min;
            return (
              <div key={r.name} style={{ flex: 1, padding: "10px 6px", background: achieved ? r.bg : "#0C0C1E", border: `1px solid ${achieved ? r.border : "#1E1E3E"}`, borderRadius: 12, textAlign: "center", opacity: achieved ? 1 : 0.4 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{r.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: achieved ? r.color : "#6666AA", fontFamily: "Outfit, sans-serif" }}>
                  {r.name}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#0C0C1E", border: "1px solid #1E1E3E", borderRadius: 20, padding: "22px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#9999CC", fontFamily: "Outfit, sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 20 }}>
            Challenge Completion
          </div>

          <ProgressBar value={done} max={total} color="#4F7FFA" label="You" sublabel={``} />
          <ProgressBar value={Math.round(collegeAvgDone)} max={maxPossiblePoints} color="#8B5CF6" label={`${collegeName} avg`} sublabel={``} />
          <ProgressBar value={Math.round(schoolAvgDone)} max={maxPossiblePoints} color="#22C55E" label="School avg" sublabel={``} />
        </div>

        <div style={{ background: "#0C0C1E", border: "1px solid #1E1E3E", borderRadius: 20, padding: "22px 20px", display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(245,166,35,0.15)", border: "1px solid rgba(245,166,35,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>
            🏆
          </div>
          <div>
            <div style={{ fontSize: 13, color: "#6666AA", fontFamily: "DM Sans, sans-serif", marginBottom: 4 }}>
              Rice Rank
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#F5A623", fontFamily: "Outfit, sans-serif", letterSpacing: "-0.01em" }}>
              #{overallRank}
            </div>
            <div style={{ fontSize: 13, color: "#9999CC", marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>
              You're #{collegeRank} in {collegeName} · {collegeMemberCount} member{collegeMemberCount !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}