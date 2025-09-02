interface BackgroundGlowProps {
  hoveredCard: "rock" | "paper" | "scissors" | null;
}

export default function BackgroundGlow({ hoveredCard }: BackgroundGlowProps) {
  const getColorScheme = () => {
    if (!hoveredCard) return null;

    const schemes = {
      rock: {
        primary: "rgba(59, 130, 246, 0.8)", // blue
        secondary: "rgba(147, 51, 234, 0.6)", // purple
      },
      scissors: {
        primary: "rgba(147, 51, 234, 0.8)", // purple
        secondary: "rgba(147, 51, 234, 0.6)", // pink
      },
      paper: {
        primary: "rgba(16, 185, 129, 0.8)", // teal
        secondary: "rgba(59, 130, 246, 0.6)", // blue
      },
    };

    return schemes[hoveredCard];
  };

  if (!hoveredCard) return null;

  const colors = getColorScheme();
  if (!colors) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Left side glow - only 1/5 of screen */}
      <div
        className="absolute inset-0 transition-all duration-2000 ease-out"
        style={{
          background: `linear-gradient(to right, ${colors.secondary.replace(
            "0.8",
            "0.3"
          )} 0%, ${colors.primary.replace(
            "0.8",
            "0.15"
          )} 10%, transparent 20%)`,
          filter: "blur(60px)",
          opacity: 0.6,
        }}
      />

      {/* Right side glow - only 1/5 of screen */}
      <div
        className="absolute inset-0 transition-all duration-2000 ease-out"
        style={{
          background: `linear-gradient(to left, ${colors.secondary.replace(
            "0.6",
            "0.3"
          )} 0%, ${colors.secondary.replace(
            "0.6",
            "0.15"
          )} 10%, transparent 20%)`,
          filter: "blur(60px)",
          opacity: 0.6,
        }}
      />

      {/* Top left glow - 1/3 from left */}
      <div
        className="absolute inset-0 transition-all duration-2000 ease-out"
        style={{
          background: `radial-gradient(ellipse 100% 50% at 0% 0%, ${colors.primary.replace(
            "0.8",
            "0.3"
          )} 0%, ${colors.primary.replace("0.8", "0.1")} 30%, transparent 50%)`,
          filter: "blur(60px)",
          opacity: 0.4,
        }}
      />

      {/* Top right glow - 1/3 from right */}
      <div
        className="absolute inset-0 transition-all duration-2000 ease-out"
        style={{
          background: `radial-gradient(ellipse 100% 50% at 100% 0%, ${colors.secondary.replace(
            "0.6",
            "0.3"
          )} 0%, ${colors.secondary.replace(
            "0.6",
            "0.1"
          )} 30%, transparent 50%)`,
          filter: "blur(60px)",
          opacity: 0.4,
        }}
      />
    </div>
  );
}
