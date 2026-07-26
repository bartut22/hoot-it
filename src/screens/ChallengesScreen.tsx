import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useChallenges } from "@/hooks/useChallenges";
import { toBackgroundLocation } from "@/lib/router";
import {
  TrophyIcon,
  ClockIcon,
  CheckIcon,
  OwlIcon,
  SparklesIcon,
  DumbbellIcon,
  BrainIcon,
  PaletteIcon,
  MapIcon,
  BookIcon,
  UsersIcon,
  ImageIcon,
  CameraIcon,
  ErrorTriangleIcon,
  VideoIcon,
  AudioIcon,
} from "@/components/icons";
import ReactMarkdown from 'react-markdown';

type Props = { onHootIt: (challengeId: number) => void };

function pointsColor(pts: number): { bg: string; text: string; border: string } {
  if (pts >= 400) return { bg: "rgba(239,68,68,0.08)", text: "#EF4444", border: "rgba(239,68,68,0.22)" };
  if (pts >= 250) return { bg: "rgba(245,166,35,0.10)", text: "#F5A623", border: "rgba(245,166,35,0.25)" };
  if (pts >= 150) return { bg: "rgba(79,127,250,0.08)", text: "#4F7FFA", border: "rgba(79,127,250,0.22)" };
  return { bg: "rgba(34,197,94,0.08)", text: "#22C55E", border: "rgba(34,197,94,0.22)" };
}

const categoryIcon: Record<string, typeof SparklesIcon> = {
  performance: SparklesIcon,
  physical: DumbbellIcon,
  knowledge: BrainIcon,
  creative: PaletteIcon,
  exploration: MapIcon,
  academic: BookIcon,
  social: UsersIcon,
};

const submissionIcon: Record<string, typeof ImageIcon> = {
  photo: ImageIcon,
  video: VideoIcon,
  audio: AudioIcon
};

function formatDeadline(value: string) {
  const deadline = new Date(value);
  if (Number.isNaN(deadline.getTime())) return "Due soon";

  const date = deadline.toLocaleDateString();
  const time = deadline.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return `Due ${date} at ${time}`;
}

