import { TrophyIcon, CompassIcon, OwlIcon, UserIcon, TrendUpIcon } from "./icons";

type Tab = "leaderboard" | "feed" | "challenges" | "profile" | "progress";

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const tabs: { id: Tab; Icon: typeof TrophyIcon; label: string }[] = [
  { id: "leaderboard", Icon: TrophyIcon, label: "Board" },
  { id: "feed", Icon: CompassIcon, label: "Discovery" },
  { id: "challenges", Icon: OwlIcon, label: "Hoot It" },
  { id: "profile", Icon: UserIcon, label: "Me" },
  { id: "progress", Icon: TrendUpIcon, label: "Progress" },
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
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid #E6E4F5",
        display: "flex",
        zIndex: 100,
        paddingBottom: "env(safe-area-inset-bottom, 8px)",
        boxShadow: "0 -6px 24px rgba(45,40,67,0.05)",
      }}
    >
      {tabs.map(({ id, Icon, label }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            className="tap"
            style={{
              flex: 1,
              minHeight: 52,
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "9px 4px 8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                borderRadius: 10,
                background: isActive ? "rgba(102,102,170,0.12)" : "transparent",
                color: isActive ? "#6666AA" : "#ADABCE",
                transform: isActive ? "translateY(-1px)" : "none",
                transition: "all 0.18s ease",
              }}
            >
              <Icon size={19} strokeWidth={isActive ? 2 : 1.75} />
            </div>
            <span
              style={{
                fontSize: 10,
                fontFamily: "Outfit, sans-serif",
                fontWeight: isActive ? 700 : 600,
                color: isActive ? "#6666AA" : "#ADABCE",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </span>
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  right: "32%",
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#F5A623",
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}