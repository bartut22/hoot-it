import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useFeed } from "@/hooks/useFeed";
import { toBackgroundLocation } from "@/lib/router";
import Post from "../components/Post";
import FeedTabs from "../components/FeedTabs";


type FeedTab = "All" | "Following" | "Followers";


export default function FeedScreen() {
  const [tab, setTab] = useState<FeedTab>("All");


  const {
    posts: FEED_POSTS,
    userId,
    toggleLike,
    followingIds = [],
    followerIds = [],
  } = useFeed();


  const navigate = useNavigate();
  const location = useLocation();


  function openPost(post: any) {
    navigate(`/post/${post.id}`, {
      state: { backgroundLocation: toBackgroundLocation(location) },
    });
  }


  const filteredPosts = useMemo(() => {
    const otherPosts = FEED_POSTS.filter((post) => post.user_id !== userId);


    if (tab === "Following") {
      return otherPosts.filter((post) => followingIds.includes(post.user_id));
    }


    if (tab === "Followers") {
      return otherPosts.filter((post) => followerIds.includes(post.user_id));
    }


    return otherPosts;
  }, [FEED_POSTS, userId, tab, followingIds, followerIds]);


  const emptyMessage = useMemo(() => {
    if (tab === "Following") {
      return "You're not following anyone with posts yet. Follow people to see their posts here.";
    }
    if (tab === "Followers") {
      return "None of your followers have posted yet.";
    }
    return "No posts yet. Check back later!";
  }, [tab]);


  return (
    <div className="screen">
      <div style={{ padding: "56px 24px 0", background: "linear-gradient(180deg, #f9f9f9 0%, #f1f0fa 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#6666aa",
              letterSpacing: "-0.02em",
              fontFamily: "DM Serif Text, serif",
              fontStyle: "italic",
            }}
          >
            Discovery
          </h1>
        </div>


        <FeedTabs tab={tab} setTab={setTab} />
      </div>


      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "16px 16px 0" }}>
        {filteredPosts.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "#888",
              fontSize: 15,
              padding: "48px 24px",
              lineHeight: 1.5,
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          filteredPosts.map((post) => (
            <Post
              key={post.id}
              post={post}
              currentUserId={userId}
              toggleLike={toggleLike}
              onOpenPost={openPost}
            />
          ))
        )}
      </div>
    </div>
  );
}