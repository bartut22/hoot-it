import { useState, useRef, useEffect } from "react";

type OtpInputProps = {
  length?: number;
  onComplete: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
};

export function OtpInput({ length = 6, onComplete, error, disabled }: OtpInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => setShake(false), 400);
      return () => clearTimeout(t);
    }
  }, [error]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  function updateDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    next[index] = value.slice(-1);
    setDigits(next);

    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    const joined = next.join("");
    if (joined.length === length && !next.includes("")) {
      onComplete(joined);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    pasted.split("").forEach((char, i) => (next[i] = char));
    setDigits(next);
    const lastFilled = Math.min(pasted.length, length) - 1;
    inputRefs.current[lastFilled]?.focus();
    if (pasted.length === length) onComplete(pasted);
  }

  return (
    <div
      style={{
        display: "flex",
        gap: 10,
        justifyContent: "center",
        animation: shake ? "otp-shake 0.4s ease" : "none",
      }}
    >
      <style>{`
        @keyframes otp-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
      `}</style>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => updateDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          style={{
            width: 48,
            height: 56,
            textAlign: "center",
            fontSize: 22,
            fontWeight: 700,
            fontFamily: "Outfit, sans-serif",
            color: "#F0F0FF",
            background: "#1A1A35",
            border: `1.5px solid ${error ? "#EF4444" : digit ? "#4F7FFA" : "#2A2A50"}`,
            borderRadius: 12,
            outline: "none",
            transition: "border-color 0.15s",
          }}
        />
      ))}
    </div>
  );
}