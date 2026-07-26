import { useEffect, useState } from "react";
import { Routes, Route, useParams, useNavigate, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import LeaderboardScreen from "./screens/LeaderboardScreen";
import ChallengesScreen from "./screens/ChallengesScreen";
import HootItScreen from "./screens/HootItScreen";
import SubmitScreen from "./screens/SubmitScreen";
import FeedScreen from "./screens/FeedScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProgressScreen from "./screens/ProgressScreen";
import AdminScreen from "./screens/AdminScreen";
import { useChallenges } from "./hooks/useChallenges";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import ProfileSettingsScreen from "./screens/ProfileSettingsScreen";
import StartScreen from "./screens/StartScreen";
import AuthCallback from "./components/AuthCallback";
import { Toaster } from "sonner";
import OnboardingScreen from "./screens/OnboardingScreen";
import FollowListScreen from "./screens/FollowListScreen";
import PostScreen from "./screens/PostScreen";

type Tab = "leaderboard" | "feed" | "challenges" | "profile" | "progress";

type Modal =
  | { kind: "none" }
  | { kind: "hootit"; challengeId: number }
  | { kind: "submit"; challengeId: number; media: { type: "photo" | "video"; src: string } }
  | { kind: "admin" };

type BackgroundLocation = {
  pathname: string;
  search: string;
  hash: string;
};

function ProfileRoute({ session, stacked = false }: { session: Session; stacked?: boolean }) {
  const { handle } = useParams();

  if (!handle) {
    return (
      <ProfileScreen
        isOwn={true}
        userId={session.user.id}
        viewerId={session.user.id}
        stacked={stacked}
      />
    );
  }

  return <ProfileByHandle handle={handle} sessionUserId={session.user.id} stacked={stacked} />;
}

function ProfileByHandle({
  handle,
  sessionUserId,
  stacked = false,
}: {
  handle: string;
  sessionUserId: string;
  stacked?: boolean;
}) {
  const [userId, setUserId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const cleanHandle = handle.startsWith("@") ? handle.slice(1) : handle;
    setUserId(null);
    setNotFound(false);

    supabase
      .from("profiles")
      .select("id")
      .eq("handle", cleanHandle)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) setNotFound(true);
        else setUserId(data.id);
      });
  }, [handle]);

  if (notFound) return <p>User not found.</p>;
  if (!userId) return <p>Loading...</p>;

  return (
    <ProfileScreen
      isOwn={userId === sessionUserId}
      userId={userId}
      viewerId={sessionUserId}
      stacked={stacked}
    />
  );
}

function FollowListRoute({
  session,
  kind,
}: {
  session: Session;
  kind: "followers" | "following";
}) {
  const { handle } = useParams();
  if (!handle) return null;

  return (
    <FollowListScreen
      sessionUserId={session.user.id}
      handle={handle}
      kind={kind}
    />
  );
}

function MainApp({ session, modal, setModal, CHALLENGES }: any) {
  const navigate = useNavigate();
  const location = useLocation();

  const backgroundLocation = location.state?.backgroundLocation as BackgroundLocation | undefined;
  const isStackOpen = !!backgroundLocation;
  const baseLocation = backgroundLocation || location;

  const tab: Tab =
    baseLocation.pathname.startsWith("/profile")
      ? "profile"
      : (baseLocation.pathname.slice(1) as Tab) || "challenges";

  function handleTabChange(next: Tab) {
    if (next === "profile") navigate("/profile");
    else navigate(`/${next}`);
  }

  if (modal.kind === "admin") {
    return (
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: 0,
            display: "flex",
            justifyContent: "flex-end",
            padding: "16px",
            zIndex: 300,
            pointerEvents: "none",
          }}
        >
          <button
            onClick={() => setModal({ kind: "none" })}
            style={{
              pointerEvents: "all",
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(12px)",
              border: "1px solid #D7D7EC",
              borderRadius: 20,
              padding: "8px 16px",
              fontSize: 13,
              fontWeight: 700,
              color: "#2D2843",
              fontFamily: "Outfit, sans-serif",
              cursor: "pointer",
            }}
          >
            ← Back
          </button>
        </div>
        <AdminScreen />
      </div>
    );
  }

  if (modal.kind === "hootit") {
    return (
      <HootItScreen
        onBack={() => setModal({ kind: "none" })}
        onSubmit={(media: any) =>
          setModal({ kind: "submit", challengeId: modal.challengeId, media })
        }
      />
    );
  }

  if (modal.kind === "submit") {
    const challenge = CHALLENGES.find((c: any) => c.id === modal.challengeId);
    return (
      <SubmitScreen
        media={modal.media}
        challengeId={modal.challengeId}
        challengeName={challenge?.name ?? "Challenge"}
        onBack={() => setModal({ kind: "hootit", challengeId: modal.challengeId })}
        onDone={() => {
          setModal({ kind: "none" });
          handleTabChange("challenges");
        }}
      />
    );
  }

  return (
    <>
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 200 }}>
        <button
          onClick={() => setModal({ kind: "admin" })}
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: "1px solid #D7D7EC",
            borderRadius: 20,
            padding: "7px 14px",
            fontSize: 12,
            fontWeight: 700,
            color: "#9999CC",
            fontFamily: "Outfit, sans-serif",
            cursor: "pointer",
          }}
        >
          🛡️ Admin
        </button>
      </div>

      <Routes location={baseLocation}>
        <Route
          path="/"
          element={
            <ChallengesScreen
              onHootIt={(id: number) => setModal({ kind: "hootit", challengeId: id })}
            />
          }
        />
        <Route path="/leaderboard" element={<LeaderboardScreen />} />
        <Route path="/feed" element={<FeedScreen />} />
        <Route path="/challenges" element={<ChallengesScreen onHootIt={(id: number) => setModal({ kind: "hootit", challengeId: id })} />} />
        <Route path="/progress" element={<ProgressScreen userId={session.user.id} />} />
        <Route path="/profile" element={<ProfileRoute session={session} />} />
        <Route path="/profile/:handle" element={<ProfileRoute session={session} />} />
        <Route path="/settings" element={<ProfileSettingsScreen />} />
      </Routes>

      {backgroundLocation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "100%",
            // maxWidth: "430px",
            zIndex: 400,
            background: "#F9F9F9",
            overflowY: "auto",
          }}
        >
          <Routes>
            <Route path="/profile/:handle" element={<ProfileRoute session={session} stacked />} />
            <Route
              path="/profile/:handle/followers"
              element={<FollowListRoute session={session} kind="followers" />}
            />
            <Route
              path="/profile/:handle/following"
              element={<FollowListRoute session={session} kind="following" />}
            />
            <Route
              path="/post/:postId"
              element={<PostScreen stacked />}
            />
          </Routes>
        </div>
      )}

      {!isStackOpen && <BottomNav active={tab} onChange={handleTabChange} />}
    </>
  );
}

export default function App() {
  const [modal, setModal] = useState<Modal>({ kind: "none" });
  const [showTimer, setShowTimer] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { challenges: CHALLENGES } = useChallenges();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/onboarding" element={<OnboardingScreen session={session} />} />
        <Route
          path="*"
          element={
            loading
              ? null
              : !session || showTimer
                ? <StartScreen userId={session?.user.id} onStartNow={() => setShowTimer(false)} />
                : <MainApp session={session} modal={modal} setModal={setModal} CHALLENGES={CHALLENGES} />
          }
        />
      </Routes>
    </>
  );
}