import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { toBackgroundLocation } from "@/lib/router";

type PostProps = {
  post: any;
  currentUserId?: string | null;
  toggleLike?: (postId: string) => void | Promise<void>;
  onOpenPost?: (post: any) => void;
  showOpenOnMedia?: boolean;
};

function getInitials(name?: string, handle?: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
  }
  if (handle) return handle.slice(0, 2).toUpperCase();
  return "🦉";
}

function normalizeSupabaseTimestamp(value?: string | null) {
  if (!value) return "";

  return value.replace(
    /\.(\d{3})\d+([+-]\d{2}:\d{2}|Z)$/,
    ".$1$2"
  );
}

function formatPostTime(value?: string | null) {
  if (!value) return "";

  const normalized = normalizeSupabaseTimestamp(value);
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString();
}

export default function Post({
  post,
  currentUserId,
  toggleLike,
  onOpenPost,
  showOpenOnMedia = true,
}: PostProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Exact schema-aligned sources
  const profile = post?.profiles ?? post?.profile ?? null;
  const challenge = post?.challenges ?? post?.challenge ?? null;
  const college = post?.colleges ?? post?.college ?? null;

  const postId = post?.id;
  const handle = profile?.handle ?? post?.handle ?? "";
  const displayName = profile?.display_name ?? post?.display_name ?? handle ?? "Unknown user";
  const avatarUrl = profile?.avatar_url ?? post?.avatar_url ?? null;
  const avatarFallback = getInitials(displayName, handle);

  const challengeName = challenge?.name ?? post?.challenge_name ?? "Challenge";
  const challengePoints = challenge?.points ?? post?.points ?? 0;

  const mediaUrl = post?.media_url ?? post?.image ?? "";
  const mediaType = post?.media_type ?? "image";
  const caption = post?.caption ?? "";
  const isVerified = Boolean(post?.verified);
  const isPending = Boolean(post?.pending);

  const collegeName = college?.name ?? post?.college_name ?? "";
  const raw = post?.submitted_at ?? post?.created_at ?? "";
  const createdDate = new Date(raw);
  const time = raw ? formatPostTime(raw.replace(/\.(\d{3})\d+([+-]\d{2}:\d{2}|Z)$/, ".$1$2")) : "";
  const subtitle = `${time}`;

  const likers = Array.isArray(post?.likers) ? post.likers : [];
  const isLiked = currentUserId ? likers.includes(currentUserId) : false;
  const likeCount = likers.length;

  function openProfile() {
    if (!handle) return;
    navigate(`/profile/${handle}`, {
      state: { backgroundLocation: toBackgroundLocation(location) },
    });
  }

  function openPost() {
    if (onOpenPost) {
      onOpenPost(post);
      return;
    }

    if (!postId) return;

    navigate(`/post/${postId}`, {
      state: { backgroundLocation: toBackgroundLocation(location) },
    });
  }

  async function copyPostLink(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();

    if (!postId) {
      toast.error("No link available for this post");
      return;
    }

    try {
      const url = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  function onLikeClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    if (!postId || !toggleLike) return;
    toggleLike(postId);
  }

  const canOpenPost = Boolean(showOpenOnMedia && (onOpenPost || postId));

  return (
    <article
      style={{
        background: "#f9f9f9",
        borderBottom: "18px",
        borderRadius: "18px",
        boxShadow: "0 2px 12px rgba(45,40,67,0.07)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 16px 12px",
        }}
      >
        <div
          onClick={openProfile}
          role="button"
          tabIndex={handle ? 0 : -1}
          onKeyDown={(e) => {
            if (!handle) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openProfile();
            }
          }}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#f9f9f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            fontWeight: 700,
            color: "#000000",
            flexShrink: 0,
            fontFamily: "Outfit, sans-serif",
            overflow: "hidden",
            cursor: handle ? "pointer" : "default",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            avatarFallback
          )}
        </div>

        <div
          onClick={openProfile}
          role="button"
          tabIndex={handle ? 0 : -1}
          onKeyDown={(e) => {
            if (!handle) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openProfile();
            }
          }}
          style={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: "flex-start",
            flex: "0 0 auto",
            minWidth: 0,
            cursor: handle ? "pointer" : "default",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              minWidth: 0,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: "#000000",
                fontFamily: "Outfit, sans-serif",
                whiteSpace: "nowrap",
              }}
            >
              {displayName}
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#8888cc",
                  fontFamily: "Outfit, sans-serif",
                  whiteSpace: "nowrap",
                  marginLeft: "0.25rem"
                }}
              >
                @{handle}
              </span>
            </span>
          </div>

          {subtitle ? (
            <div style={{ fontSize: 12, color: "#6666AA" }}>
              <p title={createdDate.toLocaleTimeString()}>{subtitle}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ paddingLeft: 16, paddingBottom: 10, display: "flex", gap: 8 }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(79,127,250,0.1)",
            border: "1px solid rgba(79,127,250,0.2)",
            borderRadius: 6,
            padding: "3px 10px",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#6B95FF",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            {challengeName}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#F5A623",
              fontFamily: "Outfit, sans-serif",
            }}
          >
            +{challengePoints}
          </span>
        </div>


        {isVerified && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(34,197,94,0.15)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 6,
              padding: "3px 10px",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#22C55E",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              ✓ Verified
            </span>
          </div>
        )}
      </div>

      {caption ? (
        <p style={{ fontSize: 14, color: "#6666AA", lineHeight: 1.5, fontFamily: "DM Sans, sans-serif", margin: "0 16px 8px" }}>
          {handle ? (
            <span
              onClick={openProfile}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openProfile();
                }
              }}
              style={{
                fontWeight: 700,
                fontFamily: "Outfit, sans-serif",
                color: "#1e1e1e",
                cursor: "pointer",
              }}
            >
              {" "}
            </span>
          ) : null}
          {caption}
        </p>
      ) : null}

      {mediaUrl ? (
        <div
          onClick={canOpenPost ? openPost : undefined}
          role={canOpenPost ? "button" : undefined}
          tabIndex={canOpenPost ? 0 : -1}
          onKeyDown={(e) => {
            if (!canOpenPost) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openPost();
            }
          }}
          style={{
            position: "relative",
            cursor: canOpenPost ? "pointer" : "default",
            background: "#0C0C1E",
          }}
        >
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              controls={!canOpenPost}
              style={{
                width: "100%",
                maxHeight: 420,
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <img
              src={mediaUrl}
              alt={caption || `Post by ${displayName}`}
              style={{
                width: "100%",
                maxHeight: 420,
                objectFit: "cover",
                display: "block",
              }}
            />
          )}

          {!isVerified && isPending && (
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(245,166,35,0.92)",
                borderRadius: 8,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 700,
                color: "#0C0C1E",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Pending
            </div>
          )}
        </div>
      ) : null}

      <div style={{ padding: "14px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: caption ? 12 : 0 }}>
          <button
            type="button"
            onClick={onLikeClick}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 15,
              color: isLiked ? "#EF4444" : "#6666AA",
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          >
            <span style={{ fontSize: 22 }}>{isLiked ? "❤️" : "🤍"}</span>
            <span style={{ fontFamily: "Outfit, sans-serif", fontWeight: 600, fontSize: 14 }}>
              {likeCount}
            </span>
          </button>

          <button
            type="button"
            aria-label="Comment"
            style={{
              fontSize: 22,
              background: "transparent",
              border: "none",
              padding: 0,
            }}
          >
            💬
          </button>

          <button
            type="button"
            aria-label="Copy post link"
            onClick={copyPostLink}
            style={{
              fontSize: 20,
              background: "transparent",
              border: "none",
              padding: 0,
              color: "#6666AA",
            }}
          >
            🔗
          </button>
        </div>
      </div>
    </article>
  );
}