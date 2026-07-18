import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  media: { type: "photo" | "video"; src: string };
  challengeName: string;
  challengeId: string | number;
  onBack: () => void;
  onDone: () => void;
};

const FRIENDS = ["Maya Chen", "Devon Park", "Aisha Johnson", "Luis Torres", "Priya Sharma", "Ethan Wu"];

export default function SubmitScreen({ media, challengeName, challengeId, onBack, onDone }: Props) {
  const [caption, setCaption] = useState("");
  const [tagged, setTagged] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const suggestions = FRIENDS.filter(
    (f) => f.toLowerCase().includes(tagInput.toLowerCase()) && tagInput.length > 0 && !tagged.includes(f)
  );

  function toggleTag(name: string) {
    setTagged((prev) => prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name]);
    setTagInput("");
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError(null);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        throw new Error("You must be logged in to submit a hoot.");
      }
      const userId = userData.user.id;

      // Pull the user's college_id from their profile so submissions.college_id gets set correctly
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("college_id")
        .eq("id", userId)
        .single();
      if (profileError) throw profileError;

      const response = await fetch(media.src);
      const blob = await response.blob();

      const fileExt = media.type === "video" ? "webm" : "jpg";
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("hoots")
        .upload(filePath, blob, {
          contentType: media.type === "video" ? "video/webm" : "image/jpeg",
          cacheControl: "3600",
          upsert: false,
        });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("hoots").getPublicUrl(filePath);

      const { data: submissionData, error: insertError } = await supabase
        .from("submissions")
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          college_id: profileData.college_id,
          media_url: urlData.publicUrl,
          media_type: media.type,
          caption,
          verified: false,
          pending: true,
        })
        .select()
        .single();
      if (insertError) throw insertError;

      // Insert tagged friends into the junction table, if any
      if (tagged.length > 0) {
        const tagRows = tagged.map((friendId) => ({
          submission_id: submissionData.id,
          tagged_user_id: friendId,
        }));
        const { error: tagError } = await supabase.from("submission_tags").insert(tagRows);
        if (tagError) console.error("Tag insert failed:", tagError.message); // non-fatal
      }

      setShowModal(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#04040E", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "56px 20px 20px", background: "#0C0C1E", borderBottom: "1px solid #1E1E3E" }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: "50%", background: "#1A1A35", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#F0F0FF", flexShrink: 0 }}>
          ‹
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#F0F0FF", letterSpacing: "-0.01em" }}>Submit Hoot</h2>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 20px 120px" }}>
        <div style={{ borderRadius: 18, overflow: "hidden", marginBottom: 20, position: "relative" }}>
          {media.type === "video" ? (
            <video src={media.src} controls style={{ width: "100%", maxHeight: 280, objectFit: "cover" }} />
          ) : (
            <img src={media.src} alt="Captured" style={{ width: "100%", maxHeight: 320, objectFit: "cover" }} />
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div style={{ background: "rgba(79,127,250,0.12)", border: "1px solid rgba(79,127,250,0.25)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: "#6B95FF", fontFamily: "Outfit, sans-serif" }}>
            🦉 {challengeName}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#9999CC", fontFamily: "Outfit, sans-serif", display: "block", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption..."
            maxLength={200}
            style={{
              width: "100%", background: "#0C0C1E", border: "1px solid #1E1E3E", borderRadius: 14,
              padding: "14px 16px", fontSize: 15, color: "#F0F0FF", resize: "none", height: 96, lineHeight: 1.5,
            }}
          />
          <div style={{ fontSize: 11, color: "#6666AA", textAlign: "right", marginTop: 4 }}>{caption.length}/200</div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#9999CC", fontFamily: "Outfit, sans-serif", display: "block", marginBottom: 8, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Tag Friends
          </label>

          {tagged.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
              {tagged.map((t) => (
                <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", borderRadius: 20, padding: "5px 12px" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#A78BFA", fontFamily: "Outfit, sans-serif" }}>@{t.split(" ")[0].toLowerCase()}</span>
                  <button onClick={() => toggleTag(t)} style={{ fontSize: 14, color: "#6666AA", lineHeight: 1 }}>×</button>
                </div>
              ))}
            </div>
          )}

          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="Search friends..."
            style={{ width: "100%", background: "#0C0C1E", border: "1px solid #1E1E3E", borderRadius: 12, padding: "12px 16px", fontSize: 15, color: "#F0F0FF" }}
          />

          {suggestions.length > 0 && (
            <div style={{ background: "#0C0C1E", border: "1px solid #1E1E3E", borderRadius: 12, marginTop: 4, overflow: "hidden" }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleTag(s)}
                  style={{ width: "100%", padding: "12px 16px", textAlign: "left", fontSize: 14, color: "#F0F0FF", fontFamily: "DM Sans, sans-serif", borderBottom: "1px solid #1A1A35", display: "flex", alignItems: "center", gap: 10 }}
                >
                  <span style={{ fontSize: 12, color: "#6666AA" }}>@{s.split(" ")[0].toLowerCase()}</span>
                  <span>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <p style={{ color: "#EF4444", fontSize: 13, marginTop: -8, marginBottom: 12 }}>{submitError}</p>
        )}
      </div>

      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, padding: "16px 20px 36px", background: "linear-gradient(0deg, #04040E 60%, transparent)", zIndex: 10 }}>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%", padding: "16px",
            background: submitting ? "#3A3A5A" : "linear-gradient(135deg, #4F7FFA 0%, #8B5CF6 100%)",
            borderRadius: 16, fontSize: 16, fontWeight: 800, color: "#fff",
            boxShadow: "0 4px 24px rgba(79,127,250,0.3)", letterSpacing: "0.01em",
          }}
        >
          {submitting ? "Uploading..." : "🦉 Submit Hoot"}
        </button>
      </div>

      {showModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 }}
          onClick={() => { setShowModal(false); onDone(); }}
        >
          <div
            style={{ background: "#0C0C1E", border: "1px solid #1E1E3E", borderRadius: "24px 24px 0 0", padding: "32px 28px 52px", width: "100%", maxWidth: 430, textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🦉</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "#F0F0FF", marginBottom: 10, letterSpacing: "-0.02em" }}>
              Hoot submitted!
            </h2>
            <p style={{ fontSize: 15, color: "#9999CC", lineHeight: 1.6, marginBottom: 28, fontFamily: "DM Sans, sans-serif" }}>
              Your photo is being reviewed. You'll get a notification once it's verified and your points are awarded. 🎉
            </p>
            <button
              onClick={() => { setShowModal(false); onDone(); }}
              style={{ width: "100%", padding: "16px", background: "linear-gradient(135deg, #4F7FFA 0%, #8B5CF6 100%)", borderRadius: 14, fontSize: 16, fontWeight: 700, color: "#fff" }}
            >
              Back to Challenges
            </button>
          </div>
        </div>
      )}
    </div>
  );
}