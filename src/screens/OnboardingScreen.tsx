import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useHandleAvailability } from "@/hooks/useHandleAvailability";
import { COLLEGES } from "@/lib/colleges";

export default function OnboardingScreen({ session }: { session: any }) {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const next = searchParams.get("next") ?? "/";

    const [displayName, setDisplayName] = useState("");
    const [handle, setHandle] = useState("");
    const [collegeId, setCollegeId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { available, checking } = useHandleAvailability(handle);

    async function completeOnboarding(userId: string, handle: string, collegeId: number, displayName: string) {
        const { error } = await supabase
            .from("profiles")
            .update({
                handle,
                college_id: collegeId,
                display_name: displayName,
                first_login: false,
            })
            .eq("id", userId);

        if (error) {
            if (error.code === "23505") {
                throw new Error("That handle was just taken. Try another.");
            }
            throw error;
        }
    }

    async function handleSubmit() {
        if (!session?.user?.id || collegeId === null || !available || !handle || !displayName) return;
        setSubmitting(true);
        try {
            await completeOnboarding(session.user.id, handle, collegeId, displayName);
            toast.success(`Welcome, @${handle}!`);
            navigate(next);
        } catch (err: any) {
            toast.error(err.message ?? "Something went wrong. Try again.");
        } finally {
            setSubmitting(false);
        }
    }

    const canSubmit = displayName.trim().length > 0 && handle.length >= 3 && available === true && collegeId !== null && !submitting;

    console.log({ displayName, handle, available, checking, collegeId, submitting, canSubmit });
    return (
        <div className="screen" style={{ padding: "56px 24px", background: "linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%)", minHeight: "100vh" }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#2D2843", marginBottom: 8, fontFamily: "Outfit, sans-serif" }}>
                Set up your profile
            </h1>
            <p style={{ fontSize: 14, color: "#6666AA", marginBottom: 28 }}>
                Pick a username and your college to get started.
            </p>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#9999CC", display: "block", marginBottom: 6 }}>Display name</label>
            <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E6E4F5", color: "#2D2843", fontSize: 15, marginBottom: 20 }}
            />

            <label style={{ fontSize: 13, fontWeight: 600, color: "#9999CC", display: "block", marginBottom: 6 }}>Username</label>
            <input
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="username"
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "#FFFFFF", border: `1px solid ${available === false ? "#E5484D" : available === true ? "#3DD68C" : "#E6E4F5"}`, color: "#2D2843", fontSize: 15, marginBottom: 6 }}
            />
            <div style={{ fontSize: 12, marginBottom: 20, color: available === false ? "#E5484D" : available === true ? "#3DD68C" : "#6666AA" }}>
                {handle.length > 0 && handle.length < 3 && "Must be at least 3 characters"}
                {handle.length >= 3 && checking && "Checking availability…"}
                {handle.length >= 3 && !checking && available === true && "✓ Available"}
                {handle.length >= 3 && !checking && available === false && "✗ Already taken"}
            </div>

            <label style={{ fontSize: 13, fontWeight: 600, color: "#9999CC", display: "block", marginBottom: 6 }}>College</label>
            <select
                value={collegeId ?? ""}
                onChange={(e) => setCollegeId(Number(e.target.value))}
                style={{ width: "100%", padding: "12px 14px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E6E4F5", color: "#2D2843", fontSize: 15, marginBottom: 28 }}
            >
                <option value="" disabled>Select your college</option>
                {Object.entries(COLLEGES).map(([id, c]: any) => (
                    <option key={id} value={Number(id) + 1}>{c.name}</option>
                ))}
            </select>

            <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: 12,
                    background: canSubmit ? "#F5A623" : "#E6E4F5",
                    color: canSubmit ? "#FFFFFF" : "#6666AA",
                    fontWeight: 800,
                    fontSize: 15,
                    border: "none",
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    fontFamily: "Outfit, sans-serif",
                }}
            >
                {submitting ? "Saving…" : "Continue"}
            </button>
        </div>
    );
}