// components/DeleteAccountModal.tsx
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DeleteAccountModal({
  handle,
  onClose,
  onDeleted,
}: {
  handle: string;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const requiredPhrase = `Delete my account @${handle}`;
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canDelete = confirmText === requiredPhrase;

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("delete_own_account");

    if (rpcError) {
      setError(rpcError.message ?? "Failed to delete account.");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    onDeleted();
  }

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: "#2D2843", marginBottom: 8, fontFamily: "Outfit, sans-serif" }}>
          Delete your account?
        </h2>
        <p style={{ fontSize: 13, color: "#6666AA", marginBottom: 16, lineHeight: 1.5 }}>
          This will permanently delete your profile, avatar, and all associated data. This action{" "}
          <strong>cannot be undone</strong>.
        </p>

        <p style={{ fontSize: 13, color: "#2D2843", marginBottom: 8 }}>
          Type <strong>{requiredPhrase}</strong> to confirm:
        </p>
        <input
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder={requiredPhrase}
          style={inputStyle}
        />

        {error && <p style={{ color: "#FF6B6B", fontSize: 13, marginTop: 12 }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button type="button" onClick={onClose} style={cancelBtnStyle} disabled={deleting}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canDelete || deleting}
            style={{
              ...deleteBtnStyle,
              opacity: canDelete && !deleting ? 1 : 0.5,
              cursor: canDelete && !deleting ? "pointer" : "not-allowed",
            }}
          >
            {deleting ? "Deleting..." : "Delete account"}
          </button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(45,40,67,0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 20,
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  padding: 24,
  maxWidth: 400,
  width: "100%",
  fontFamily: "DM Sans, sans-serif",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #E6E4F5",
  borderRadius: 10,
  fontSize: 14,
  boxSizing: "border-box",
};

const cancelBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "1px solid #E6E4F5",
  background: "#fff",
  color: "#6666AA",
  fontWeight: 600,
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: 12,
  borderRadius: 10,
  border: "none",
  background: "#FF6B6B",
  color: "#fff",
  fontWeight: 700,
};