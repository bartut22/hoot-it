import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useStudentLeaderboard } from "@/hooks/useStudentLeaderboard";
import { COLLEGES, getCollegeId } from "@/lib/colleges";
import CollegeTabs from "../components/CollegeTabs";
import SkeletonBox from "../components/SkeletonBox";
import { toBackgroundLocation } from "@/lib/router";

function rankColor(rank: number) {
  if (rank === 1) return "#D98A0E";
  if (rank === 2) return "#7C8698";
  if (rank === 3) return "#B0703A";
  return "#6666AA";
}

function rankEmoji(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

function ExportIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 4, flexShrink: 0 }}>
      <path d="M7 17L17 7M17 7H10M17 7V14" stroke="#6666AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StudentRow({ m, rank }: { m: any; rank: number }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        background: "#FFFFFF",
        border: "1px solid #ECEAF9",
        borderRadius: 12,
        boxShadow: "var(--shadow)",
      }}
    >
      <span style={{ width: 24, fontSize: 14, fontWeight: 700, color: rankColor(rank), fontFamily: "Outfit, sans-serif", textAlign: "center" }}>
        {rankEmoji(rank) ?? rank}
      </span>
      <div
        onClick={() => navigate(`/profile/${m.handle}`, { state: { backgroundLocation: toBackgroundLocation(location) } })}
        style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, cursor: "pointer" }}
      >
        <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#F2F1FB" }}>
          {m.avatar_url && (
            <img src={m.avatar_url} alt={m.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 15, fontWeight: 600, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}>
            {m.display_name}
            <ExportIcon />
          </div>
          <div style={{ fontSize: 12, color: "#6666AA" }}>@{m.handle}</div>
        </div>
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#D98A0E", fontFamily: "Outfit, sans-serif" }}>
        {m.points}
      </span>
    </div>
  );
}

export default function LeaderboardScreen() {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: LEADERBOARD, loading: collegesLoading } = useLeaderboard();
  const { data: STUDENTS, loading: studentsLoading } = useStudentLeaderboard();

  // Count students per college so we can hide empty colleges everywhere
  const collegeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    STUDENTS.forEach((s: any) => {
      counts[s.college_id] = (counts[s.college_id] || 0) + 1;
    });
    return counts;
  }, [STUDENTS]);

  // Only show college tabs that have at least one member
  const allTabs = useMemo(() => {
    const nonEmptyCollegeNames = Object.values(COLLEGES)
      .filter((c: any) => (collegeCounts[c.id] || 0) > 0)
      .map((c: any) => c.name);
    return ["All Students", "Colleges", ...nonEmptyCollegeNames];
  }, [collegeCounts]);

  // Only show colleges with members in the "Colleges" overview
  const visibleLeaderboard = useMemo(
    () => LEADERBOARD.filter((college: any) => college.members > 0),
    [LEADERBOARD]
  );

  const requestedTab = location.state?.tab;
  const initialTab = requestedTab && allTabs.includes(requestedTab) ? requestedTab : "All Students";
  const [tab, setTab] = useState(initialTab);

  // If the currently selected tab becomes empty (e.g. after data loads), fall back safely
  const activeTab = allTabs.includes(tab) ? tab : "All Students";

  const isStudentsView = activeTab === "All Students";
  const isCollegesOverview = activeTab === "Colleges";
  const isCollegeTab = !isStudentsView && !isCollegesOverview;

  const loading = isCollegesOverview ? collegesLoading : studentsLoading;

  const SELECTED_COLLEGE_ID = getCollegeId(activeTab);
  const COLLEGE_MEMBERS = STUDENTS.filter((s: any) => s.college_id === SELECTED_COLLEGE_ID);

  return (
    <div className="screen">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ padding: "56px 24px 0", background: "linear-gradient(180deg, #f9f9f9 0%, #f1f0fa 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#6666AA",
              letterSpacing: "-0.02em",
              fontFamily: "DM Serif Text, serif",
              fontStyle: "italic",
            }}
          >
            Leaderboard
          </h1>
        </div>

        <CollegeTabs allTabs={allTabs} tab={activeTab} setTab={setTab} />
      </div>

      <div style={{ padding: "8px 16px 24px" }}>
        {!loading ? (
          isStudentsView ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 13, color: "#6666AA", marginBottom: 8 }}>
                All students · {STUDENTS.length} player{STUDENTS.length !== 1 ? "s" : ""}
              </div>
              {STUDENTS.map((m, idx) => (
                <StudentRow key={m.user_id} m={m} rank={idx + 1} />
              ))}
            </div>
          ) : isCollegesOverview ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 13, color: "#6666AA", marginBottom: 8 }}>
                All colleges · {visibleLeaderboard.length} competing
              </div>
              {visibleLeaderboard.map((college, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={college.college}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      background: "#FFFFFF",
                      border: "1px solid #ECEAF9",
                      borderRadius: 12,
                      boxShadow: "var(--shadow)",
                    }}
                  >
                    <span style={{ width: 24, fontSize: 14, fontWeight: 700, color: rankColor(rank), fontFamily: "Outfit, sans-serif", textAlign: "center" }}>
                      {rankEmoji(rank) ?? rank}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}>
                        {college.college}
                      </div>
                      <div style={{ fontSize: 12, color: "#6666AA", marginTop: 2 }}>
                        {college.completed} challenge{college.completed !== 1 ? "s" : ""} completed · {college.members} player{college.members !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#D98A0E", fontFamily: "Outfit, sans-serif" }}>
                      {college.points.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 13, color: "#6666AA", marginBottom: 8 }}>
                {activeTab} · {COLLEGE_MEMBERS.length} member{COLLEGE_MEMBERS.length !== 1 ? "s" : ""}
              </div>
              {COLLEGE_MEMBERS.map((m, idx) => (
                <StudentRow key={m.user_id} m={m} rank={idx + 1} />
              ))}
            </div>
          )
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "20px 16px",
                  background: "#FFFFFF",
                  border: "1px solid #ECEAF9",
                  borderRadius: 12,
                }}
              >
                <SkeletonBox width={24} height={16} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <SkeletonBox width="60%" height={15} />
                  <SkeletonBox width="40%" height={12} />
                </div>
                <SkeletonBox width={40} height={16} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}