type Tab = "leaderboard" | "feed" | "challenges" | "profile" | "progress";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; icon: string; label: string }[] = [
  { id: "leaderboard", icon: "🏆", label: "Board" },
  { id: "feed", icon: "🧭", label: "Discovery" },
  { id: "challenges", icon: "🦉", label: "Hoot It" },
  { id: "profile", icon: "👤", label: "Me" },
  { id: "progress", icon: "📈", label: "Progress" },
];

export default function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 430,
        background: "rgba(13,13,22,0.95)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid var(--border)",
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              padding: "10px 4px",
              transition: "opacity 0.15s",
              opacity: isActive ? 1 : 0.5,
            }}
          >
            <span style={{ fontSize: tab.id === "challenges" ? 22 : 20, lineHeight: 1 }}>
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "Outfit, sans-serif",
                fontWeight: 600,
                color: isActive ? "var(--gold)" : "var(--text-muted)",
                letterSpacing: "0.04em",
              }}
            >
              {tab.label}
            </span>
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  bottom: "calc(100% - 2px)",
                  width: 24,
                  height: 2,
                  background: "var(--gold)",
                  borderRadius: 2,
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
