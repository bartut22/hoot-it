import { useEffect, useState } from "react";

import { useAdminQueue } from "@/hooks/useAdminQueue";
import { supabase } from "@/lib/supabase";

export default function AdminScreen() {
  const { queue: ADMIN_QUEUE } = useAdminQueue();

  type Item = typeof ADMIN_QUEUE[number];
  const [queue, setQueue] = useState<Item[]>([]);
  const [decided, setDecided] = useState<Record<string, "approved" | "rejected">>({});

  useEffect(() => {
    setQueue(ADMIN_QUEUE);
  }, [ADMIN_QUEUE]);

  async function decide(id: string, verdict: "approved" | "rejected") {
    setDecided((prev) => ({ ...prev, [id]: verdict }));

    const { data: userData } = await supabase.auth.getUser();
    await supabase
      .from("submissions")
      .update({
        verified: verdict === "approved",
        rejected: verdict === "rejected",
        pending: false,
        reviewed_by: userData.user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);

    setTimeout(() => {
      setQueue((prev) => prev.filter((i) => i.id !== id));
    }, 800);
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#04040E" }}>
      {/* Header */}
      <div style={{ padding: "56px 24px 20px", background: "#0C0C1E", borderBottom: "1px solid #1E1E3E" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", boxShadow: "0 0 8px #22C55E" }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#22C55E", fontFamily: "Outfit, sans-serif", letterSpacing: "0.06em", textTransform: "uppercase" }}>Admin</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: "#F0F0FF", letterSpacing: "-0.02em" }}>Review Queue</h1>
        <p style={{ fontSize: 13, color: "#6666AA", marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>
          {queue.length} pending · Verify or reject submissions
        </p>
      </div>

      <div style={{ padding: "16px" }}>
        {queue.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 24px" }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0FF", marginBottom: 8, fontFamily: "Outfit, sans-serif" }}>All caught up!</h2>
            <p style={{ fontSize: 15, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>No more submissions to review.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {queue.map((item) => {
              const verdict = decided[item.id];
              return (
                <div
                  key={item.id}
                  style={{
                    background: "#0C0C1E",
                    border: `1px solid ${verdict === "approved" ? "rgba(34,197,94,0.4)" : verdict === "rejected" ? "rgba(239,68,68,0.4)" : "#1E1E3E"}`,
                    borderRadius: 20,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    opacity: verdict ? 0.6 : 1,
                  }}
                >
                  {/* Media */}
                  <div style={{ position: "relative" }}>
                    {item.type === "video" ? (
                      <div style={{ position: "relative" }}>
                        <video
                          src={item.image}
                          controls
                          preload="metadata"
                          playsInline
                          style={{ width: "100%", height: 220, objectFit: "cover", background: "#000" }}
                        />
                        <div style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.7)", borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 700, color: "#F0F0FF", fontFamily: "Outfit, sans-serif", pointerEvents: "none" }}>
                          VIDEO
                        </div>
                      </div>
                    ) : (
                      <img src={item.image} alt="Photo" style={{ width: "100%", height: 220, objectFit: "cover" }} />
                    )}

                    {verdict && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: verdict === "approved" ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 56,
                          pointerEvents: "none",
                        }}
                      >
                        {verdict === "approved" ? "✓" : "✕"}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ padding: "16px 16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <div>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#F0F0FF", fontFamily: "Outfit, sans-serif" }}>{item.user}</span>
                        <span style={{ fontSize: 13, color: "#6666AA", marginLeft: 8 }}>{item.college}</span>
                      </div>
                      <span style={{ fontSize: 12, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>{item.submitted}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                      <div style={{ background: "rgba(79,127,250,0.1)", border: "1px solid rgba(79,127,250,0.2)", borderRadius: 6, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#6B95FF", fontFamily: "Outfit, sans-serif" }}>
                        🦉 {item.challenge}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#F5A623", fontFamily: "Outfit, sans-serif" }}>
                        +{item.points} pts
                      </div>
                    </div>

                    <p style={{ fontSize: 14, color: "#9999CC", fontFamily: "DM Sans, sans-serif", lineHeight: 1.5 }}>
                      {item.caption}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, padding: "16px" }}>
                    <button
                      onClick={() => decide(item.id, "rejected")}
                      disabled={!!verdict}
                      style={{
                        flex: 1,
                        padding: "14px",
                        background: "rgba(239,68,68,0.1)",
                        border: "1px solid rgba(239,68,68,0.25)",
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#EF4444",
                        fontFamily: "Outfit, sans-serif",
                        opacity: verdict ? 0.5 : 1,
                        cursor: verdict ? "default" : "pointer",
                      }}
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => decide(item.id, "approved")}
                      disabled={!!verdict}
                      style={{
                        flex: 2,
                        padding: "14px",
                        background: verdict === "approved" ? "#22C55E" : "rgba(34,197,94,0.12)",
                        border: `1px solid ${verdict === "approved" ? "#22C55E" : "rgba(34,197,94,0.3)"}`,
                        borderRadius: 12,
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#22C55E",
                        fontFamily: "Outfit, sans-serif",
                        opacity: verdict ? 0.5 : 1,
                        cursor: verdict ? "default" : "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      ✓ Verify
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}