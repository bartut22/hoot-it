import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useFeed } from "@/hooks/useFeed";
import Post from "../components/Post";

type Props = {
  stacked?: boolean;
};

export default function PostScreen({ stacked = false }: Props) {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { posts: FEED_POSTS, userId, toggleLike } = useFeed();

  const post = useMemo(
    () => FEED_POSTS.find((p) => String(p.id) === String(postId)),
    [FEED_POSTS, postId]
  );

  if (!post) {
    return (
      <div className="screen">
        <div style={{ padding: "56px 20px 0", background: "linear-gradient(180deg, #0C0C1E 0%, #04040E 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            {stacked && (
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
            )}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0FF", letterSpacing: "-0.01em" }}>
              Post
            </h1>
          </div>

          <div style={{ color: "#9999CC", fontFamily: "DM Sans, sans-serif" }}>
            Post not found.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <div style={{ padding: "56px 20px 16px", background: "linear-gradient(180deg, #0C0C1E 0%, #04040E 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {stacked && (
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
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#F0F0FF", letterSpacing: "-0.01em" }}>
            Post
          </h1>
        </div>
      </div>

      <div style={{ background: "#1E1E3E", paddingTop: 1 }}>
        <Post
          post={post}
          currentUserId={userId}
          toggleLike={toggleLike}
          showOpenOnMedia={false}
        />
      </div>
    </div>
  );
}