import { useState, useRef, useEffect, useCallback } from "react";

type Props = {
  onBack: () => void;
  onSubmit: (media: { type: "photo" | "video"; src: string }) => void;
};

const MAX_RECORD_SECONDS = 15;
const RING_RADIUS = 42;
const RING_STROKE = 4;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function HootItScreen({ onBack, onSubmit }: Props) {
  const [mode, setMode] = useState<"photo" | "video">("photo");
  const [captured, setCaptured] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<"photo" | "video">("photo");
  const [isRecording, setIsRecording] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<"idle" | "requesting" | "granted" | "denied">("idle");

  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const startCamera = useCallback(async () => {
    setPermissionState("requesting");
    setCameraError(null);
    streamRef.current?.getTracks().forEach((t) => t.stop());

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1080 }, height: { ideal: 1440 } },
        audio: mode === "video",
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermissionState("granted");
    } catch (err) {
      setPermissionState("denied");
      setCameraError(err instanceof Error ? err.message : "Could not access camera");
    }
  }, [facingMode, mode]);

  useEffect(() => {
    if (!captured) startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode, mode, captured]);

  // Countdown / progress ring ticker while recording
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now();
      tickRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;
        setElapsedMs(elapsed);
        if (elapsed >= MAX_RECORD_SECONDS * 1000) {
          stopRecording();
        }
      }, 100);
    } else {
      if (tickRef.current) window.clearInterval(tickRef.current);
      setElapsedMs(0);
    }
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRecording]);
  
  useEffect(() => {
    if (capturedType === "video" && previewVideoRef.current) {
      previewVideoRef.current.srcObject = null;
      previewVideoRef.current.load();
    }
  }, [captured, capturedType]);

  function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video");
    setCapturedType(isVideo ? "video" : "photo");
    setCaptured(url);
  }

  function flipCamera() {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  }

  function takePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedType("photo");
    setCaptured(dataUrl);
  }

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setTimeout(() => {
        setCapturedType("video");
        setCaptured(url);
      }, 300);
    };

    recorder.start();
    recorderRef.current = recorder;
    setIsRecording(true);
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }

  function handleShutterTap() {
    if (mode === "photo") {
      takePhoto();
      return;
    }
    // Video mode: toggle recording on/off with a single tap
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  function handleRetake() {
    setCaptured(null);
    startCamera();
  }

  const progress = Math.min(elapsedMs / (MAX_RECORD_SECONDS * 1000), 1);
  const dashOffset = RING_CIRCUMFERENCE * (1 - progress);
  const secondsLeft = Math.max(0, MAX_RECORD_SECONDS - Math.floor(elapsedMs / 1000));

  if (captured) {
    return (
      <div style={{ minHeight: "100dvh", background: "#000", display: "flex", flexDirection: "column" }}>
        <div style={{ flex: 1, position: "relative", display: "flex", minHeight: "100%" }}>
          {capturedType === "video" ? (
            <video
              ref={previewVideoRef}
              src={captured}
              controls
              loop
              playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover", alignSelf: "center" }}
            />
          ) : (
            <img src={captured} alt="Captured" style={{ width: "100%", objectFit: "cover", alignSelf: "center" }} />
          )}

          <button
            onClick={onBack}
            style={{
              position: "absolute", top: 56, left: 20, width: 40, height: 40, borderRadius: "50%",
              background: "rgba(45,40,67,0.16)", backdropFilter: "blur(8px)", display: "flex",
              alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px", background: "#FFFFFF", display: "flex", gap: 12 }}>
          <button
            onClick={handleRetake}
            style={{
              flex: 1, padding: "16px", background: "#F2F1FB", border: "1px solid #D7D7EC",
              borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#2D2843",
            }}
          >
            Retake
          </button>
          <button
            onClick={() => onSubmit({ type: capturedType, src: captured })}
            style={{
              flex: 2, padding: "16px",
              background: "linear-gradient(135deg, #4F7FFA 0%, #6B5CF6 100%)",
              borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#fff",
              boxShadow: "0 4px 20px rgba(79,127,250,0.3)",
            }}
          >
            Use this 🦉
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F9F9F9", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, position: "relative", background: "#F9F9F9", overflow: "hidden", display: "flex" }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: facingMode === "user" ? "scaleX(-1)" : "none",
            display: permissionState === "granted" ? "block" : "none",
            alignSelf: "center"
          }}
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {permissionState !== "granted" && (
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center", padding: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>📷</div>
            <p style={{ fontSize: 13, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>
              {permissionState === "requesting" && "Requesting camera access..."}
              {permissionState === "denied" && (cameraError || "Camera access denied. Check permissions.")}
              {permissionState === "idle" && "Starting camera..."}
            </p>
          </div>
        )}

        {isRecording && (
          <div
            style={{
              position: "absolute", top: 56, left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              background: "rgba(239,68,68,0.9)", borderRadius: 20,
            }}
          >
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "DM Sans, sans-serif" }}>
              0:{elapsedMs < 10000 ? "0" : ""}{Math.floor(elapsedMs / 1000)}
            </span>
          </div>
        )}

        <button
          onClick={onBack}
          style={{ position: "absolute", top: 56, left: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(45,40,67,0.16)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2D2843" }}
        >
          ✕
        </button>

        <button
          onClick={flipCamera}
          style={{ position: "absolute", top: 56, right: 20, width: 40, height: 40, borderRadius: "50%", background: "rgba(45,40,67,0.16)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#2D2843" }}
        >
          🔄
        </button>
      </div>

      <div style={{ background: "#FFFFFF", padding: "24px 32px 40px" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 28 }}>
          {(["photo", "video"] as const).map((m) => (
            <button
              key={m}
              onClick={() => !isRecording && setMode(m)}
              disabled={isRecording}
              style={{
                fontSize: 13, fontWeight: 700, fontFamily: "Outfit, sans-serif",
                color: mode === m ? "#2D2843" : "#6666AA", letterSpacing: "0.08em",
                textTransform: "uppercase", borderBottom: mode === m ? "2px solid #4F7FFA" : "2px solid transparent",
                paddingBottom: 4, transition: "all 0.15s", opacity: isRecording ? 0.4 : 1,
              }}
            >
              {m}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isRecording}
            style={{
              width: 52, height: 52, borderRadius: 12, background: "#F2F1FB",
              border: "1px solid #D7D7EC", display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 22, opacity: isRecording ? 0.4 : 1,
            }}
          >
            🖼️
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" style={{ display: "none" }} onChange={handleGallery} />

          {/* Shutter with progress ring */}
          <div style={{ position: "relative", width: 92, height: 92, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {mode === "video" && (
              <svg
                width={92}
                height={92}
                style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
              >
                <circle
                  cx={46}
                  cy={46}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={RING_STROKE}
                />
                <circle
                  cx={46}
                  cy={46}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth={RING_STROKE}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.1s linear" }}
                />
              </svg>
            )}

            <button
              onClick={handleShutterTap}
              disabled={permissionState !== "granted"}
              style={{
                width: 76, height: 76, borderRadius: "50%",
                background: isRecording ? "#EF4444" : "#fff",
                border: "4px solid rgba(255,255,255,0.3)",
                boxShadow: isRecording ? "0 0 24px rgba(239,68,68,0.5)" : "0 0 20px rgba(255,255,255,0.2)",
                transition: "all 0.15s", transform: isRecording ? "scale(0.92)" : "scale(1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                opacity: permissionState === "granted" ? 1 : 0.5,
              }}
            >
              {mode === "video" && (
                <div style={{ width: isRecording ? 24 : 0, height: isRecording ? 24 : 0, background: "#EF4444", borderRadius: 4, transition: "all 0.15s" }} />
              )}
            </button>
          </div>

          <div style={{ width: 52, height: 52 }} />
        </div>

        {isRecording && (
          <p style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#6666AA", fontFamily: "DM Sans, sans-serif" }}>
            {secondsLeft}s left · tap to stop
          </p>
        )}
      </div>
    </div>
  );
}