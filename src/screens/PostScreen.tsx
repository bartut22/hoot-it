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
        <div style={{ padding: "56px 20px 0", background: "linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            {stacked && (
              <button
                onClick={() => navigate(-1)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  background: "#F2F1FB",
                  border: "1px solid #D7D7EC",
                  color: "#2D2843",
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                ←
              </button>
            )}
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2D2843", letterSpacing: "-0.01em" }}>
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
      <div style={{ padding: "56px 20px 16px", background: "linear-gradient(180deg, #FFFFFF 0%, #F9F9F9 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {stacked && (
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "#F2F1FB",
                border: "1px solid #D7D7EC",
                color: "#2D2843",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              ←
            </button>
          )}
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#2D2843", letterSpacing: "-0.01em" }}>
            Post
          </h1>
        </div>
      </div>

      <div style={{ background: "#E6E4F5", paddingTop: 1 }}>
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