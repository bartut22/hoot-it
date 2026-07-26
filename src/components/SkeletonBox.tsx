export default function SkeletonBox({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #F2F1FB 0%, #E6E4F5 50%, #F2F1FB 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}