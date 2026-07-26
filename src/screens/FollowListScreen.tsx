import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toBackgroundLocation } from "@/lib/router";

type FollowListItem = {
  id: string;
  handle: string;
  display_name: string;
  avatar_url: string;
};

export default function FollowListScreen({
  handle,
  kind,
}: {
  sessionUserId: string;
  handle: string;
  kind: "followers" | "following";
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<FollowListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [titleHandle, setTitleHandle] = useState(handle);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, handle")
        .eq("handle", cleanHandle)
        .maybeSingle();

      if (!profile) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      if (mounted) setTitleHandle(profile.handle);

      const edgeFilterColumn = kind === "followers" ? "following_id" : "follower_id";
      const edgeSelectColumn = kind === "followers" ? "follower_id" : "following_id";

      const { data: edges } = await supabase
        .from("follows")
        .select(edgeSelectColumn)
        .eq(edgeFilterColumn, profile.id);

      const ids = (edges ?? []).map((edge: any) => edge[edgeSelectColumn]);

      if (ids.length === 0) {
        if (mounted) {
          setItems([]);
          setLoading(false);
        }
        return;
      }

      const { data: users } = await supabase
        .from("profiles")
        .select("id, handle, display_name, avatar_url")
        .in("id", ids);

      if (mounted) {
        setItems(users ?? []);
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [handle, kind]);

  return (
    <div className="screen">
      <div
        style={{
          padding: "56px 20px 16px",
          background: "linear-gradient(180deg, #f9f9f9 0%, #f1f0fa 100%)",
          borderBottom: "1px solid #e6e4f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            className="tap"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "#ffffff",
              border: "1px solid #e6e4f5",
              color: "#2d2843",
              fontSize: 16,
              fontWeight: 700,
              boxShadow: "var(--shadow)",
            }}
          >
            ←
          </button>

          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#2d2843", fontFamily: "Outfit, sans-serif" }}>
              {kind === "followers" ? "Followers" : "Following"}
            </div>
            <div style={{ fontSize: 12, color: "#6666AA" }}>@{titleHandle}</div>
          </div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {loading ? (
          <p style={{ color: "#6666AA" }}>Loading...</p>
        ) : items.length === 0 ? (
          <p style={{ color: "#6666AA" }}>No {kind} yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((user) => (
              <button
                key={user.id}
                onClick={() =>
                  navigate(`/profile/${user.handle}`, {
                    state: { backgroundLocation: toBackgroundLocation(location) },
                  })
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: 12,
                  background: "#ffffff",
                  border: "1px solid #e6e4f5",
                  borderRadius: 14,
                  textAlign: "left",
                  boxShadow: "var(--shadow)",
                }}
              >
                <img
                  src={user.avatar_url}
                  alt={`Avatar for ${user.display_name}`}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#2d2843" }}>{user.display_name}</div>
                  <div style={{ fontSize: 13, color: "#6666AA" }}>@{user.handle}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}