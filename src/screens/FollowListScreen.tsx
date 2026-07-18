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
    <div className="screen" style={{ background: "#04040E", minHeight: "100vh" }}>
      <div
        style={{
          padding: "56px 20px 16px",
          background: "linear-gradient(180deg, #0C0C1E 0%, #04040E 100%)",
          borderBottom: "1px solid #1E1E3E",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "#131328",
              border: "1px solid #2A2A50",
              color: "#F0F0FF",
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            ←
          </button>

          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#F0F0FF", fontFamily: "Outfit, sans-serif" }}>
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
                  background: "#0C0C1E",
                  border: "1px solid #1E1E3E",
                  borderRadius: 14,
                  textAlign: "left",
                }}
              >
                <img
                  src={user.avatar_url}
                  alt={`Avatar for ${user.display_name}`}
                  style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F0F0FF" }}>{user.display_name}</div>
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