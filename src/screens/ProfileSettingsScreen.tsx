// screens/ProfileSettings.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuthUser } from "@/hooks/useAuthUser";

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export default function ProfileSettings() {
    const { userId } = useAuthUser();
    const navigate = useNavigate();
    const [displayName, setDisplayName] = useState("");
    const [handle, setHandle] = useState("");
    const [email, setEmail] = useState("");
    const [originalDisplayName, setOriginalDisplayName] = useState("");
    const [originalHandle, setOriginalHandle] = useState("");
    const [originalEmail, setOriginalEmail] = useState("");
    const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null); const [provider, setProvider] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!userId) return;

        async function load() {
            const { data: userData } = await supabase.auth.getUser();
            if (userData?.user) {
                setEmail(userData.user.email ?? "");
                setOriginalEmail(userData.user.email ?? "");
                setProvider(userData.user.app_metadata?.provider ?? null);
            }

            const { data: profile, error } = await supabase
                .from("profiles")
                .select("display_name, handle, avatar_url")
                .eq("id", userId)
                .single();

            if (!error && profile) {
                setDisplayName(profile.display_name ?? "");
                setOriginalDisplayName(profile.display_name ?? "");
                setHandle(profile.handle?.replace(/^@/, "") ?? "");
                setOriginalHandle(profile.handle?.replace(/^@/, "") ?? "");
                setAvatarUrl(profile.avatar_url ?? null);
                setOriginalAvatarUrl(profile.avatar_url ?? null);
            }
            setLoading(false);
        }

        load();
    }, [userId]);

    const isEmailProvider = provider === "email";

    async function deleteOldAvatars(userId: string, currentFileName: string) {
        const { data: existingFiles } = await supabase.storage
            .from('avatars')
            .list(userId);

        if (existingFiles && existingFiles.length > 0) {
            const filesToDelete = existingFiles
                .filter(f => f.name !== currentFileName)
                .map(f => `${userId}/${f.name}`);

            if (filesToDelete.length > 0) {
                await supabase.storage.from('avatars').remove(filesToDelete);
            }
        }
    }

    function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Please upload a JPEG, PNG, WEBP, or GIF image.");
            return;
        }

        if (file.size > MAX_SIZE_BYTES) {
            setError("Image must be under 5MB.");
            return;
        }

        setError(null);
        setAvatarFile(file);
        setAvatarUrl(URL.createObjectURL(file));
    }

    async function checkHandleTaken(normalizedHandle: string): Promise<boolean> {
        const { data } = await supabase
            .from("profiles")
            .select("id")
            .eq("handle", normalizedHandle)
            .neq("id", userId)
            .maybeSingle();
        return !!data;
    }

    const normalizedHandle = handle.trim().replace(/^@/, "");
    const profileChanged =
        displayName.trim() !== originalDisplayName ||
        normalizedHandle !== originalHandle ||
        avatarFile !== null;

    const emailChanged =
        isEmailProvider &&
        email.trim().toLowerCase() !== originalEmail.trim().toLowerCase();

    const isDirty = profileChanged || emailChanged;

    async function handleSave() {
        if (!userId) return;
        setSaving(true);
        setError(null);
        setMessage(null);

        try {
            const handleTaken = await checkHandleTaken(normalizedHandle);
            if (handleTaken) {
                setError("That handle is already taken. Try another one.");
                setSaving(false);
                return;
            }

            let uploadedAvatarUrl = avatarUrl;

            if (avatarFile) {
                const fileExt = avatarFile.name.split(".").pop();
                const filePath = `${userId}/avatar.${fileExt}`;

                await deleteOldAvatars(userId, `avatar.${fileExt}`);

                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, avatarFile, { upsert: true });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(filePath);

                uploadedAvatarUrl = publicUrlData.publicUrl;
            }

            const { error: updateError } = await supabase
                .from("profiles")
                .update({
                    display_name: displayName,
                    handle: normalizedHandle,
                    avatar_url: uploadedAvatarUrl,
                })
                .eq("id", userId);

            if (updateError) {
                if (updateError.message.includes("unique_handle") || updateError.code === "23505") {
                    throw new Error("That handle is already taken. Try another one.");
                }
                throw updateError;
            }

            setOriginalDisplayName(displayName.trim());
            setOriginalHandle(normalizedHandle);
            setOriginalAvatarUrl(uploadedAvatarUrl);
            setAvatarFile(null);

            if (emailChanged) {
                const { error: emailError } = await supabase.auth.updateUser({ email });
                if (emailError) {
                    if (emailError.message.toLowerCase().includes("already registered") || emailError.message.toLowerCase().includes("already exists")) {
                        throw new Error("That email is already in use by another account.");
                    }
                    throw emailError;
                }
                setMessage("A verification link has been sent to your new email. Upon verification, your email will be updated.");
            } else {
                setMessage("Profile updated successfully.");
            }

        } catch (err: any) {
            setError(err.message ?? "Something went wrong.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) return <p style={{ color: "#6666AA", padding: 24 }}>Loading settings...</p>;

    return (
        <div style={{ padding: "24px 20px", maxWidth: 480, margin: "0 auto" }}>
            <button
                type="button"
                onClick={() => navigate("/profile")}
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "none",
                    border: "none",
                    color: "#6666AA",
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: "Outfit, sans-serif",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: 20,
                }}
            >
                ← Back to profile
            </button>

            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#F0F0FF", marginBottom: 24, fontFamily: "Outfit, sans-serif" }}>
                Profile Settings
            </h1>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
                <div
                    style={{
                        width: 96,
                        height: 96,
                        borderRadius: "50%",
                        background: avatarUrl ? `url(${avatarUrl}) center/cover` : "#131328",
                        border: "1px solid #2A2A50",
                        marginBottom: 12,
                    }}
                />
                <label style={{ fontSize: 13, fontWeight: 600, color: "#4F7FFA", cursor: "pointer", fontFamily: "Outfit, sans-serif" }}>
                    Change photo
                    <input type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: "none" }} />
                </label>
            </div>

            <Field label="Display name">
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
            </Field>

            <Field label="Handle">
                <div style={{ display: "flex", alignItems: "center", ...inputStyle, padding: "0 12px" }}>
                    <span style={{ color: "#6666AA", marginRight: 2 }}>@</span>
                    <input
                        value={handle.replace(/^@/, "")}
                        onChange={(e) => setHandle(e.target.value.replace(/^@/, ""))}
                        style={{ ...inputStyle, border: "none", background: "transparent", padding: "12px 0" }}
                    />
                </div>
            </Field>

            <Field label="Email">
                <input
                    value={email}
                    onChange={(e) => isEmailProvider && setEmail(e.target.value)}
                    disabled={!isEmailProvider}
                    style={{ ...inputStyle, opacity: isEmailProvider ? 1 : 0.5, cursor: isEmailProvider ? "text" : "not-allowed" }}
                />
                {!isEmailProvider && (
                    <p style={{ fontSize: 12, color: "#6666AA", marginTop: 4 }}>
                        Email is managed by {provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : "your login provider"} and can't be changed here.
                    </p>
                )}
            </Field>

            {error && <p style={{ color: "#FF6B6B", fontSize: 13, marginBottom: 12 }}>{error}</p>}
            {message && <p style={{ color: "#4CD97B", fontSize: 13, marginBottom: 12 }}>{message}</p>}

            <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isDirty}
                style={{
                    width: "100%",
                    padding: "14px",
                    background: isDirty
                        ? "linear-gradient(135deg, #4F7FFA 0%, #8B5CF6 100%)"
                        : "gray",
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#fff",
                    fontFamily: "Outfit, sans-serif",
                    border: "none",
                    cursor: saving || !isDirty ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    transition: "all 0.15s ease",
                }}
            >
                {saving ? "Saving..." : "Save Changes"}
            </button>
        </div>
    );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#6666AA", marginBottom: 6, fontFamily: "Outfit, sans-serif" }}>
                {label}
            </label>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 14px",
    background: "#0C0C1E",
    border: "1px solid #1E1E3E",
    borderRadius: 10,
    color: "#F0F0FF",
    fontSize: 15,
    fontFamily: "DM Sans, sans-serif",
    boxSizing: "border-box",
};