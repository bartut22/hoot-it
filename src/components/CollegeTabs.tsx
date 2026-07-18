import { useRef, useEffect } from "react"
import { useScrollHintToast } from "@/hooks/useScrollHintToast"

export default function CollegeTabs({ allTabs, tab, setTab }: any) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const { visible, handleWheel } = useScrollHintToast()

  useEffect(() => {
    const el = scrollRef.current
    if (!el) {
      console.log('scrollRef.current is null!') // add this to confirm
      return
    }
    el.addEventListener('wheel', handleWheel, { passive: true })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel]) 

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scrollRef}
        style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 16, marginLeft: -24, marginRight: -24, paddingLeft: 24, paddingRight: 24 }}
      >
        {allTabs.map((t: string) => (
          <button key={t} onClick={() => setTab(t)} style={{
                flexShrink: 0,
                padding: "8px 16px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "Outfit, sans-serif",
                background: tab === t ? "#4F7FFA" : "#131328",
                color: tab === t ? "#fff" : "#6666AA",
                border: tab === t ? "none" : "1px solid #1E1E3E",
                transition: "all 0.15s",
              }}>
            {t}
          </button>
        ))}
      </div>

      {visible && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(20,20,40,0.95)',
            color: '#F0F0FF',
            fontSize: 12,
            fontWeight: 600,
            padding: '8px 14px',
            borderRadius: 20,
            border: '1px solid #2A2A50',
            whiteSpace: 'nowrap',
            zIndex: 100,
            fontFamily: 'DM Sans, sans-serif',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        >
          💡 Tip: hold Shift while scrolling to move sideways
        </div>
      )}
    </div>
  )
}