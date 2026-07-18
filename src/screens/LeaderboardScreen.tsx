import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useStudentLeaderboard } from "@/hooks/useStudentLeaderboard";
import { COLLEGES, getCollegeId } from "@/lib/colleges";
import CollegeTabs from "../components/CollegeTabs";
import SkeletonBox from "../components/SkeletonBox";
import { toBackgroundLocation } from "@/lib/router";

function rankColor(rank: number) {
  if (rank === 1) return "#F5A623";
  if (rank === 2) return "#94A3B8";
  if (rank === 3) return "#CD7F32";
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
        background: "#0C0C1E",
        border: "1px solid #1E1E3E",
        borderRadius: 12,
      }}
    >
      <span style={{ width: 24, fontSize: 14, fontWeight: 700, color: rankColor(rank), fontFamily: "Outfit, sans-serif", textAlign: "center" }}>
        {rankEmoji(rank) ?? rank}
      </span>
      <div
        onClick={() => navigate(`/profile/${m.handle}`, { state: { backgroundLocation: toBackgroundLocation(location) } })}
        style={{ display: "flex", alignItems: "center", gap: 14, flex: 1, cursor: "pointer" }}
      >
        <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "#131328" }}>
          {m.avatar_url && (
            <img src={m.avatar_url} alt={m.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 15, fontWeight: 600, color: "#F0F0FF", fontFamily: "Outfit, sans-serif" }}>
            {m.display_name}
            <ExportIcon />
          </div>
          <div style={{ fontSize: 12, color: "#6666AA" }}>@{m.handle}</div>
        </div>
      </div>
      <span style={{ fontSize: 16, fontWeight: 800, color: "#F5A623", fontFamily: "Outfit, sans-serif" }}>
        {m.points}
      </span>
    </div>
  );
}

export default function LeaderboardScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const allTabs = ["All Students", "Colleges", ...Object.values(COLLEGES).map(c => c.name)];

  // ← Pick up the tab requested by rank medal navigation, fallback to "Students"
  const requestedTab = location.state?.tab;
  const initialTab = requestedTab && allTabs.includes(requestedTab) ? requestedTab : "All Students";
  const [tab, setTab] = useState(initialTab);

  const isStudentsView = tab === "All Students";
  const isCollegesOverview = tab === "Colleges";
  const isCollegeTab = !isStudentsView && !isCollegesOverview;

  const { data: LEADERBOARD, loading: collegesLoading } = useLeaderboard();
  const { data: STUDENTS, loading: studentsLoading } = useStudentLeaderboard();

  const loading = isCollegesOverview ? collegesLoading : studentsLoading;

  const SELECTED_COLLEGE_ID = getCollegeId(tab);
  const COLLEGE_MEMBERS = STUDENTS.filter(s => s.college_id === SELECTED_COLLEGE_ID);

  return (
    <div className="screen">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ padding: "56px 24px 0", background: "linear-gradient(180deg, #0C0C1E 0%, #04040E 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#F0F0FF", letterSpacing: "-0.02em" }}>
            Leaderboard
          </h1>
        </div>

        <CollegeTabs allTabs={allTabs} tab={tab} setTab={setTab} />
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
                All colleges · {LEADERBOARD.length} competing
              </div>
              {LEADERBOARD.map((college, idx) => {
                const rank = idx + 1;
                return (
                  <div
                    key={college.college}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      padding: "14px 16px",
                      background: "#0C0C1E",
                      border: "1px solid #1E1E3E",
                      borderRadius: 12,
                    }}
                  >
                    <span style={{ width: 24, fontSize: 14, fontWeight: 700, color: rankColor(rank), fontFamily: "Outfit, sans-serif", textAlign: "center" }}>
                      {rankEmoji(rank) ?? rank}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F0FF", fontFamily: "Outfit, sans-serif" }}>
                        {college.college}
                      </div>
                      <div style={{ fontSize: 12, color: "#6666AA", marginTop: 2 }}>
                        {college.completed} challenge{college.completed !== 1 ? "s" : ""} completed · {college.members} player{college.members !== 1 ? "s" : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 800, color: "#F5A623", fontFamily: "Outfit, sans-serif" }}>
                      {college.points.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingTop: 8 }}>
              <div style={{ fontSize: 13, color: "#6666AA", marginBottom: 8 }}>
                {tab} · {COLLEGE_MEMBERS.length} member{COLLEGE_MEMBERS.length !== 1 ? "s" : ""}
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
                  background: "#0C0C1E",
                  border: "1px solid #1E1E3E",
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