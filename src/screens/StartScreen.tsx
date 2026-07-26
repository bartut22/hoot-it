import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile"
import { useAuthUser } from "@/hooks/useAuthUser";
import { supabase } from "@/lib/supabase";

const DROP_DATE = new Date("2026-08-16T00:00:00");

function getTimeLeft() {
  const now = new Date();
  const diff = DROP_DATE.getTime() - now.getTime();
  if (diff <= 0) return null;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

function Digit({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
      <div
        style={{
          background: "#D9D9D9",
          borderRadius: 16,
          width: "auto",
          height: "auto",
          padding: "16px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, rgba(79,127,250,0.08) 0%, transparent 50%, rgba(79,127,250,0.04) 100%)",
          }}
        />
        <span
          style={{
            fontFamily: "Outfit, sans-serif",
            fontSize: 42,
            fontWeight: 800,
            color: "#2d2843",
            lineHeight: 1,
            letterSpacing: "-0.02em",
          }}
        >
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span
        style={{
          fontSize: 14,
          fontFamily: "DM Serif Text, serif",
          fontWeight: 400,
          fontStyle: "italic",
          color: "#B5ADDA",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function StartScreen({ userId, onStartNow }: { userId?: string; onStartNow: () => void }) {
  const { userId: authUserId, authLoading } = useAuthUser();
  const [time, setTime] = useState(getTimeLeft());
  const { profile } = useProfile(userId);

  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  if (authLoading) return <p>Loading...</p>
  // if (authUserId !== userId) return <p>Not authorized to view this timer.</p>
  // if (!profile) return <p>Profile not found.</p>

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "48px 24px",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(30deg, #F9F9F9 0%, #F1F0FA 100%)",
        fontFamily: "DM Serif Text, serif"
      }}
    >
      <div
        style={{
          borderRadius: "32px",
          background: "gray",
          width: "100%",
          overflow: "hidden",
          height: "calc(100dvh - 96px)",
          display: "flex",
          flexDirection: "column",
          fontFamily: "DM Serif Text, serif"
        }}
      >
        <div
          style={{
            flexGrow: 1,
            width: "100%",
            background: `url("../../rice.jpg") no-repeat 52.5% center`,
            backgroundSize: "cover",
            marginBottom: "-32px",
            fontFamily: "DM Serif Text, serif"
          }}
        >
          <div
            style={{
              borderRadius: "32px",
              background: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(10px)",
              margin: "20px",
              color: "white",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
              display: "flex",
              position: "relative",
              alignItems: "center",
              flexDirection: "column",
              paddingLeft: "32px",
              paddingRight: "32px",
              justifyContent: "center"
            }}
          >
            <span
              style={{
                position: "absolute",
                fontSize: "2rem",
                top: "24px",
                left: "calc(50% - 2ch)",
                transform: "translate(-50%, -50%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >🦉</span>
            <h1 style={{
              fontFamily: "DM Serif Text, serif",
              fontWeight: 400,
              fontStyle: "italic",
              fontSize: "4rem",
              // verticalAlign: "bottom",
            }}>owlquest</h1>
            <h2 style={{
              fontFamily: "DM Serif Text, serif",
              fontWeight: 200, fontStyle: "italic",
              fontSize: "1.25rem",
              marginBottom: "16px",
              maxWidth: "24ch",
              textAlign: "center"
            }}>
              do challenges, earn points, and help your college win!
            </h2>
          </div>


        </div>
        <div
          style={{
            width: "100%",
            background: "white",
            border: "4px solid #2D2843",
            color: "#2D2843",
            borderRadius: "32px",
            padding: "32px",
            display: "flex",
            gap: "16px",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "space-between",
            fontFamily: "DM Serif Text, serif"
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}>
            <h1 style={{ fontFamily: "DM Serif Text, serif", fontWeight: 400, fontStyle: "italic", fontSize: "1.75rem" }}>challenges drop in:</h1>
            <div style={{
              display: "flex",
              flexDirection: "row",
              gap: "1rem",
              justifyContent: "center"
            }}>
              <Digit
                value={time?.days ?? 0}
                label="days"
              />
              <Digit
                value={time?.hours ?? 0}
                label="hours"
              />
              <Digit
                value={time?.minutes ?? 0}
                label="min"
              />
              <Digit
                value={time?.seconds ?? 0}
                label="sec"
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center", justifyContent: "center", width: "100%" }}>
            {profile?.handle ? (
              <p style={{ fontFamily: "DM Serif Text, serif", fontWeight: 400, fontStyle: "italic", fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                signed in as <strong>{profile.display_name ?? profile.handle} (@{profile.handle})</strong>
                <a
                  href="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    await supabase.auth.signOut();
                  }}
                  style={{
                    color: "#E4362D",
                    fontWeight: 700,
                    fontSize: "1.2rem",
                    textDecoration: "none",
                    lineHeight: 1,
                    cursor: "pointer",
                  }}
                  aria-label="Log out"
                >
                  ×
                </a>
              </p>
            ) : (
              <>
                <p style={{ fontFamily: "DM Serif Text, serif", fontWeight: 400, fontStyle: "italic", fontSize: "1rem" }}>
                  make an account before they drop!
                </p>

                <button
                  onClick={async () => {
                    const search = window.location.search;

                    // const { data, error } = await supabase.auth.signInWithOAuth({
                    await supabase.auth.signInWithOAuth({
                      provider: "google",
                      options: {
                        redirectTo: window.location.origin + "/auth/callback" + search,
                      },
                    });
                  }}
                  style={{
                    backgroundColor: '#4F7FFA',
                    color: 'white',
                    fontWeight: 300,
                    fontSize: "1.1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: '0.5rem',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: "center",
                    alignItems: 'center',
                    width: "100%",
                    gap: '1rem'
                  }}
                >
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ display: "block", width: 24, height: 24 }}>
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                  <p>Continue with Google</p>
                </button>
              </>
            )}

            {profile?.is_admin && onStartNow && (
              <button
                onClick={onStartNow}
                style={{
                  marginTop: 8,
                  background: "transparent",
                  border: "1px solid #2D2843",
                  color: "#2D2843",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  padding: "10px 16px",
                  borderRadius: 12,
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                🛡️ Start Now (Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* {time && (
        <div style={{ display: "flex", gap: 12, marginBottom: 48 }}>
          <Digit value={time.days} label="Days" />
          <div style={{ display: "flex", alignItems: "center", paddingBottom: 24 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--border2)" }}>:</span>
          </div>
          <Digit value={time.hours} label="Hours" />
          <div style={{ display: "flex", alignItems: "center", paddingBottom: 24 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--border2)" }}>:</span>
          </div>
          <Digit value={time.minutes} label="Min" />
          <div style={{ display: "flex", alignItems: "center", paddingBottom: 24 }}>
            <span style={{ fontSize: 32, fontWeight: 800, color: "var(--border2)" }}>:</span>
          </div>
          <Digit value={time.seconds} label="Sec" />
        </div>
      )} */}
    </div>
  );
}