export default function ChallengesScreen({ onHootIt }: Props) {
  const [filter, setFilter] = useState<"all" | "open" | "done">("all");
  const { challenges: CHALLENGES, loading } = useChallenges();
  const navigate = useNavigate();
  const location = useLocation();

  const openChallenges = CHALLENGES.filter((c) => !c.completed);
  const doneChallenges = CHALLENGES.filter((c) => c.completed);

  const filtered = filter === "done" ? doneChallenges : openChallenges;

  const totalPoints = doneChallenges.reduce((sum, c) => sum + (c.points ?? 0), 0);
  const done = doneChallenges.length;
  const progressPct = CHALLENGES.length ? (done / CHALLENGES.length) * 100 : 0;
  const showTrophyState = !loading && filtered.length === 0;

  function openSubmissionPost(submissionId: string) {
    navigate(`/post/${submissionId}`, {
      state: { backgroundLocation: toBackgroundLocation(location) },
    });
  }

  return (
    <div className="screen">
      <div style={{ padding: "56px 24px 16px", background: "linear-gradient(180deg, #f9f9f9 0%, #f1f0fa 100%)" }}>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: "#6666AA",
            letterSpacing: "-0.02em",
            fontFamily: "DM Serif Text, serif",
            fontStyle: "italic",
            marginBottom: 6,
          }}
        >
          Challenges
        </h1>

        <p style={{ fontSize: 13, color: "#6666AA", marginBottom: 16, fontFamily: "DM Sans, sans-serif" }}>
          {done} of {CHALLENGES.length} completed · {totalPoints} pts earned
        </p>

        <div style={{ height: 4, background: "#ECEAF9", borderRadius: 4, marginBottom: 20 }}>
          <div
            style={{
              height: "100%",
              width: `${progressPct}%`,
              background: "linear-gradient(90deg, #4F7FFA, #8B5CF6)",
              borderRadius: 4,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(["all", "open", "done"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="tap"
              style={{
                minHeight: 34,
                padding: "7px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Outfit, sans-serif",
                background: filter === f ? "#4F7FFA" : "#F2F1FB",
                color: filter === f ? "#fff" : "#6666AA",
                border: filter === f ? "none" : "1px solid #E6E4F5",
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {showTrophyState ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(245,166,35,0.25)",
              borderRadius: "22px 18px 24px 20px",
              padding: "32px 20px",
              textAlign: "center",
              boxShadow: "var(--shadow)",
              transform: "rotate(-0.4deg)",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                margin: "0 auto 16px",
                borderRadius: "50%",
                background: "rgba(245,166,35,0.12)",
                border: "1px solid rgba(245,166,35,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#D98A0E",
              }}
            >
              <TrophyIcon size={30} strokeWidth={1.6} />
            </div>

            <h3
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#2D2843",
                letterSpacing: "-0.01em",
                marginBottom: 8,
                fontFamily: "Outfit, sans-serif",
              }}
            >
              {filter === "done" ? "Nothing completed yet" : "You crushed them all"}
            </h3>

            <p
              style={{
                fontSize: 14,
                color: "#7A7AB5",
                lineHeight: 1.6,
                fontFamily: "DM Sans, sans-serif",
                maxWidth: 320,
                margin: "0 auto",
              }}
            >
              {filter === "done"
                ? "Finish a challenge and come back here to see your wins stack up."
                : "No active challenges left to hoot right now. Nice work — you’ve already completed every available challenge."}
            </p>
          </div>
        ) : (
          filtered.map((challenge) => {
            const pts = pointsColor(challenge.points);
            const CategoryIcon = categoryIcon[challenge.category] ?? ErrorTriangleIcon;

            return (
              <div
                key={challenge.id}
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${challenge.completed ? "rgba(34,197,94,0.25)" : "#ECEAF9"}`,
                  borderRadius: 18,
                  overflow: "hidden",
                  opacity: challenge.completed ? 0.85 : 1,
                  boxShadow: "var(--shadow)",
                }}
              >
                <div style={{ padding: "18px 18px 14px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 9,
                          background: "#F2F1FB",
                          color: "#6666AA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon size={17} />
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#2D2843", letterSpacing: "-0.01em" }}>
                        {challenge.name}
                      </h3>
                      <div
                        style={{
                          width: "auto",
                          height: 32,
                          borderRadius: 9,
                          background: "#F2F1FB",
                          color: "#6666AA",
                          display: "flex",
                          padding: "0 4px",
                          gap: 4,
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {challenge.submission_type.map((type) => {
                          const Icon = submissionIcon[type] ?? ErrorTriangleIcon;
                          return <Icon key={type} size={17} ariaLabel={type} />;
                        })}
                      </div>
                    </div>

                    <div
                      style={{
                        flexShrink: 0,
                        background: pts.bg,
                        border: `1px solid ${pts.border}`,
                        borderRadius: 20,
                        padding: "4px 10px",
                        fontSize: 13,
                        fontWeight: 800,
                        color: pts.text,
                        fontFamily: "Outfit, sans-serif",
                        whiteSpace: "nowrap",
                      }}
                    >
                      +{challenge.points} pts
                    </div>
                  </div>

                  <div style={{ fontSize: 14, color: "#7A7AB5", lineHeight: 1.55, fontFamily: "DM Sans, sans-serif" }}>
                    <ReactMarkdown>{challenge.description}</ReactMarkdown>
                  </div>
                  
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, color: "#8A8AC0" }}>
                    <ClockIcon size={13} strokeWidth={1.75} />
                    <span style={{ fontSize: 12, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>
                      {formatDeadline(challenge.deadline)}
                    </span>
                  </div>
                </div>

                <div style={{ padding: "0 18px 18px" }}>
                  {challenge.completed ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                          padding: "12px",
                          background: "rgba(34,197,94,0.08)",
                          border: "1px solid rgba(34,197,94,0.22)",
                          borderRadius: 12,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#22C55E",
                          fontFamily: "Outfit, sans-serif",
                        }}
                      >
                        <CheckIcon size={16} strokeWidth={2.25} />
                        {challenge.submissionVerified ? "Verified" : "Submitted"}
                      </div>

                      {challenge.submissionId && (
                        <button
                          onClick={() => openSubmissionPost(challenge.submissionId)}
                          className="tap"
                          style={{
                            width: "100%",
                            minHeight: 44,
                            padding: "12px",
                            background: "#F2F1FB",
                            border: "1px solid #E6E4F5",
                            borderRadius: 12,
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#2D2843",
                            fontFamily: "Outfit, sans-serif",
                          }}
                        >
                          View My Hoot
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => onHootIt(challenge.id)}
                      className="tap"
                      style={{
                        width: "100%",
                        minHeight: 48,
                        padding: "14px",
                        background: "linear-gradient(135deg, #4F7FFA 0%, #6B5CF6 100%)",
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#fff",
                        letterSpacing: "0.01em",
                        boxShadow: "0 6px 20px rgba(79,127,250,0.28)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                      }}
                    >
                      Hoot It! 🦉
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}