import { useChallengesDone } from "@/hooks/useChallengesDone";
import { useFollowCounts } from "@/hooks/useFollowCounts";
import { usePoints } from "@/hooks/usePoints";
import { useProfile } from "@/hooks/useProfile";
import { useRanks } from "@/hooks/useRanks";
import { getCollegeName } from "@/lib/colleges";
import { useLocation, useNavigate } from "react-router-dom";
import SkeletonBox from "../components/SkeletonBox";
import { useChallengeCount } from "@/hooks/useChallengeCount";
import { useTotalPossiblePoints } from "@/hooks/useTotalPossiblePoints";
import { supabase } from "@/lib/supabase";
import { useFollowStatus } from "@/hooks/useFollowStatus";
import { toBackgroundLocation } from "@/lib/router";
import {
  ChevronLeftIcon,
  ShieldIcon,
  ArrowUpRightIcon,
  CheckIcon,
  HourglassIcon,
} from "@/components/icons";

const collegeColors: Record<string, { backgroundColor: string; textColor: string }> = {
  "Baker": { backgroundColor: "#8f2513", textColor: "#f8b80f" }, //
  "Will Rice": { backgroundColor: "#a63a26", textColor: "#f1cb48" }, //
  "Hanszen": { backgroundColor: "#1992cb", textColor: "#eee933" }, //
  "Wiess": { backgroundColor: "#FFCC33", textColor: "#000000" }, //
  "Jones": { backgroundColor: "#13b5e9", textColor: "#01ab4f" }, //
  "Brown": { backgroundColor: "#01ab4f", textColor: "#68085d" }, //
  "Lovett": { backgroundColor: "#022553", textColor: "#fadb05" }, // 
  "Sid Richardson": { backgroundColor: "#e64b37", textColor: "#fec526" }, //
  "Martel": { backgroundColor: "#1292d3", textColor: "#FFFFFF" }, //
  "McMurtry": { backgroundColor: "#49176d", textColor: "#bec0c2" }, // 
  "Duncan": { backgroundColor: "#36451c", textColor: "#d6a234" }, //
};

type Props = {
  isOwn?: boolean;
  userId?: string;
  viewerId?: string;
  stacked?: boolean;
};

