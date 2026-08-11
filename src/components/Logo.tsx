const COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#4285F4", "#34A853", "#EA4335", "#4285F4", "#34A853", "#EA4335", "#FBBC05"];

export default function Logo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const cls = size === "lg" ? "text-6xl font-medium" : "text-[22px] font-medium leading-none";
  return (
    <span className={`${cls} tracking-tight select-none whitespace-nowrap`}>
      {"ShimSearch".split("").map((c, i) => (
        <span key={i} style={{ color: COLORS[i] }}>{c}</span>
      ))}
    </span>
  );
}