export default function ProfileScreen({
  isOwn = true,
  userId = undefined,
  viewerId = undefined,
  stacked = false,
}: Props) {
  if (userId === undefined) {
    return (
      <div className="screen">
        <h1>error: no profile id passed into this component</h1>
      </div>
    );
  }

  const { profile, loading } = useProfile(userId);
  const { points: pointsFromSubmissions } = usePoints(userId);
  useChallengesDone(userId);
  const { followers, following } = useFollowCounts(userId);
  const { overallRank, collegeRank } = useRanks(userId);
  const navigate = useNavigate();
  const location = useLocation();
  useChallengeCount();
  const { total: totalPossiblePoints } = useTotalPossiblePoints();

  const { isFollowing, loading: followLoading, follow, unfollow } = useFollowStatus(viewerId, userId);

  const completionPct =
    totalPossiblePoints && totalPossiblePoints > 0
      ? Math.min(100, ((pointsFromSubmissions ?? 0) / totalPossiblePoints) * 100)
      : 0;

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/");
  }

  function openFollowStack(kind: "followers" | "following") {
    if (!profile?.handle) return;
    navigate(`/profile/${profile.handle}/${kind}`, {
      state: { backgroundLocation: toBackgroundLocation(location) },
    });
  }

  function goToCollegeLeaderboard() {
    if (!profile?.college_id) return;
    const collegeName = getCollegeName(profile.college_id);
    navigate("/leaderboard", { state: { tab: collegeName } });
  }

  function goToOverallLeaderboard() {
    navigate("/leaderboard", { state: { tab: "All Students" } });
  }

  function openPostStack(postId: string) {
    navigate(`/post/${postId}`, {
      state: { backgroundLocation: toBackgroundLocation(location) },
    });
  }

  return (
    <div className="screen">
      <div style={{ padding: "56px 20px 8px", background: "linear-gradient(180deg, #f9f9f9 0%, #f1f0fa 100%)" }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {stacked && (
              <button
                onClick={() => navigate(-1)}
                className={"tap"}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: "#F2F1FB",
                  border: "1px solid #E6E4F5",
                  color: "#2D2843",
                  display: "flex", alignItems: "center", justifyContent: "center"
                }}
              >
                <ChevronLeftIcon size={18} strokeWidth={2.25} />
              </button>
            )}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2D2843", letterSpacing: "-0.01em" }}>
              Profile
            </h1>
          </div>
        </div>

        {!loading && profile ? (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 20 }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  fontWeight: 800,
                  color: "#fff",
                  fontFamily: "Outfit, sans-serif",
                  flexShrink: 0,
                  boxShadow: "var(--shadow)",
                }}
              >
                <img
                  src={profile.avatar_url}
                  alt={`Avatar for ${profile.display_name} (@${profile.handle})`}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#2D2843", fontFamily: "Outfit, sans-serif", letterSpacing: "-0.01em", display: "flex", gap: 8, alignItems: "center" }}>
                  {profile.display_name}
                  {profile.is_admin && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        background: "rgba(245,166,35,0.15)",
                        border: "1px solid rgba(245,166,35,0.35)",
                        borderRadius: 6,
                        padding: "2px 7px",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#B4780F",
                        fontFamily: "Outfit, sans-serif",
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <ShieldIcon size={11} strokeWidth={2} /> Admin
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ fontSize: 13, color: "#6666AA" }}>@{profile.handle}</div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                  <div
                    onClick={goToCollegeLeaderboard}
                    style={{
                      background: collegeColors[getCollegeName(profile.college_id)]?.backgroundColor || "rgba(79,127,250,0.10)",
                      border: "1px solid rgba(79,127,250,0.25)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: collegeColors[getCollegeName(profile.college_id)]?.textColor || "#4F7FFA",
                      fontFamily: "Outfit, sans-serif",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    {getCollegeName(profile.college_id)} #{collegeRank}
                    <ArrowUpRightIcon size={10} strokeWidth={2.25} className="opacity-60" />
                  </div>

                  <button
                    onClick={goToOverallLeaderboard}
                    style={{
                      background: "rgba(79,127,250,0.10)",
                      border: "1px solid rgba(79,127,250,0.25)",
                      borderRadius: 6,
                      padding: "3px 10px",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#4F7FFA",
                      fontFamily: "Outfit, sans-serif",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 3,
                    }}
                  >
                    Rice #{overallRank}
                    <ArrowUpRightIcon size={10} strokeWidth={2.25} className="opacity-60" />
                    {/* {overallRank === 1 ? " 🥇" : overallRank === 2 ? " 🥈" : overallRank === 3 ? " 🥉" : ""}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" style={{ marginLeft: 1, opacity: 0.6 }}>
                      <path d="M7 17L17 7M17 7H10M17 7V14" stroke="#4F7FFA" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg> */}
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 1, background: "#ECEAF9", borderRadius: 16, overflow: "hidden", marginBottom: 20, boxShadow: "var(--shadow)" }}>
              <div style={{ flex: 1, background: "#FFFFFF", padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}>
                  {pointsFromSubmissions}
                </div>
                <div style={{ fontSize: 11, color: "#6666AA", marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>
                  Points
                </div>
              </div>

              <div style={{ flex: 1, background: "#FFFFFF", padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}>
                  {completionPct.toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: "#6666AA", marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>
                  Completion
                </div>
              </div>

              <button
                onClick={() => openFollowStack("followers")}
                style={{ flex: 1, background: "#FFFFFF", padding: "14px 8px", textAlign: "center", border: "none" }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}>
                  {followers}
                </div>
                <div style={{ fontSize: 11, color: "#6666AA", marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>
                  Followers
                </div>
              </button>

              <button
                onClick={() => openFollowStack("following")}
                style={{ flex: 1, background: "#FFFFFF", padding: "14px 8px", textAlign: "center", border: "none" }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}>
                  {following}
                </div>
                <div style={{ fontSize: 11, color: "#6666AA", marginTop: 2, fontFamily: "DM Sans, sans-serif" }}>
                  Following
                </div>
              </button>
            </div>

            {isOwn ? (
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button
                  onClick={() => navigate("/settings")}
                  className={"tap"}
                  style={{ flex: 1, padding: "12px", background: "#F2F1FB", border: "1px solid #E6E4F5", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}
                >
                  Edit Profile
                </button>
                <button
                  className={"tap"}
                  style={{ flex: 1, padding: "12px", background: "#F2F1FB", border: "1px solid #E6E4F5", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#2D2843", fontFamily: "Outfit, sans-serif" }}
                >
                  Share Profile
                </button>
                <button
                  onClick={handleLogout}
                  className={"tap"}
                  style={{ flex: 1, padding: "12px", background: "rgba(229,72,77,0.08)", border: "1px solid rgba(229,72,77,0.25)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "#E5484D", fontFamily: "Outfit, sans-serif" }}
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                <button
                  className={"tap"}
                  onClick={isFollowing ? unfollow : follow}
                  disabled={followLoading}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: isFollowing ? "#F2F1FB" : "#F5A623",
                    border: isFollowing ? "1px solid #E6E4F5" : "1px solid #F5A623",
                    borderRadius: 12,
                    fontSize: 14,
                    fontWeight: 700,
                    color: isFollowing ? "#2D2843" : "#FFFFFF",
                    fontFamily: "Outfit, sans-serif",
                    cursor: followLoading ? "not-allowed" : "pointer",
                    opacity: followLoading ? 0.6 : 1,
                  }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 25 }}>
              <SkeletonBox width={76} height={76} borderRadius={38} />
              <div style={{ flex: 1 }}>
                <div style={{ height: 3 }} />
                <SkeletonBox width={160} height={20} />
                <div style={{ height: 11 }} />
                <SkeletonBox width={90} height={13} />
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <SkeletonBox width={64} height={22} borderRadius={6} />
                  <SkeletonBox width={90} height={22} borderRadius={6} />
                  <SkeletonBox width={80} height={22} borderRadius={6} />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 1, background: "#ECEAF9", borderRadius: 16, overflow: "hidden", marginBottom: 20 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ flex: 1, background: "#FFFFFF", padding: "14px 8px", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <SkeletonBox width={28} height={18} />
                  <div style={{ height: 4 }} />
                  <SkeletonBox width={44} height={11} />
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 23 }}>
              <SkeletonBox width="100%" height={44} borderRadius={12} />
              <SkeletonBox width="100%" height={44} borderRadius={12} />
            </div>
          </>
        )}
      </div>

      <div style={{ padding: "8px 0 0" }}>
        <div style={{ padding: "0 16px 12px" }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#8A8AC0", fontFamily: "Outfit, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Hoots
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2 }}>
          {!profile || !profile.posts ? null : (
            <>
              {profile.posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => openPostStack(post.id)}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    overflow: "hidden",
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                  }}
                >
                  {post.media_type === "video" ? (
                    <div style={{ position: "relative", width: "100%", height: "100%" }}>
                      <video
                        src={post.image}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(45,40,67,0.12)",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.3)",
                            backdropFilter: "blur(6px)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <span style={{ fontSize: 12, marginLeft: 2, color: "#2D2843" }}>▶</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img src={post.image} alt="Post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  )}

                  <div
                    style={{
                      position: "absolute",
                      bottom: 6,
                      left: 6,
                      background: "rgba(45,40,67,0.2)",
                      borderRadius: 6,
                      padding: "2px 7px",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#F5A623", fontFamily: "Outfit, sans-serif" }}>
                      +{post.points}
                    </span>
                  </div>

                  {post.verified ? (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#22C55E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      <CheckIcon size={11} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: "#F5A623",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                      }}
                    >
                      <HourglassIcon size={10} strokeWidth={2.5} />
                    </div>
                  )}
                </button>
              ))}

              {Array.from({ length: Math.max(0, 6 - profile.posts.length) }).map((_, i) => (
                <div key={`empty-${i}`} style={{ aspectRatio: "1", background: "#F7F6FC", border: "1px solid #ECEAF9" }} />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}